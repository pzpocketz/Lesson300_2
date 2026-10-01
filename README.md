# Weather, In Season

An interactive data story about how changing weather patterns shape harvest yields across four fictional growing regions.

## Getting Started

Requires Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Vite prints the local URL when the development server starts. Use `npm run build` to create a production build and `npm run preview` to serve it locally.

## Explore

Scroll through five chapters, compare regional yield patterns, filter the year range and regions, and switch the weather series between rainfall, temperature, and drought index. All figures use fictional, reproducible data.

## Data

The 240 monthly observations are in `src/data/harvest.json`. Regenerate them with:

```sh
npm run data:generate
```

The deterministic generator is `scripts/generate-harvest-data.mjs`.

## Project Structure

```text
src/
	data/harvest.json     Generated monthly observations
	App.jsx               Narrative, filters, and charts
	App.module.css        Page and chart styling
	global.css            Global typography and reset
	main.jsx              React entry point
scripts/
	generate-harvest-data.mjs
```

## Stack

React 18, Vite, Recharts, CSS Modules, Phosphor Icons, and Inter via Fontsource.

## Accessibility

Controls are keyboard-operable and labeled, chart summaries are available to assistive technology, and reduced-motion preferences are respected. Check contrast and screen-reader behavior when changing colors or chart content.
