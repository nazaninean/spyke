import Icon from './Icon'

function Hero({ query, onQueryChange, weekCount = null, updatedLabel = null }) {
  const todayLabel = new Date()
    .toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase()

  return (
    <section className="hero shell">
      <div className="hero-grid">
        <div className="hero-copy-block">
          <div className="eyebrow"><Icon name="spark" size={16} /> Fresh from PubMed</div>
          <h1>What&apos;s new in<br /><em>brain research</em></h1>
          <p className="hero-copy">Catch up on new spykes!</p>
          <div className="search-wrap">
            <Icon name="search" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search studies, topics, or findings..."
              aria-label="Search research"
            />
            <kbd>⌘ K</kbd>
          </div>
        </div>

        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1791158669860-6fef8168bc3c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200"
            alt="Glowing neural network in the shape of a human brain"
          />
          <div className="visual-shade" />
          <div className="visual-topline"><span>LIVE FEED</span><i /> {todayLabel}</div>
          <div className="visual-stat">
            <strong>{weekCount === null ? '–' : weekCount.toLocaleString('en-US')}</strong>
            <span>new studies<br />this week</span>
          </div>
          <div className="visual-chip">
            <Icon name="spark" size={14} /> {updatedLabel ? `Updated ${updatedLabel}` : 'Connecting to PubMed…'}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero