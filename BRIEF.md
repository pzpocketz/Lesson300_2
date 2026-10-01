# Project Brief

---

## Overview

An interactive data story exploring the relationship between weather conditions and agricultural harvest yield across a fictional set of growing regions. The narrative asks a simple question: **as weather becomes less predictable, are yields following?** The experience guides the reader through five years of invented data — precipitation, temperature, and drought index plotted against seasonal yield — surfacing patterns, anomalies, and a clear point of view.

---

## Users

A **Sustainability Manager** or **Field Operations Lead** in the Energy & Natural Resources sector who needs to communicate weather-yield risk to stakeholders, identify vulnerable regions, and make the case for resilience investments. They are data-literate but not data engineers — they want insight, not spreadsheets.

---

## Story Structure

The page is a single scrolling narrative broken into five chapters:

1. **Hook** — A headline stat and one-line provocation. ("In 2022, three weeks of drought cost Region C 31% of its yield.")
2. **The Baseline** — Five-year annual yield overview. What does a "normal" year look like?
3. **Weather Moves In** — Weather variables (rainfall, temperature, drought index) overlaid on yield. Show the correlation.
4. **Where It Hurts Most** — Regional breakdown. Some regions are resilient; others aren't. Why?
5. **The Takeaway** — A short written conclusion with one forward-looking implication and a filter to explore by region or year.

---

## Interactions

- Year range filter (slider or segmented control)
- Region toggle (multi-select chips)
- Weather variable switcher (Rainfall / Temperature / Drought Index)
- Animated chart transitions when filters change
- Hover tooltips on all data points
- Use smooth transitions between **250ms and 350ms**, `ease-in-out`

---

## Design Style

Clean, editorial data journalism aesthetic. Think *The Pudding* or *Bloomberg Graphics* — not a dashboard. The design should feel serious and readable, not decorative.

- Muted earth tones anchored by one strong accent color
- Generous whitespace and tight typographic hierarchy
- Charts are the hero — no chrome, no decoration
- Subtle section dividers, no heavy borders or cards
- Responsive: readable on both desktop and mobile

---

## Typography

| Role | Weight | Size (rem) |
|------|--------|------------|
| H1 | 700 | 2.25 |
| H2 | 700 | 1.75 |
| H3 | 600 | 1.375 |
| Body | 400 | 1.0 |
| Label / Caption | 400 | 0.8125 |

Use a neutral, legible sans-serif — Inter or IBM Plex Sans via Fontsource.

---

## Color

```css
--color-primary:         #2D6A4F;   /* forest green — yields, growth */
--color-primary-hover:   #1B4332;
--color-accent:          #D62828;   /* drought / anomaly highlight */
--color-weather:         #457B9D;   /* rainfall / weather series */
--color-neutral-100:     #F8F5F0;   /* page background */
--color-neutral-200:     #E9E4DC;   /* section dividers */
--color-surface:         #FFFFFF;
--color-text-primary:    #1C1917;
--color-text-secondary:  #6B6560;
--color-success:         #40916C;
--color-warning:         #E9C46A;
--color-error:           #D62828;
```

All foreground/background combinations must meet WCAG 2.2 AA (4.5:1 for body text, 3:1 for large text and UI components).

---

## Spacing

Base unit: **8px**. All spacing values are multiples of 8px.

| Token | Value |
|-------|-------|
| space-1 | 8px |
| space-2 | 16px |
| space-3 | 24px |
| space-4 | 32px |
| space-6 | 48px |
| space-8 | 64px |
| space-12 | 96px |

---

## Charts

- Line chart: yield over time with weather variable overlay (dual axis)
- Bar chart: annual yield comparison across regions
- Small multiples: per-region yield sparklines with anomaly callouts
- All charts use project color tokens only
- Labels always visible — no hover-only labels
- Every chart has a text summary for accessibility
- Recommended library: `Recharts` (React) or `Chart.js via vue-chartjs`
- No gridlines on axes unless essential; remove all chartjunk

---

## Accessibility

- WCAG 2.2 AA compliance required
- All interactive elements keyboard navigable
- Color is never the sole means of conveying information (use shape/pattern as backup on charts)
- All icons and chart elements have `aria-label` or `title`
- Test with axe DevTools and Lighthouse

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Build Tool | Vite |
| Language | JavaScript (JSX) |
| Charts | Recharts |
| Styling | CSS custom properties + CSS modules |
| Icons | Phosphor Icons for React |
| Fonts | Inter via Fontsource |

---

## Data

Generate a fake dataset as a JSON file (`src/data/harvest.json`). Five years of data (2019–2023), four fictional growing regions (Region A–D), monthly granularity.

Each record should include:

- `year` and `month`
- `region`
- `yield_tonnes` — harvest output, with natural seasonal variation and year-over-year trend
- `rainfall_mm` — monthly precipitation
- `avg_temp_c` — average temperature
- `drought_index` — 0–10 scale (0 = no drought, 10 = severe)
- `anomaly` — boolean flag for months where yield deviated >20% from that region's baseline

Make the data feel realistic: some regions weather-sensitive, others more resilient. Include 1–2 clearly bad years (2021 and 2023 could be drought years) and one unusually good year (2020). Don't make it too clean.

---