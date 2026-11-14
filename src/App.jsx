import { useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Hero from './components/Hero'

function App() {
  const [showSaved, setShowSaved] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <main className="min-h-screen">
      <div className="cursor-glow" aria-hidden="true" />
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />
      <Header
        showSaved={showSaved}
        savedCount={0}
        onLatest={() => setShowSaved(false)}
        onSaved={() => setShowSaved(true)}
      />
      <Hero query={query} onQueryChange={setQuery} />
      <Footer />
    </main>
  )
}

export default App