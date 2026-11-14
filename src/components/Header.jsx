import Icon from './Icon'

function Header({ showSaved, savedCount, onLatest, onSaved }) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <button className="brand" onClick={onLatest} aria-label="Go to latest research">
          <img className="logo-image" src="/spyke-logo.png" alt="" />
          <span className="logo-type">spyke</span>
        </button>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button className={!showSaved ? 'nav-link active' : 'nav-link'} onClick={onLatest}>Latest</button>
          <button className={showSaved ? 'nav-link active' : 'nav-link'} onClick={onSaved}>
            Saved <span className="saved-count">{savedCount}</span>
          </button>
          <button
            className="about-link"
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
          >
            About
          </button>
        </nav>
        <button className="mobile-menu" aria-label="Open menu"><Icon name="menu" /></button>
      </div>
    </header>
  )
}

export default Header