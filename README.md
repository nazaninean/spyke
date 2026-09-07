# Spyke ⚡

**What's spiking in brain sciences research?**

Spyke is a live brain science paper discovery app. It pulls from three real-time sources (OpenAlex, Semantic Scholar, and bioRxiv) and presents them as a clean, fast, searchable feed organized by field.

---

## Features

- **Trending** — most cited recent papers across neuroscience, cognitive science, and psychiatry
- **New this week** — papers published in the last 7 days
- **Preprints** — latest from bioRxiv
- **8 field channels** — Neuroscience, Cognitive Science, Psychiatry, Neuroimaging, Computational, Clinical, BCI, Molecular
- **Author search** — search any researcher by name, see only their papers with h-index
- **Keyword search** — search any topic or concept
- **AI summaries** — HuggingFace BART summarizes each paper abstract on click
- **Save papers** — bookmark papers to your personal library, persists across sessions
- **Light / Dark mode** — toggle in the header, preference saved in browser
- **Sort by** — relevance, citations, newest, most influential

---

## Data sources

| Source | What it provides |
|---|---|
| [OpenAlex](https://openalex.org) | 50M+ papers, citation counts, concepts, open access status |
| [Semantic Scholar](https://www.semanticscholar.org) | Influential citations, author profiles, related papers |
| [bioRxiv](https://biorxiv.org) | Latest preprints |
| [HuggingFace](https://huggingface.co) | BART summarization model for AI summaries |

All APIs are free. No keys required.

---

## Live

**[spyke.vercel.app](https://spyke-beta.vercel.app)** 

---

## Run locally

```bash
cd ~/Downloads
python3 -m http.server 3000
```

Then open: `http://localhost:3000`

> Note: must be served via HTTP (not opened as a file) for the APIs to work.

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect this GitHub repo to [vercel.com](https://vercel.com) for automatic deployments on every push.

---

## Stack

- Vanilla HTML / CSS / JavaScript — zero dependencies, no build step
- [OpenAlex API](https://docs.openalex.org)
- [Semantic Scholar API](https://api.semanticscholar.org/api-docs/)
- [bioRxiv API](https://api.biorxiv.org)
- [HuggingFace Inference API](https://huggingface.co/inference-api) — BART summarization
- [Inter](https://fonts.google.com/specimen/Inter) + [Syne](https://fonts.google.com/specimen/Syne) — typography
