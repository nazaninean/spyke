import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Feed from './components/Feed'
import { fetchPapers } from './pubmed'

function App() {
  const [showSaved, setShowSaved] = useState(false)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('All topics')
    const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('spyke-saved')) ?? []
    } catch {
      return []
    }
  })
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed === search) return
    const timer = setTimeout(() => {
      setLoading(true)
      setError('')
      setSearch(trimmed)
    }, 450)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    let cancelled = false
    fetchPapers(topic, search)
      .then((result) => {
        if (!cancelled) setPapers(result)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load studies. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [topic, search])

    useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.querySelector('input')?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const changeTopic = (next) => {
    setTopic(next)
    setLoading(true)
    setError('')
  }

  const isSaved = (id) => saved.some((paper) => paper.id === id)

  const toggleSaved = (paper) =>
    setSaved((items) =>
      items.some((item) => item.id === paper.id)
        ? items.filter((item) => item.id !== paper.id)
        : [paper, ...items],
    )

  const visible = showSaved
    ? saved.filter((paper) => topic === 'All topics' || paper.topic === topic)
    : papers

  return (
    <main className="min-h-screen">
      <div className="cursor-glow" aria-hidden="true" />
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />
      <Header
        showSaved={showSaved}
        savedCount={saved.length}
        onLatest={() => setShowSaved(false)}
        onSaved={() => setShowSaved(true)}
      />
      <Hero query={query} onQueryChange={setQuery} />
      <Feed
        papers={visible}
        topic={topic}
        onTopicChange={changeTopic}
        showSaved={showSaved}
        query={search}
        loading={loading}
        error={error}
        isSaved={isSaved}
        onToggleSaved={toggleSaved}
        onOpen={() => {}}
      />
      <Footer />
    </main>
  )
}

export default App