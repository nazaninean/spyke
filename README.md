# Spyke

Spyke is a feed of new brain research. It pulls recent brain research papers from PubMed and shows each one with a short, plain summary of what the researchers looked at and what they found.

Live site: https://your-link.vercel.app.

## Features

- Live papers from PubMed, filtered by topic (neurodegeneration, sleep, BCI, memory, mental health)
- Search with debounce, plus a Cmd/Ctrl+K shortcut
- Save studies to read later (kept in localStorage)
- Detail page for each study with the full abstract and a link to the original paper

## Stack

- React + Vite (JavaScript, React Compiler)
- Tailwind CSS
- ESLint
- PubMed E-utilities API

## Run it locally

    npm install
    npm run dev

Then open http://localhost:5173.
