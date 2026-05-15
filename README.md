# follow-science

`follow-science` is a configurable research-signal digest skill. It tracks public
scientific papers, authors, venues, repositories, and scholarly metadata, then
asks an AI agent to turn those updates into an editorial-style research brief
with a central thesis, background supplementation, paper triage, caveats, and
source traceability.

It is inspired by [`follow-builders`](https://github.com/zarazhangrui/follow-builders),
but it follows research signals rather than AI builders.

## What You Get

- A daily or weekly research-frontier brief.
- Configurable fields, keywords, authors, venues, and exclusions.
- Public metadata from arXiv, Crossref, OpenAlex, optional Semantic Scholar, and optional GitHub repository search.
- Paper triage: must-read, monitor, archive, ignore.
- Research-signal extraction: new problem framing, method-route movement, benchmark shifts, dataset/code release, author/team movement, venue trend, and possible citation/baseline relevance.
- Source URLs and DOI/arXiv links for traceability.
- Delivery by stdout, email via Resend, or Telegram.

## Philosophy

Do not follow papers as a list. Follow research signals.

A useful scientific digest should explain:

- what changed in the research landscape,
- why a paper or author matters,
- what is still uncertain,
- what a researcher should read, save, ignore, or act on,
- and which source supports each claim.

## Quick Start

Install dependencies:

```bash
npm --prefix scripts install
```

Create local configuration:

```bash
mkdir -p ~/.follow-science
cp config.example.json ~/.follow-science/config.json
cp .env.example ~/.follow-science/.env
```

Edit:

```text
~/.follow-science/config.json
~/.follow-science/.env
```

Prepare a feed:

```bash
npm --prefix scripts run prepare-digest
```

An AI agent should read the returned JSON, follow the prompts in `prompts/`, write
the final brief, then deliver it with:

```bash
node scripts/deliver.js --file /path/to/digest.txt
```

## Configuration

Use `config.example.json` as the template. The most important fields are:

```json
{
  "profile": {
    "name": "My Research Radar",
    "fields": ["your field"],
    "keywords": ["keyword A", "keyword B"],
    "negativeKeywords": ["exclude this"],
    "authors": [
      { "name": "Example Author", "openalexId": "" }
    ],
    "venues": ["Example Journal"],
    "arxivCategories": ["cs.AI"]
  },
  "output": {
    "language": "zh",
    "style": "editorial_brief",
    "frequency": "weekly"
  }
}
```

For stronger author tracking, add an OpenAlex author ID such as:

```json
{ "name": "Example Author", "openalexId": "https://openalex.org/A1234567890" }
```

## Privacy

Do not commit:

- `.env`
- real `config.json`
- API keys
- personal email addresses
- private reading lists
- unpublished manuscript notes

This repository only contains templates and public-source scripts.

## License

MIT. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
