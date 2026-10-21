# spyke

A website for keeping up with what's new in brain research. It pulls recent papers from PubMed, shows what each study looked at and found, and lets you filter by topic, search, and save studies to read later.

## How it works

- The site is a React + Vite + Tailwind app.
- Papers come from PubMed's free E-utilities API. The browser calls it directly.
  - `esearch` finds paper IDs (by topic, or by whatever you type in the search bar).
  - `efetch` gets the details: title, journal, date, authors, abstract, DOI.
- The feed only includes a list of neuroscience and medical journals (Nature, Science, Cell, Neuron, JAMA Neurology, and so on). Each topic searches the last 30 days. If that returns fewer than 6 papers, it widens to 90 days, then a year.
- "They looked at" and "They found" are excerpts from each paper's own abstract. They are not rewritten or summarized by AI.
- The hero number is the real count of new studies this week, and the date and "Updated" time are live.
- Saved studies are stored in the browser's localStorage, so they stay after a refresh but only on that browser.

## Run it locally

You need Node 20.19 or newer.

```
npm install
npm run dev
```

Then open the link it prints (usually http://localhost:8443).

If `npm install` fails with a permission error about `~/.npm`, run this once and try again:

```
sudo chown -R $(id -u):$(id -g) ~/.npm
```

## Deploy

It's a static site, so Vercel handles it without any settings.

```
npx vercel login
npx vercel
npx vercel --prod
```

Use the link from the `--prod` step to share it.

## Where things are

- `src/App.tsx` has everything: the PubMed code at the top (topics, journal list, search queries, abstract parsing) and the page UI below it.
- `src/index.css` has all the styling, including the dark green theme.
- `public/spyke-logo.png` is the logo.
- `.figma/make/site.json` holds the site description and the setting that tells search engines not to list the site. Change `robots.index` to `true` if you want it searchable.

## Changing what shows up

All in `src/App.tsx`:

- To add or edit a topic, change `TOPICS`, `TOPIC_TERMS`, and `TOPIC_PATTERNS`.
- To add or remove journals, edit `JOURNALS`.
- To show more papers per page, change `PAGE_SIZE`.

## Known limits

- PubMed allows about 3 requests per second per visitor without an API key. Normal use is far below that.
- Some abstracts have no labeled sections, so the two excerpts are just the first and last sentences. Those can read a bit rough.
- The hero image is loaded from Unsplash, so it needs a connection to show.
