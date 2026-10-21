import { useEffect, useMemo, useRef, useState } from 'react'

type Section = { label: string; text: string }

type Paper = {
  id: string
  source: string
  date: string
  topic: string
  title: string
  authors: string
  sections: Section[]
  lookedAt: string
  found: string
  conclusion: string
  limitations: string
  doi: string
  readTime: number
}

const TOPICS = ['All topics', 'Neurodegeneration', 'Sleep', 'BCI', 'Memory', 'Mental health']

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

const NEURO = '(brain[tiab] OR neuron*[tiab] OR neural[tiab] OR cognit*[tiab])'

const TOPIC_TERMS: Record<string, string> = {
  Neurodegeneration:
    '(neurodegenerat*[tiab] OR Alzheimer*[tiab] OR Parkinson*[tiab] OR "amyotrophic lateral sclerosis"[tiab] OR Huntington*[tiab] OR dementia[tiab])',
  Sleep: '(sleep[tiab] OR circadian[tiab])',
  BCI: '("brain-computer interface*"[tiab] OR "brain-machine interface*"[tiab] OR neuroprosthe*[tiab] OR "neural decoding"[tiab])',
  Memory: '(memory[tiab] AND (hippocamp*[tiab] OR neurons[tiab] OR engram*[tiab]))',
  'Mental health': `((depress*[tiab] OR anxiety[tiab] OR stress[tiab] OR schizophreni*[tiab] OR "mental health"[tiab]) AND ${NEURO})`,
}

const TOPIC_PATTERNS: [string, RegExp][] = [
  ['BCI', /brain[- ](computer|machine) interface|neuroprosthe|neural decoding/i],
  ['Neurodegeneration', /neurodegenerat|alzheimer|parkinson|amyotrophic|huntington|dementia/i],
  ['Sleep', /\bsleep|circadian/i],
  ['Memory', /\bmemor(y|ies)|hippocamp|engram/i],
  ['Mental health', /depress|anxiety|stress|schizophreni|mental health/i],
]

const JOURNALS = [
  'Nature', 'Science', 'Cell', 'Neuron', 'Nat Neurosci', 'Nat Commun', 'Sci Adv', 'Nat Med',
  'Nat Hum Behav', 'Nat Ment Health', 'JAMA Neurol', 'JAMA Psychiatry', 'Lancet Neurol',
  'Lancet Psychiatry', 'Brain', 'Ann Neurol', 'Biol Psychiatry', 'Mol Psychiatry', 'eLife',
  'Curr Biol', 'J Neurosci', 'Proc Natl Acad Sci U S A', 'Cell Rep', 'Neurology',
]
const JOURNAL_CLAUSE = `(${JOURNALS.map((j) => `"${j}"[Journal]`).join(' OR ')})`
const COMMON = 'hasabstract[text] AND "journal article"[pt] NOT review[pt]'

const WINDOWS_DAYS = [30, 90, 365]
const MIN_RESULTS = 6
const PAGE_SIZE = 12

function guessTopic(title: string, abstract: string): string {
  const text = `${title} ${abstract}`
  return TOPIC_PATTERNS.find(([, re]) => re.test(text))?.[0] ?? 'Neuroscience'
}

async function esearch(
  term: string,
  opts: { retmax: number; sort: string; reldate?: number },
  signal?: AbortSignal,
): Promise<{ ids: string[]; count: number }> {
  const params = new URLSearchParams({
    db: 'pubmed',
    retmode: 'json',
    retmax: String(opts.retmax),
    sort: opts.sort,
    term,
    tool: 'spyke',
  })
  if (opts.reldate) {
    params.set('datetype', 'pdat')
    params.set('reldate', String(opts.reldate))
  }
  const res = await fetch(`${BASE}/esearch.fcgi?${params}`, { signal })
  if (!res.ok) throw new Error(`PubMed search failed (${res.status})`)
  const json = await res.json()
  const result = json.esearchresult
  if (!result || result.ERROR) throw new Error(result?.ERROR ?? 'PubMed returned no result')
  return { ids: result.idlist ?? [], count: Number(result.count ?? 0) }
}

function formatDate(year: string, month: string, day: string): string {
  if (!year) return ''
  const monthNum = /^\d+$/.test(month) ? Number(month) : new Date(`${month} 1, 2000`).getMonth() + 1
  if (!monthNum || Number.isNaN(monthNum)) return year
  const d = new Date(Number(year), monthNum - 1, day ? Number(day) : 1)
  return d.toLocaleDateString('en-US', day ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', year: 'numeric' })
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z(])/).map((s) => s.trim()).filter(Boolean)
}

function clip(text: string, max = 260): string {
  const parts = sentences(text)
  let out = ''
  for (const part of parts) {
    if (out && (out + ' ' + part).length > max) break
    out = out ? `${out} ${part}` : part
    if (out.length >= 140) break
  }
  if (out.length > max) out = out.slice(0, max).replace(/\s+\S*$/, '') + '…'
  return out
}

function summarize(sections: Section[]) {
  const pick = (re: RegExp) => sections.find((s) => s.label && re.test(s.label))
  const labelled = sections.some((s) => s.label)
  let question = ''
  let result = ''
  let conclusion = ''
  let limitations = ''

  if (labelled) {
    question = clip(
      (pick(/objective|aim|purpose|question|hypothes/i) ?? pick(/method|design|setting|participants/i) ?? pick(/background|introduction|context|importance/i))?.text ?? '',
    )
    result = clip((pick(/^results?$|findings|main outcome/i) ?? pick(/conclusion|interpretation/i))?.text ?? '')
    conclusion = pick(/conclusion|interpretation/i)?.text ?? ''
    limitations = pick(/limitation/i)?.text ?? ''
  }
  if (!question || !result) {
    const all = sentences(sections.map((s) => s.text).join(' '))
    if (!question) question = clip(all.slice(0, 2).join(' '))
    if (!result) result = clip(all.length > 2 ? all.slice(-2).join(' ') : all.slice(-1).join(' '))
  }
  return { question, result, conclusion, limitations }
}

function parseArticles(xml: string, forcedTopic?: string): Paper[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const papers: Paper[] = []
  for (const node of Array.from(doc.querySelectorAll('PubmedArticle'))) {
    const id = node.querySelector('MedlineCitation > PMID')?.textContent?.trim()
    const title = node.querySelector('Article > ArticleTitle')?.textContent?.trim()
    if (!id || !title) continue

    const sections: Section[] = Array.from(node.querySelectorAll('Article > Abstract > AbstractText'))
      .map((el) => ({ label: (el.getAttribute('Label') ?? '').trim(), text: (el.textContent ?? '').trim() }))
      .filter((s) => s.text)
    if (!sections.length) continue

    const electronic = node.querySelector('Article > ArticleDate')
    const pub = node.querySelector('Article > Journal > JournalIssue > PubDate')
    const read = (el: Element | null, tag: string) => el?.querySelector(tag)?.textContent?.trim() ?? ''
    const date =
      formatDate(read(electronic, 'Year'), read(electronic, 'Month'), read(electronic, 'Day')) ||
      formatDate(read(pub, 'Year'), read(pub, 'Month'), read(pub, 'Day')) ||
      read(pub, 'MedlineDate')

    const authorNodes = Array.from(node.querySelectorAll('Article > AuthorList > Author'))
    const names = authorNodes
      .map((a) => {
        const collective = a.querySelector('CollectiveName')?.textContent?.trim()
        if (collective) return collective
        const last = a.querySelector('LastName')?.textContent?.trim()
        const initials = a.querySelector('Initials')?.textContent?.trim()
        return last ? `${last}${initials ? ' ' + initials : ''}` : ''
      })
      .filter(Boolean)
    const authors = names.length > 3 ? `${names.slice(0, 3).join(', ')}, et al.` : names.join(', ')

    const doi =
      Array.from(node.querySelectorAll('PubmedData > ArticleIdList > ArticleId')).find((a) => a.getAttribute('IdType') === 'doi')?.textContent?.trim() ?? ''

    const fullText = sections.map((s) => s.text).join(' ')
    const { question, result, conclusion, limitations } = summarize(sections)

    papers.push({
      id,
      source: node.querySelector('Article > Journal > Title')?.textContent?.trim() ?? 'Journal',
      date,
      topic: forcedTopic ?? guessTopic(title, fullText),
      title,
      authors,
      sections,
      lookedAt: question,
      found: result,
      conclusion,
      limitations,
      doi,
      readTime: Math.max(1, Math.round(fullText.split(/\s+/).length / 200)),
    })
  }
  return papers
}

async function fetchByIds(ids: string[], signal?: AbortSignal, forcedTopic?: string): Promise<Paper[]> {
  if (!ids.length) return []
  const params = new URLSearchParams({ db: 'pubmed', retmode: 'xml', id: ids.join(','), tool: 'spyke' })
  const res = await fetch(`${BASE}/efetch.fcgi?${params}`, { signal })
  if (!res.ok) throw new Error(`PubMed fetch failed (${res.status})`)
  const papers = parseArticles(await res.text(), forcedTopic)
  const order = new Map(ids.map((id, i) => [id, i]))
  return papers.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

function feedTerm(topic: string): string {
  const topicTerm = TOPIC_TERMS[topic] ?? NEURO
  return `${topicTerm} AND ${JOURNAL_CLAUSE} AND ${COMMON}`
}

async function loadFeed(topic: string, query: string, signal?: AbortSignal): Promise<Paper[]> {
  const forced = topic === 'All topics' ? undefined : topic
  if (query.trim()) {
    const topicClause = TOPIC_TERMS[topic] ? ` AND ${TOPIC_TERMS[topic]}` : ''
    const term = `(${query.trim()}) AND ${NEURO}${topicClause} AND ${COMMON}`
    const { ids } = await esearch(term, { retmax: PAGE_SIZE, sort: 'relevance' }, signal)
    return fetchByIds(ids, signal, forced)
  }
  let ids: string[] = []
  for (const days of WINDOWS_DAYS) {
    ids = (await esearch(feedTerm(topic), { retmax: PAGE_SIZE, sort: 'pub_date', reldate: days }, signal)).ids
    if (ids.length >= MIN_RESULTS) break
  }
  return fetchByIds(ids, signal, forced)
}

async function countThisWeek(signal?: AbortSignal): Promise<number> {
  const { count } = await esearch(feedTerm('All topics'), { retmax: 0, sort: 'pub_date', reldate: 7 }, signal)
  return count
}

const ACCENTS: Record<string, string> = {
  Neurodegeneration: 'coral',
  Sleep: 'blue',
  BCI: 'green',
  Memory: 'violet',
  'Mental health': 'gold',
}
const accentFor = (topic: string) => ACCENTS[topic] ?? 'blue'

const SAVED_KEY = 'spyke-saved'

function loadSaved(): Paper[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function studyIdFromHash(): string | null {
  const match = window.location.hash.match(/^#study-(\d+)$/)
  return match ? match[1] : null
}

function Icon({
  name,
  size = 20,
}: {
  name: 'brain' | 'bookmark' | 'search' | 'arrow' | 'spark' | 'menu'
  size?: number
}) {
  const paths = {
    brain: (
      <>
        <path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.2A3 3 0 0 0 4.5 13a3 3 0 0 0 2 5.65V19a2.5 2.5 0 0 0 5 0V5.5a2.5 2.5 0 0 0-2-2.45Z" />
        <path d="M14.5 4.5A3.5 3.5 0 0 1 18 8v.2a3 3 0 0 1 1.5 4.8 3 3 0 0 1-2 5.65V19a2.5 2.5 0 0 1-5 0V5.5a2.5 2.5 0 0 1 2-2.45ZM8 9.5c1.5 0 2.5 1 2.5 2.5M16 9.5c-1.5 0-2.5 1-2.5 2.5M7 15c1.5-.2 2.6.3 3.5 1.5M17 15c-1.5-.2-2.6.3-3.5 1.5" />
      </>
    ),
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    spark: <path d="m12 3 1.35 4.65L18 9l-4.65 1.35L12 15l-1.35-4.65L6 9l4.65-1.35L12 3ZM5 16l.75 2.25L8 19l-2.25.75L5 22l-.75-2.25L2 19l2.25-.75L5 16Z" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

export default function App() {
  const [topic, setTopic] = useState('All topics')
  const [saved, setSaved] = useState<Paper[]>(loadSaved)
  const [showSaved, setShowSaved] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [feed, setFeed] = useState<Paper[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [weekCount, setWeekCount] = useState<number | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(studyIdFromHash)
  const [fetchedStudy, setFetchedStudy] = useState<Paper | null>(null)
  const [studyStatus, setStudyStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const searchRef = useRef<HTMLInputElement>(null)

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
    [],
  )

  useEffect(() => {
    const moveGlow = (event: PointerEvent) => {
      document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`)
      document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`)
    }
    window.addEventListener('pointermove', moveGlow)
    return () => window.removeEventListener('pointermove', moveGlow)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const syncStudy = () => setSelectedId(studyIdFromHash())
    window.addEventListener('hashchange', syncStudy)
    return () => window.removeEventListener('hashchange', syncStudy)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 450)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved))
    } catch {
      /* storage can be unavailable; saving just won't persist */
    }
  }, [saved])

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    loadFeed(topic, debouncedQuery, controller.signal)
      .then((papers) => {
        setFeed(papers)
        setStatus('ready')
        setUpdatedAt(new Date())
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setErrorMessage(error instanceof Error ? error.message : 'Something went wrong')
        setStatus('error')
      })
    return () => controller.abort()
  }, [topic, debouncedQuery, reloadKey])

  useEffect(() => {
    const controller = new AbortController()
    countThisWeek(controller.signal)
      .then(setWeekCount)
      .catch(() => setWeekCount(null))
    return () => controller.abort()
  }, [reloadKey])

  const known = useMemo(() => {
    const map = new Map<string, Paper>()
    for (const paper of [...feed, ...saved]) map.set(paper.id, paper)
    if (fetchedStudy) map.set(fetchedStudy.id, fetchedStudy)
    return map
  }, [feed, saved, fetchedStudy])

  const selectedPaper = selectedId ? known.get(selectedId) : undefined

  useEffect(() => {
    if (!selectedId || known.has(selectedId)) return
    const controller = new AbortController()
    setStudyStatus('loading')
    fetchByIds([selectedId], controller.signal)
      .then(([paper]) => {
        if (paper) {
          setFetchedStudy(paper)
          setStudyStatus('idle')
        } else {
          setStudyStatus('error')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStudyStatus('error')
      })
    return () => controller.abort()
  }, [selectedId, known])

  const isSaved = (id: string) => saved.some((paper) => paper.id === id)
  const toggleSaved = (paper: Paper) =>
    setSaved((items) => (items.some((item) => item.id === paper.id) ? items.filter((item) => item.id !== paper.id) : [paper, ...items]))

  const visible = useMemo(() => {
    if (!showSaved) return feed
    const q = debouncedQuery.toLowerCase()
    return saved.filter(
      (paper) =>
        (topic === 'All topics' || paper.topic === topic) &&
        (!q || `${paper.title} ${paper.lookedAt} ${paper.found}`.toLowerCase().includes(q)),
    )
  }, [showSaved, feed, saved, topic, debouncedQuery])

  const openStudy = (id: string) => {
    window.location.hash = `study-${id}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeStudy = () => {
    history.pushState(null, '', window.location.pathname + window.location.search)
    setSelectedId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const loading = !showSaved && status === 'loading'
  const failed = !showSaved && status === 'error'
  const updatedLabel = updatedAt ? updatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null

  return (
    <main className="min-h-screen">
      <div className="cursor-glow" aria-hidden="true" />
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />
      <header className="site-header">
        <div className="shell header-inner">
          <button className="brand" onClick={() => { setShowSaved(false); closeStudy() }} aria-label="Go to latest research">
            <img className="logo-image" src="/spyke-logo.png" alt="" />
            <span className="logo-type">spyke</span>
          </button>
          <nav className="desktop-nav" aria-label="Main navigation">
            <button className={!showSaved ? 'nav-link active' : 'nav-link'} onClick={() => { setShowSaved(false); closeStudy() }}>Latest</button>
            <button className={showSaved ? 'nav-link active' : 'nav-link'} onClick={() => { setShowSaved(true); closeStudy() }}>
              Saved <span className="saved-count">{saved.length}</span>
            </button>
            <button className="about-link" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>About</button>
          </nav>
          <button className="mobile-menu" aria-label="Open menu"><Icon name="menu" /></button>
        </div>
      </header>

      {selectedId ? (
        <section className="detail-page shell">
          <button className="back-link" onClick={closeStudy}><span><Icon name="arrow" size={17} /></span> Back to all research</button>
          {!selectedPaper ? (
            <div className="empty-state">
              <Icon name="brain" size={38} />
              <h3>{studyStatus === 'error' ? 'Couldn’t load this study' : 'Loading study…'}</h3>
              <p>{studyStatus === 'error' ? 'It may have been removed, or PubMed is unreachable right now.' : 'Fetching the abstract from PubMed.'}</p>
              {studyStatus === 'error' && <button onClick={closeStudy}>Back to all research</button>}
            </div>
          ) : (
            <article className="detail-card">
              <div className="detail-hero">
                <div className="paper-meta">
                  <span className={`topic-dot ${accentFor(selectedPaper.topic)}`} />
                  <span>{selectedPaper.topic}</span><i />
                  <span>{selectedPaper.source}</span>
                  {selectedPaper.date && <><i /><span>{selectedPaper.date}</span></>}
                </div>
                <h1>{selectedPaper.title}</h1>
                {selectedPaper.authors && <p className="detail-authors">{selectedPaper.authors}</p>}
                <div className="detail-actions">
                  <span>{selectedPaper.readTime} min read</span>
                  <button className={isSaved(selectedPaper.id) ? 'detail-save saved' : 'detail-save'} onClick={() => toggleSaved(selectedPaper)}>
                    <Icon name="bookmark" size={17} /> {isSaved(selectedPaper.id) ? 'Saved' : 'Save study'}
                  </button>
                </div>
              </div>
              <div className="detail-body">
                <section className="quick-summary">
                  <span className="detail-label">THE SIMPLE SUMMARY</span>
                  <h2>The 30-second version</h2>
                  <p>{selectedPaper.found}</p>
                </section>
                <section>
                  <span className="detail-label">WHAT THEY STUDIED</span>
                  <h2>How did they get there?</h2>
                  <p>{selectedPaper.lookedAt}</p>
                </section>
                <details className="deep-dive">
                  <summary>
                    <span>
                      <small>FOR THE CURIOUS</small>
                      Read the full abstract
                    </span>
                    <i>+</i>
                  </summary>
                  <div className="deep-dive-content">
                    <section>
                      <span className="detail-label">A CLOSER LOOK</span>
                      <h2>The abstract, in full</h2>
                      {selectedPaper.sections.map((section, index) => (
                        <p key={index}>
                          {section.label && <strong className="abstract-label">{section.label}. </strong>}
                          {section.text}
                        </p>
                      ))}
                    </section>
                    {selectedPaper.conclusion && (
                      <aside>
                        <Icon name="spark" size={20} />
                        <div>
                          <span className="detail-label">THE AUTHORS’ CONCLUSION</span>
                          <p>{selectedPaper.conclusion}</p>
                        </div>
                      </aside>
                    )}
                    {selectedPaper.limitations && (
                      <section className="limitations">
                        <span className="detail-label">KEEP IN MIND</span>
                        <h2>Limits and open questions</h2>
                        <p>{selectedPaper.limitations}</p>
                      </section>
                    )}
                  </div>
                </details>
                <div className="source-panel">
                  <div>
                    <span className="detail-label">ORIGINAL SOURCE</span>
                    <p>Read the full paper from {selectedPaper.source}, or see its PubMed record.</p>
                  </div>
                  <div className="source-links">
                    <a href={selectedPaper.doi ? `https://doi.org/${selectedPaper.doi}` : `https://pubmed.ncbi.nlm.nih.gov/${selectedPaper.id}/`} target="_blank" rel="noreferrer">
                      {selectedPaper.doi ? 'Open the paper' : 'View on PubMed'} <Icon name="arrow" size={17} />
                    </a>
                    {selectedPaper.doi && (
                      <a className="secondary" href={`https://pubmed.ncbi.nlm.nih.gov/${selectedPaper.id}/`} target="_blank" rel="noreferrer">PubMed</a>
                    )}
                  </div>
                </div>
                <p className="source-note">Summaries are pulled from each paper’s published abstract and shown as written by the authors. They are not medical advice. Always read the original paper for its complete methods, data, and conclusions.</p>
              </div>
            </article>
          )}
        </section>
      ) : (
      <>
      <section className="hero shell">
        <div className="hero-grid">
          <div className="hero-copy-block">
            <div className="eyebrow"><Icon name="spark" size={16} /> Fresh from PubMed</div>
            <h1>What&apos;s new in<br /><em>brain research</em></h1>
            <p className="hero-copy">Catch up on new spykes!</p>
            <div className="search-wrap">
              <Icon name="search" />
              <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search studies, topics, or findings..." aria-label="Search research" />
              <kbd>⌘ K</kbd>
            </div>
          </div>
          <div className="hero-visual">
            <img src="https://images.unsplash.com/photo-1791158669860-6fef8168bc3c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200" alt="Glowing neural network in the shape of a human brain" />
            <div className="visual-shade" />
            <div className="visual-topline"><span>LIVE FEED</span><i /> {todayLabel}</div>
            <div className="visual-stat"><strong>{weekCount === null ? '–' : weekCount.toLocaleString('en-US')}</strong><span>new studies<br />this week</span></div>
            <div className="visual-chip"><Icon name="spark" size={14} /> {updatedLabel ? `Updated ${updatedLabel}` : 'Connecting to PubMed…'}</div>
          </div>
        </div>
      </section>

      <section className="feed shell">
        <div className="feed-heading">
          <div>
            <p className="section-kicker">{showSaved ? 'Your library' : debouncedQuery ? 'Search results' : 'Fresh from the lab'}</p>
            <h2>{showSaved ? 'Saved studies' : debouncedQuery ? `“${debouncedQuery}”` : 'Latest research'}</h2>
          </div>
          <p>{loading ? 'Loading…' : `${visible.length} ${visible.length === 1 ? 'study' : 'studies'}`}</p>
        </div>

        <div className="topic-row" aria-label="Filter by topic">
          {TOPICS.map((item) => (
            <button key={item} className={topic === item ? 'topic active' : 'topic'} onClick={() => setTopic(item)}>{item}</button>
          ))}
        </div>

        <div className="paper-list" aria-busy={loading}>
          {loading && [0, 1, 2].map((n) => (
            <div className="paper-card skeleton" key={n} aria-hidden="true">
              <div className="index-block" />
              <div className="paper-content"><i /><b /><b /><b /></div>
            </div>
          ))}
          {!loading && visible.map((paper, index) => (
            <article className="paper-card" key={paper.id}>
              <div className={`index-block ${accentFor(paper.topic)}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div className="pulse-lines"><i /><i /><i /><i /><i /></div>
              </div>
              <div className="paper-content">
                <div className="paper-meta">
                  <span className={`topic-dot ${accentFor(paper.topic)}`} />
                  <span>{paper.topic}</span><i />
                  <span>{paper.source}</span>
                  {paper.date && <><i /><span>{paper.date}</span></>}
                </div>
                <h3>{paper.title}</h3>
                <div className="findings">
                  <div><span>THEY LOOKED AT</span><p>{paper.lookedAt}</p></div>
                  <div><span>THEY FOUND</span><p>{paper.found}</p></div>
                </div>
                <div className="card-footer">
                  <button className="read-link" onClick={() => openStudy(paper.id)}>Read the summary <Icon name="arrow" size={18} /></button>
                  <div>
                    <span>{paper.readTime} min read</span>
                    <button className={isSaved(paper.id) ? 'save-button saved' : 'save-button'} onClick={() => toggleSaved(paper)} aria-label={isSaved(paper.id) ? 'Remove from saved' : 'Save study'}>
                      <Icon name="bookmark" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {failed && (
            <div className="empty-state">
              <Icon name="brain" size={38} />
              <h3>Couldn’t reach PubMed</h3>
              <p>{errorMessage}. Check your connection and try again.</p>
              <button onClick={() => setReloadKey((n) => n + 1)}>Try again</button>
            </div>
          )}
          {!loading && !failed && !visible.length && (
            <div className="empty-state">
              <Icon name="brain" size={38} />
              <h3>No studies here yet</h3>
              <p>{showSaved ? 'Save a study from the latest feed and it will appear here.' : 'Try another topic or search term.'}</p>
              <button onClick={() => { setQuery(''); setDebouncedQuery(''); setTopic('All topics'); setShowSaved(false) }}>Browse latest research</button>
            </div>
          )}
        </div>
      </section>
      </>
      )}

      <footer id="about">
        <div className="shell footer-inner">
          <div><img className="logo-image" src="/spyke-logo.png" alt="" /><span className="logo-type">spyke</span></div>
          <p>Making neuroscience easier to follow.</p>
          <span>Live from PubMed</span>
        </div>
      </footer>
    </main>
  )
}
