# follow-science

`follow-science` is a configurable research-intelligence skill for researchers
who do not want another paper list. It follows papers, authors, venues,
benchmarks, datasets, code repositories, and public scholarly metadata, then
turns them into a thesis-driven research brief with context, judgment, caveats,
and source links.

Inspired by [`follow-builders`](https://github.com/zarazhangrui/follow-builders),
but built around a different question:

> What is changing in a research field, and what should a researcher do with
> that change?

---

## 中文说明

`follow-science` 不是“论文标题订阅器”，也不是把 arXiv、期刊目录和 GitHub
仓库简单拼在一起的资讯流。它更像一个可配置的科研情报雷达：先收集公开科研信号，
再把这些信号加工成一篇有判断、有背景、有证据链的研究简报。

它的目标不是让你“知道今天又出了哪些论文”，而是帮你判断：

- 哪些新论文可能改变你的 baseline、benchmark、数据集或实验设计；
- 哪些作者、团队或机构正在持续推动某条技术路线；
- 哪些看似热闹的工作其实只是包装、综述或低相关噪声；
- 哪些代码、数据集或评测方式可能影响后续投稿和审稿预期；
- 哪些材料值得立刻读，哪些只需要存档，哪些可以直接忽略。

### 核心特色

**1. 跟踪科研信号，而不是罗列论文**

`follow-science` 默认输出的是一篇研究简报，而不是论文清单。论文、作者、
venue、代码仓库和 citation metadata 都只是证据，真正的输出是对研究方向变化的
解释。

**2. 不假设读者已经熟悉领域**

简报会补齐必要背景：作者是谁、venue 代表什么、benchmark 为什么重要、某个方法
为什么可能成为 baseline。它不默认你已经知道圈内大佬、术语和技术分支。

**3. 用户自定义研究雷达**

你可以配置自己的领域、关键词、排除词、作者、期刊会议、arXiv 类别和代码仓库关键词。
同一个 skill 可以服务 AI、能源、优化、生物医学、材料、社会科学等不同方向。

**4. 把信息差转成行动建议**

每期简报都应该回答“我接下来该做什么”：马上读、跟踪作者、保存代码、关注数据集、
考虑作为 citation / baseline，或者暂时忽略。

**5. 证据可追溯，结论要克制**

每个当前性判断都应能追溯到 DOI、arXiv、OpenAlex、Semantic Scholar 或 GitHub URL。
摘要中的 SOTA、显著提升和领域趋势只被视为作者主张，不直接当作事实。

### 它会跟踪什么

- arXiv 新论文
- Crossref 期刊论文元数据
- OpenAlex 论文、作者和 venue 信息
- 可选 Semantic Scholar 论文信息
- 可选 GitHub 代码仓库搜索
- 用户指定作者或团队的近期产出
- 用户指定关键词、排除词、领域和 arXiv 分类

### 默认输出形态

默认输出是中文研究简报，结构类似：

```text
Research Signal Brief — 日期

## 一个带判断的标题

### 导语
本期最重要的研究变化是什么？

### 正文
围绕一个中心判断展开分析，而不是按论文逐条罗列。

### 论文分级
必读 / 关注 / 存档 / 忽略

### 研究信号
信号、证据、含义、不确定性

### 背景补丁
补齐作者、方法、数据集、benchmark、venue 等背景。

### 行动建议
下一步该读什么、存什么、跟踪什么、忽略什么。

### 来源
列出支撑本期简报的 URL、DOI、arXiv、OpenAlex 或 GitHub 链接。
```

### 快速开始

安装依赖：

```bash
npm --prefix scripts install
```

创建本地配置：

```bash
mkdir -p ~/.follow-science
cp config.example.json ~/.follow-science/config.json
cp .env.example ~/.follow-science/.env
```

编辑：

```text
~/.follow-science/config.json
~/.follow-science/.env
```

准备科研信号 feed：

```bash
npm --prefix scripts run prepare-digest
```

AI agent 读取返回的 JSON 后，应根据 `prompts/` 中的提示词生成最终简报，再按配置
通过 stdout、Resend email 或 Telegram 发送。

### 配置重点

`config.example.json` 是模板。最重要的是研究画像：

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
    "depth": "medium"
  }
}
```

如果要更稳定地跟踪作者，建议补充 OpenAlex author ID：

```json
{ "name": "Example Author", "openalexId": "https://openalex.org/A1234567890" }
```

### 隐私边界

不要提交：

- `.env`
- 真实 `config.json`
- API keys
- 个人邮箱
- 私人阅读列表
- 未发表论文、审稿材料或内部研究笔记

本仓库只包含模板、公开源抓取脚本和 prompt。真正的个人研究画像应放在
`~/.follow-science/`。

---

## English Overview

`follow-science` is designed for research sensemaking rather than notification.
It collects public scholarly metadata and asks an AI agent to produce a compact
research brief that explains what changed, why it matters, what remains
uncertain, and what the reader should do next.

### What It Watches

- arXiv papers
- Crossref journal metadata
- OpenAlex works, authors, and venues
- Optional Semantic Scholar results
- Optional GitHub repository search
- User-defined authors, venues, fields, keywords, exclusions, and arXiv categories

### What It Produces

- A thesis-driven research brief
- Paper triage: must-read, monitor, archive, ignore
- Research signals: problem framing, method-route movement, benchmark shifts,
  dataset/code release, author/team movement, venue trend, and citation/baseline
  relevance
- Background notes for unfamiliar people, terms, venues, datasets, or methods
- Concrete action suggestions
- Source URLs for traceability

### Quick Start

```bash
npm --prefix scripts install
mkdir -p ~/.follow-science
cp config.example.json ~/.follow-science/config.json
cp .env.example ~/.follow-science/.env
npm --prefix scripts run prepare-digest
```

### Delivery

The generated brief can be printed to stdout, sent by email through Resend, or
sent to Telegram, depending on `~/.follow-science/config.json` and
`~/.follow-science/.env`.

## License

MIT. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
