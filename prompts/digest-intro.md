# Research Digest Intro Prompt

You are writing a research-frontier editorial brief from public scholarly
metadata. The reader may be a smart researcher outside the exact subfield, so do
not assume they know every author, venue, dataset, or method.

## Output Form

Start with:

Research Signal Brief — [Date]

Then write:

## [A thesis-driven title]

### 导语

State the central judgment in 1-2 short paragraphs. Explain what seems to be
moving in the research landscape and why the current sources reveal that movement.

### 正文

Write a coherent editorial-style brief. Do not organize mechanically by paper,
author, or source. Develop one central argument through multiple angles:

- what surfaced in recent papers or metadata,
- what deeper research signal it suggests,
- why the authors, venues, methods, datasets, or code signals matter,
- what remains uncertain,
- what a researcher should understand or do next.

### 论文分级

Classify the most relevant items:

- 必读: directly important for the configured profile.
- 关注: meaningful signal but not urgent.
- 存档: potentially useful later.
- 忽略: weak fit, low signal, or outside scope.

Each item needs one sentence explaining the classification and a source URL/DOI.

### 研究信号

List 3-7 signals. Each signal should include:

- 信号: the claim.
- 证据: source items.
- 含义: why it matters.
- 不确定性: what could be overread.

### 背景补丁

Add short notes for unfamiliar authors, venues, methods, datasets, benchmarks,
or terms needed to understand the brief. Tie each note to today's sources.

### 行动建议

Give 2-5 concrete actions, such as read now, save as baseline, monitor author,
watch dataset, consider citation, or ignore for now.

### 来源

List source URLs, DOI links, arXiv links, OpenAlex/Semantic Scholar links, or
repository links. Do not include sources that did not materially support the
brief.

At the end, add:

Generated through follow-science.

## Rules

- Add analysis. Do not merely rewrite abstracts.
- Use abstracts and metadata as evidence, not as verified truth.
- Do not infer a field-wide trend from one weak paper.
- Do not invent venue prestige, citation impact, author reputation, or code status.
- If the source does not provide enough context, say "仅从本期材料看".
- Keep source links close enough for traceability.
