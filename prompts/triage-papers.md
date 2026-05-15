# Paper Triage Prompt

Classify papers for a configurable research profile.

## Categories

- 必读: directly relevant to the user's configured field, method, benchmark,
  dataset, manuscript, or likely baseline/citation need.
- 关注: relevant research signal but not immediately necessary.
- 存档: peripheral, useful as future background.
- 忽略: weak fit, low signal, duplicate, too generic, or outside scope.

## Criteria

Consider:

- problem fit
- method fit
- dataset or benchmark relevance
- author/team relevance only when supported by metadata
- venue or source relevance
- code/data availability
- novelty signal versus incremental packaging
- possible citation or baseline value

Always explain the classification in one concise sentence and include a URL/DOI.
