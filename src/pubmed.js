const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

const TOPIC_TERMS = {
  Neurodegeneration: '(neurodegeneration OR Alzheimer OR Parkinson)',
  Sleep: '(sleep)',
  BCI: '("brain-computer interface")',
  Memory: '(memory AND hippocampus)',
  'Mental health': '(depression OR anxiety)',
}

const TOPIC_PATTERNS = {
  Neurodegeneration: /neurodegenerat|alzheimer|parkinson|dementia/i,
  Sleep: /sleep/i,
  BCI: /brain-computer|brain–computer|neural interface|neuroprosthe/i,
  Memory: /memory|hippocamp/i,
  'Mental health': /depress|anxiety|mental health/i,
}

function buildTerm(topic, query) {
  const base = '(brain OR neuro*) AND hasabstract'
  const topicTerms =
    topic === 'All topics' ? Object.values(TOPIC_TERMS).join(' OR ') : TOPIC_TERMS[topic]

  if (query && topic === 'All topics') return `(${query}) AND ${base}`
  if (query) return `(${query}) AND (${topicTerms}) AND ${base}`
  return `(${topicTerms}) AND ${base}`
}

function guessTopic(text, fallback) {
  const match = Object.keys(TOPIC_PATTERNS).find((name) => TOPIC_PATTERNS[name].test(text))
  return match ?? (fallback === 'All topics' ? 'Neurodegeneration' : fallback)
}

function shorten(text, max = 240) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max).trim() + '...' : clean
}

function sentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean)
}

function parseArticle(article, topic) {
  const id = article.querySelector('PMID')?.textContent ?? ''
  const title = article.querySelector('ArticleTitle')?.textContent ?? 'Untitled study'
  const source = article.querySelector('Journal > Title')?.textContent ?? 'PubMed'
  const year = article.querySelector('PubDate > Year')?.textContent ?? ''
  const month = article.querySelector('PubDate > Month')?.textContent ?? ''

  const parts = [...article.querySelectorAll('AbstractText')].map((node) => ({
    label: (node.getAttribute('Label') ?? '').toUpperCase(),
    text: node.textContent ?? '',
  }))
  const fullText = parts.map((part) => part.text).join(' ')

  const pick = (labels) => parts.find((part) => labels.includes(part.label))?.text
  const all = sentences(fullText)

  const lookedAt = pick(['BACKGROUND', 'OBJECTIVE', 'OBJECTIVES', 'AIM', 'AIMS', 'METHODS']) ?? all[0] ?? ''
  const found = pick(['RESULTS', 'FINDINGS', 'CONCLUSIONS', 'CONCLUSION']) ?? all[all.length - 1] ?? ''

  return {
    id,
    source,
    date: [month, year].filter(Boolean).join(' '),
    topic: guessTopic(`${title} ${fullText}`, topic),
    title,
    lookedAt: shorten(lookedAt),
    found: shorten(found),
    readTime: Math.max(1, Math.round(fullText.split(/\s+/).length / 200)),
  }
}

export async function fetchPapers(topic, query = '') {
  const searchUrl = `${BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=12&sort=date&term=${encodeURIComponent(buildTerm(topic, query))}`
  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) throw new Error('Search failed')
  const ids = (await searchRes.json()).esearchresult.idlist
  if (ids.length === 0) return []

  const fetchUrl = `${BASE}/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(',')}`
  const fetchRes = await fetch(fetchUrl)
  if (!fetchRes.ok) throw new Error('Fetch failed')
  const xml = new DOMParser().parseFromString(await fetchRes.text(), 'text/xml')

  return [...xml.querySelectorAll('PubmedArticle')].map((article) => parseArticle(article, topic))
}