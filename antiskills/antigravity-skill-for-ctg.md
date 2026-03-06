# 🌌 Antigravity Skill for CTG

This document consolidates all skills, Claude instructions, and Gemini instructions found across your specified local directories:
1. `Free Claude Code Skills`
2. `ui-ux-pro-max-skill-main`
3. `stitch-skills-main`
4. `marketingskills-main`

---

## 🟣 Section 1: Claude Code Instructions

### Skill Core Specification
Skills extend Claude's capabilities via `SKILL.md` files. Claude loads them automatically when relevant, or they can be invoked with `/skill-name`.

**File Structure for Skills:**
```
.claude/skills/<skill-name>/
├── SKILL.md           # Instructions (required)
├── template.md        # Optional template
├── examples/          # Optional examples
└── scripts/           # Optional scripts Claude can execute
```

**Skill Locations & Priority:**
1. **Personal**: `~/.claude/skills/<name>/SKILL.md` (All projects)
2. **Project**: `.claude/skills/<name>/SKILL.md` (Local project only)

**SKILL.md YAML Frontmatter:**
```yaml
---
name: my-skill              # Optional
description: What it does    # Used for auto-loading
argument-hint: [issue-num]   # Autocomplete hint
disable-model-invocation: true # Manual invoke only
allowed-tools: Read, Grep    # Auto-permission tools
context: fork                # Subagent isolation
---
```

**Key Features:**
- **String Substitutions**: `$ARGUMENTS`, `$N` (0-indexed args).
- **Dynamic Context Injection**: Use ` !`command` ` to run shell commands before sending content to Claude.
- **Self-Annealing**: Skills automatically patch themselves! If an error occurs (e.g. wrong API path), Claude fixes the `SKILL.md` or script permanently.
- **Thought Scaling**: Include the word "ultrathink" in skill content to enable deep reasoning.

---

## 🔵 Section 2: Gemini CLI / Antigravity Instructions

### Platform Configuration
Gemini CLI and Antigravity IDE use a similar skill structure but typically target a different root directory.

**Standard Folder Structure:**
- **Root**: `.gemini/`
- **Skill Path**: `skills/<category>/`
- **Skill File**: `SKILL.md`

**Antigravity Integration Highlights:**
- **Auto-Activation**: Skills are indexed and triggered based on the `description` in the skill's frontmatter.
- **Search Optimization**: Uses BM25 ranking for style and color palette matching (as seen in UI/UX Pro Max).
- **Design System Persistence**: Encouraged to use a `design-system/MASTER.md` file for global style rules, with page-specific overrides in `design-system/pages/`.

---

## 📚 Section 3: Unified Skill Catalog

### 1. Marketing Skills (Corey Haines)
*Source: marketingskills-main*

| Skill | Description |
|-------|-------------|
| **page-cro** | Optimize marketing pages for conversions. |
| **copywriting** | Write marketing copy for any page (homepage, landing, pricing). |
| **copy-editing** | Refine and polish existing copy. |
| **seo-audit** | Diagnose and fix SEO issues. |
| **analytics-tracking** | Set up or audit event tracking (GA4, etc). |
| **email-sequence** | Create lifecycle drip campaigns. |
| **paid-ads** | Help with Meta, Google, LinkedIn ad setup. |
| **signup-flow-cro** | Optimize registration and activation flows. |
| **product-marketing-context** | Maintain documentation on product positioning. |
| **programmatic-seo** | Create SEO pages at scale via templates. |
| **competitor-alternatives** | Build SEO-driven alternative/comparison pages. |
| **marketing-psychology** | Apply mental models and behavior science to UI. |
| **And more...** | (Includes launch-strategy, pricing-strategy, marketing-ideas, etc.) |

### 2. UI/UX Pro Max (Next Level Builder)
*Source: ui-ux-pro-max-skill-main*

- **Comprehensive Design Intelligence**: 67 UI styles (Glassmorphism, Bento Grid, etc.), 96 palettes, 57 font pairings.
- **Reasoning Engine**: Industry-specific rules for SaaS, Fintech, Healthcare, E-commerce, etc.
- **Multi-Stack Support**: React, Next.js, Vue, Svelte, SwiftUI, React Native, Tailwind, shadcn/ui.

### 3. Stitch Skills (Google Labs)
*Source: stitch-skills-main*

| Skill | Description |
|-------|-------------|
| **stitch-loop** | Iteratively build multi-page sites via autonomous baton-passing. |
| **design-md** | Generate `DESIGN.md` documentation for Stitch projects. |
| **react-components** | Convert Stitch screens to React comp systems. |
| **enhance-prompt** | Transform UI ideas into Stitch-optimized prompts. |
| **remotion** | Generate showcase videos from designs. |
| **shadcn-ui** | Expert guidance for shadcn component integration. |

### 4. Free Claude Code Skills (Nick)
*Source: Free Claude Code Skills*

| Skill | Description |
|-------|-------------|
| **amazon-shopping** | Browser-driven product research and purchase on Amazon. |
| **lead-scraper** | Scrape leads using automated browser tools. |
| **meeting-notes** | Transcribe and summarize meeting highlights. |
| **content-repurposer** | Turn core content into social posts, emails, and blogs. |
| **inbox-cleaner** | Automated email triage and management. |
| **invoice-extractor** | Automatically process and categorize invoices. |
| **website-builder** | High-level site creation instructions. |

---

## 🚀 Section 4: Installation & Usage

### Adding Skills to your Project
To use these skills locally, copy the relevant folder to:
- **Claude**: `.claude/skills/`
- **Gemini**: `.gemini/skills/`

**Example:**
`cp -r "Downloads/marketingskills-main/skills/copywriting" ".claude/skills/"`

### Direct Invocation
In your AI terminal, you can call them directly:
- `/copywriting`
- `/stitch-loop`
- `/ui-ux-pro-max`

### Global Installation
For persistent access across all projects, use the user-level path:
- **Claude**: `~/.claude/skills/`
- **Gemini**: `~/.gemini/antigravity/skills/`
