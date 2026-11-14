import Icon from './Icon'
import { accentFor } from '../utils'

function StudyPage({ paper, isSaved, onToggleSaved, onBack }) {
  if (!paper) {
    return (
      <section className="shell" style={{ padding: '4rem 0' }}>
        <button className="read-link" onClick={onBack}>Back to feed</button>
        <p style={{ marginTop: '1.5rem', opacity: 0.7 }}>
          We could not find that study. Go back and open it from the feed.
        </p>
      </section>
    )
  }

  return (
    <section className="shell" style={{ padding: '3rem 0' }}>
      <button className="read-link" onClick={onBack}>Back to feed</button>

      <div className="paper-meta" style={{ marginTop: '2rem' }}>
        <span className={`topic-dot ${accentFor(paper.topic)}`} />
        <span>{paper.topic}</span><i />
        <span>{paper.source}</span>
        {paper.date && <><i /><span>{paper.date}</span></>}
        <i /><span>{paper.readTime} min read</span>
      </div>

      <h1 style={{ margin: '1rem 0 2rem' }}>{paper.title}</h1>

      <div className="findings">
        <div><span>THEY LOOKED AT</span><p>{paper.lookedAt}</p></div>
        <div><span>THEY FOUND</span><p>{paper.found}</p></div>
      </div>

      {paper.abstract && (
        <details style={{ marginTop: '2rem' }}>
          <summary style={{ cursor: 'pointer' }}>Read the full abstract</summary>
          <p style={{ marginTop: '1rem', lineHeight: 1.7 }}>{paper.abstract}</p>
        </details>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
        <a
          className="read-link"
          href={`https://pubmed.ncbi.nlm.nih.gov/${paper.id}/`}
          target="_blank"
          rel="noreferrer"
        >
          View on PubMed <Icon name="arrow" size={18} />
        </a>
        <button
          className={isSaved ? 'save-button saved' : 'save-button'}
          onClick={() => onToggleSaved(paper)}
          aria-label={isSaved ? 'Remove from saved' : 'Save study'}
        >
          <Icon name="bookmark" size={18} />
        </button>
      </div>
    </section>
  )
}

export default StudyPage