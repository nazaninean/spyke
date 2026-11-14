import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Feed from './components/Feed'
import StudyPage from './components/StudyPage'
import { fetchPapers, countThisWeek } from './pubmed'

const readHash = () =>
  window.location.hash.startsWith('#study-') ? window.location.hash.slice(7) : null

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
  const [openId, setOpenId] = useState(readHash)
    const [weekCount, setWeekCount] = useState(null)

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

  useEffect(() => {
    localStorage.setItem('spyke-saved', JSON.stringify(saved))
  }, [saved])

    useEffect(() => {
    const moveGlow = (event) => {
      document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`)
      document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`)
    }
    window.addEventListener('pointermove', moveGlow)
    return () => window.removeEventListener('pointermove', moveGlow)
  }, [])

    useEffect(() => {
    countThisWeek()
      .then(setWeekCount)
      .catch(() => setWeekCount(null))
  }, [])

  useEffect(() => {
    const onHashChange = () => setOpenId(readHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const changeTopic = (next) => {
    setTopic(next)
    setLoading(true)
    setError('')
  }

  const openStudy = (id) => {
    window.location.hash = `study-${id}`
    window.scrollTo(0, 0)
  }

  const closeStudy = () => {
    window.location.hash = ''
  }

  const goLatest = () => {
    setShowSaved(false)
    closeStudy()
  }

  const goSaved = () => {
    setShowSaved(true)
    closeStudy()
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

  const study = openId ? [...papers, ...saved].find((paper) => paper.id === openId) : null

  return (
    <main className="min-h-screen">
      <div className="cursor-glow" aria-hidden="true" />
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />
      <Header
        showSaved={showSaved}
        savedCount={saved.length}
        onLatest={goLatest}
        onSaved={goSaved}
      />
      {openId ? (
        <StudyPage
          paper={study}
          isSaved={study ? isSaved(study.id) : false}
          onToggleSaved={toggleSaved}
          onBack={closeStudy}
        />
      ) : (
        <>
          <Hero query={query} onQueryChange={setQuery} weekCount={weekCount} />
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
            onOpen={openStudy}
          />
        </>
      )}
      <Footer />
    </main>
  )
}

export default App