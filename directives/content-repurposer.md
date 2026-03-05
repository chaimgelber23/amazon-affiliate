# Content Repurposer Directive

> Adapted from the Free Claude Code Skills pack

## Goal
Take a product review and repurpose it into social media content:
1. **Tweet thread** (5-8 tweets)
2. **LinkedIn/Instagram post** (150-300 words)
3. **Email newsletter snippet** (for weekly digest)

## Inputs
- **Product review**: A completed review from the site (text or URL)
- **Platform focus** (optional): Prioritize one platform

## Process

### Step 1: Extract Key Material
From the review, pull out:
- **The verdict** — 1 sentence summary
- **The hook** — the most surprising or compelling finding
- **2-3 specific data points** — numbers, comparisons, test results
- **The best quote** — punchiest line from the review

### Step 2: Generate Content

#### Tweet Thread
- Tweet 1: Hook — surprising finding or bold claim
- Tweets 2-5: Key findings, one per tweet
- Tweet 6: Verdict + link to full review
- No hashtags, no thread numbering, each tweet under 280 chars

#### LinkedIn/Instagram
- Hook line that stops the scroll
- Short paragraphs (1-2 sentences each)
- End with a question to drive comments
- 3-5 hashtags at the bottom only

#### Newsletter Snippet
- 2-3 sentence summary
- One standout finding
- Link to full review
- "Worth buying?" verdict

### Step 3: Save Output
Save to `docs/social-content/` with date stamps:
```
docs/social-content/
├── 2026-03-04_anker-hub_tweets.md
├── 2026-03-04_anker-hub_linkedin.md
└── 2026-03-04_anker-hub_newsletter.md
```

## Tone Rules
- No exclamation marks
- No "leveraging" or "game-changer" or corporate speak
- Specific > generic ("keeps ice for 11 hours" beats "great insulation")
- Write like a smart friend recommending something, not a marketer

## Edge Cases
- **Review too short**: Tweet thread only (skip LinkedIn and newsletter)
- **No specific data**: Lead with the comparison angle instead
