#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const USER_DIR = join(homedir(), '.follow-science');
const CONFIG_PATH = join(USER_DIR, 'config.json');
const PROMPT_FILES = [
  'digest-intro.md',
  'triage-papers.md',
  'extract-signals.md',
  'background-notes.md',
  'translate.md'
];

const DEFAULT_CONFIG = {
  profile: {
    name: 'General Research Radar',
    fields: ['artificial intelligence', 'computational science'],
    keywords: ['large language model', 'scientific discovery', 'optimization'],
    negativeKeywords: [],
    authors: [],
    venues: [],
    arxivCategories: ['cs.AI', 'cs.LG'],
    repositoryKeywords: []
  },
  sources: {
    arxiv: true,
    crossref: true,
    openalex: true,
    semanticScholar: false,
    github: false,
    lookbackDays: 7,
    maxItemsPerSource: 20
  },
  output: {
    language: 'zh',
    style: 'editorial_brief',
    depth: 'medium'
  },
  delivery: { method: 'stdout' }
};

function mergeConfig(base, override) {
  const out = structuredClone(base);
  for (const [key, value] of Object.entries(override || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = { ...(out[key] || {}), ...value };
    } else {
      out[key] = value;
    }
  }
  return out;
}

function daysAgoISO(days) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function compactWhitespace(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

function escapeXml(text = '') {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function firstMatch(text, regex) {
  const m = text.match(regex);
  return m ? m[1] : '';
}

function allMatches(text, regex) {
  return [...text.matchAll(regex)].map(m => m[1]);
}

async function fetchJSON(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

function makeQueryTerms(profile) {
  const terms = [
    ...(profile.keywords || []),
    ...(profile.fields || [])
  ].map(compactWhitespace).filter(Boolean);
  return [...new Set(terms)];
}

function normalizeOpenAlexAuthorId(value = '') {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('https://openalex.org/')) return trimmed.split('/').pop();
  return trimmed;
}

function containsNegative(text, negativeKeywords = []) {
  const lower = text.toLowerCase();
  return negativeKeywords.some(k => lower.includes(String(k).toLowerCase()));
}

function normalizePaper(paper, profile) {
  const haystack = [
    paper.title,
    paper.abstract,
    paper.venue,
    ...(paper.authors || [])
  ].join(' ');
  return {
    ...paper,
    excludedByNegativeKeyword: containsNegative(haystack, profile.negativeKeywords || [])
  };
}

async function fetchArxiv(config) {
  const { profile, sources } = config;
  const max = sources.maxItemsPerSource || 20;
  const terms = makeQueryTerms(profile).slice(0, 8);
  const categories = profile.arxivCategories || [];
  const termQuery = terms.map(t => `all:"${t.replace(/"/g, '')}"`).join('+OR+');
  const catQuery = categories.map(c => `cat:${c}`).join('+OR+');
  const searchQuery = [termQuery, catQuery].filter(Boolean).join('+OR+') || 'all:science';
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(searchQuery)}&sortBy=submittedDate&sortOrder=descending&max_results=${max}`;
  const xml = await fetchText(url, { 'User-Agent': 'follow-science/1.0' });
  const entries = xml.split('<entry>').slice(1).map(x => x.split('</entry>')[0]);
  return entries.map(entry => normalizePaper({
    source: 'arxiv',
    id: compactWhitespace(escapeXml(firstMatch(entry, /<id>([\s\S]*?)<\/id>/))),
    title: compactWhitespace(escapeXml(firstMatch(entry, /<title>([\s\S]*?)<\/title>/))),
    abstract: compactWhitespace(escapeXml(firstMatch(entry, /<summary>([\s\S]*?)<\/summary>/))),
    authors: allMatches(entry, /<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g).map(x => compactWhitespace(escapeXml(x))),
    publishedAt: compactWhitespace(firstMatch(entry, /<published>([\s\S]*?)<\/published>/)),
    updatedAt: compactWhitespace(firstMatch(entry, /<updated>([\s\S]*?)<\/updated>/)),
    categories: allMatches(entry, /<category term="([^"]+)"/g),
    url: compactWhitespace(escapeXml(firstMatch(entry, /<id>([\s\S]*?)<\/id>/)))
  }, profile));
}

async function fetchCrossref(config) {
  const { profile, sources } = config;
  const max = sources.maxItemsPerSource || 20;
  const from = daysAgoISO(sources.lookbackDays || 7);
  const query = makeQueryTerms(profile).slice(0, 6).join(' ');
  const filter = `from-pub-date:${from},type:journal-article`;
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&filter=${encodeURIComponent(filter)}&sort=published&order=desc&rows=${max}`;
  const data = await fetchJSON(url, { 'User-Agent': 'follow-science/1.0 (mailto:example@example.com)' });
  return (data.message?.items || []).map(item => normalizePaper({
    source: 'crossref',
    id: item.DOI || item.URL,
    doi: item.DOI || '',
    title: compactWhitespace((item.title || [])[0] || ''),
    abstract: compactWhitespace((item.abstract || '').replace(/<[^>]+>/g, '')),
    authors: (item.author || []).slice(0, 12).map(a => compactWhitespace([a.given, a.family].filter(Boolean).join(' '))),
    venue: compactWhitespace((item['container-title'] || [])[0] || ''),
    publishedAt: item.published?.['date-time'] || item.created?.['date-time'] || '',
    url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : '')
  }, profile));
}

async function fetchOpenAlex(config) {
  const { profile, sources } = config;
  const max = sources.maxItemsPerSource || 20;
  const from = daysAgoISO(sources.lookbackDays || 7);
  const query = makeQueryTerms(profile).slice(0, 6).join(' ');
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=from_publication_date:${from}&sort=publication_date:desc&per-page=${max}`;
  const data = await fetchJSON(url, { 'User-Agent': 'follow-science/1.0' });
  return (data.results || []).map(work => normalizePaper({
    source: 'openalex',
    id: work.id,
    doi: work.doi || '',
    title: compactWhitespace(work.title || work.display_name || ''),
    abstract: '',
    authors: (work.authorships || []).slice(0, 12).map(a => compactWhitespace(a.author?.display_name || '')),
    venue: compactWhitespace(work.primary_location?.source?.display_name || ''),
    publishedAt: work.publication_date || '',
    citedByCount: work.cited_by_count ?? null,
    concepts: (work.concepts || []).slice(0, 8).map(c => c.display_name),
    url: work.doi || work.id
  }, profile));
}

async function fetchOpenAlexAuthorWorks(config) {
  const { profile, sources } = config;
  const max = Math.min(sources.maxItemsPerSource || 20, 20);
  const from = daysAgoISO(sources.lookbackDays || 7);
  const authors = (profile.authors || [])
    .map(a => ({ ...a, openalexId: normalizeOpenAlexAuthorId(a.openalexId) }))
    .filter(a => a.openalexId);
  const batches = [];
  for (const author of authors) {
    const url = `https://api.openalex.org/works?filter=authorships.author.id:${author.openalexId},from_publication_date:${from}&sort=publication_date:desc&per-page=${max}`;
    const data = await fetchJSON(url, { 'User-Agent': 'follow-science/1.0' });
    batches.push(...(data.results || []).map(work => normalizePaper({
      source: 'openalex_author_watch',
      watchedAuthor: author.name || author.openalexId,
      id: work.id,
      doi: work.doi || '',
      title: compactWhitespace(work.title || work.display_name || ''),
      abstract: '',
      authors: (work.authorships || []).slice(0, 12).map(a => compactWhitespace(a.author?.display_name || '')),
      venue: compactWhitespace(work.primary_location?.source?.display_name || ''),
      publishedAt: work.publication_date || '',
      citedByCount: work.cited_by_count ?? null,
      concepts: (work.concepts || []).slice(0, 8).map(c => c.display_name),
      url: work.doi || work.id
    }, profile)));
  }
  return batches;
}

async function fetchSemanticScholar(config) {
  const { profile, sources } = config;
  const max = Math.min(sources.maxItemsPerSource || 20, 20);
  const query = makeQueryTerms(profile).slice(0, 6).join(' ');
  const fields = [
    'title',
    'abstract',
    'authors',
    'year',
    'venue',
    'url',
    'externalIds',
    'citationCount',
    'publicationDate',
    'openAccessPdf'
  ].join(',');
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${max}&fields=${fields}`;
  const data = await fetchJSON(url, { 'User-Agent': 'follow-science/1.0' });
  return (data.data || []).map(p => normalizePaper({
    source: 'semantic_scholar',
    id: p.paperId,
    doi: p.externalIds?.DOI || '',
    arxivId: p.externalIds?.ArXiv || '',
    title: compactWhitespace(p.title || ''),
    abstract: compactWhitespace(p.abstract || ''),
    authors: (p.authors || []).slice(0, 12).map(a => compactWhitespace(a.name || '')),
    venue: compactWhitespace(p.venue || ''),
    publishedAt: p.publicationDate || (p.year ? String(p.year) : ''),
    citationCount: p.citationCount ?? null,
    openAccessPdf: p.openAccessPdf?.url || '',
    url: p.url || ''
  }, profile));
}

async function fetchGithubRepos(config) {
  const { profile, sources } = config;
  if (!sources.github) return [];
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'follow-science/1.0'
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const max = Math.min(sources.maxItemsPerSource || 20, 20);
  const terms = [
    ...(profile.repositoryKeywords || []),
    ...makeQueryTerms(profile).slice(0, 3)
  ].filter(Boolean);
  if (terms.length === 0) return [];
  const query = `${terms.join(' ')} sort:updated-desc`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${max}`;
  const data = await fetchJSON(url, headers);
  return (data.items || []).map(repo => ({
    source: 'github',
    name: repo.full_name,
    description: compactWhitespace(repo.description || ''),
    language: repo.language || '',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    url: repo.html_url,
    topics: repo.topics || []
  }));
}

async function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return DEFAULT_CONFIG;
  const raw = JSON.parse(await readFile(CONFIG_PATH, 'utf-8'));
  return mergeConfig(DEFAULT_CONFIG, raw);
}

async function loadPrompts() {
  const scriptDir = decodeURIComponent(new URL('.', import.meta.url).pathname);
  const localPromptsDir = join(scriptDir, '..', 'prompts');
  const userPromptsDir = join(USER_DIR, 'prompts');
  const prompts = {};
  for (const filename of PROMPT_FILES) {
    const key = filename.replace('.md', '').replace(/-/g, '_');
    const userPath = join(userPromptsDir, filename);
    const localPath = join(localPromptsDir, filename);
    if (existsSync(userPath)) {
      prompts[key] = await readFile(userPath, 'utf-8');
    } else if (existsSync(localPath)) {
      prompts[key] = await readFile(localPath, 'utf-8');
    }
  }
  return prompts;
}

async function runSource(name, enabled, fn, errors) {
  if (!enabled) return [];
  try {
    return await fn();
  } catch (err) {
    errors.push(`${name}: ${err.message}`);
    return [];
  }
}

function dedupePapers(papers) {
  const seen = new Set();
  const out = [];
  for (const p of papers) {
    const key = (p.doi || p.arxivId || p.id || p.title).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

async function main() {
  const config = await loadConfig();
  const errors = [];
  const [arxiv, crossref, openalex, semanticScholar, repositories, prompts] = await Promise.all([
    runSource('arxiv', config.sources.arxiv, () => fetchArxiv(config), errors),
    runSource('crossref', config.sources.crossref, () => fetchCrossref(config), errors),
    runSource('openalex', config.sources.openalex, () => fetchOpenAlex(config), errors),
    runSource('semantic_scholar', config.sources.semanticScholar, () => fetchSemanticScholar(config), errors),
    runSource('github', config.sources.github, () => fetchGithubRepos(config), errors),
    loadPrompts()
  ]);

  const openalexAuthorWatch = await runSource(
    'openalex_author_watch',
    config.sources.openalex,
    () => fetchOpenAlexAuthorWorks(config),
    errors
  );

  const papers = dedupePapers([...arxiv, ...crossref, ...openalex, ...openalexAuthorWatch, ...semanticScholar])
    .filter(p => !p.excludedByNegativeKeyword);

  const output = {
    status: 'ok',
    generatedAt: new Date().toISOString(),
    config: {
      output: config.output,
      delivery: config.delivery,
      schedule: config.schedule,
      sources: config.sources
    },
    profile: config.profile,
    papers,
    repositories,
    stats: {
      papers: papers.length,
      repositories: repositories.length,
      bySource: {
        arxiv: arxiv.length,
        crossref: crossref.length,
        openalex: openalex.length,
        openalexAuthorWatch: openalexAuthorWatch.length,
        semanticScholar: semanticScholar.length,
        github: repositories.length
      }
    },
    prompts,
    errors: errors.length ? errors : undefined
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch(err => {
  console.error(JSON.stringify({ status: 'error', message: err.message }));
  process.exit(1);
});
