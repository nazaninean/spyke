import { useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Feed from './components/Feed'
import { SAMPLE_PAPERS } from './samplePapers'

function App() {
  const [showSaved, setShowSaved] = useState(false)
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('All topics')
  const [saved, setSaved] = useState([])

  const isSaved = (id) => saved.some((paper) => paper.id === id)

  const toggleSaved = (paper) =>
    setSaved((items) =>
      items.some((item) => item.id === paper.id)
        ? items.filter((item) => item.id !== paper.id)
        : [paper, ...items],
    )

  const source = showSaved ? saved : SAMPLE_PAPERS
  const visible = source.filter((paper) => topic === 'All topics' || paper.topic === topic)

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
        onTopicChange={setTopic}
        showSaved={showSaved}
        query={query}
        isSaved={isSaved}
        onToggleSaved={toggleSaved}
        onOpen={() => {}}
      />
      <Footer />
    </main>
  )
}

export default App