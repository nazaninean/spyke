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

  const parts = Array.isArray(paper.abstract) ? paper.abstract : []

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

      <h1
        style={{
          maxWidth: '46rem',
          margin: '1rem 0 2.5rem',
          fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
          lineHeight: 1.15,
        }}
      >
        {paper.title}
      </h1>

      <div className="findings">
        <div><span>THEY LOOKED AT</span><p>{paper.lookedAt}</p></div>
        <div><span>THEY FOUND</span><p>{paper.found}</p></div>
      </div>

      <div className="detail-body">
        <div className="detail-actions">
          <button
            className={isSaved ? 'detail-save saved' : 'detail-save'}
            onClick={() => onToggleSaved(paper)}
          >
            <Icon name="bookmark" size={17} /> {isSaved ? 'Saved' : 'Save study'}
          </button>
        </div>

        {parts.length > 0 && (
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
                {parts.map((part, index) => (
                  <p key={index}>
                    {part.label && <strong className="abstract-label">{part.label}. </strong>}
                    {part.text}
                  </p>
                ))}
              </section>

              {paper.conclusion && (
                <aside>
                  <Icon name="spark" size={20} />
                  <div>
                    <span className="detail-label">THE AUTHORS’ CONCLUSION</span>
                    <p>{paper.conclusion}</p>
                  </div>
                </aside>
              )}

              {paper.limitations && (
                <section className="limitations">
                  <span className="detail-label">KEEP IN MIND</span>
                  <h2>Limits and open questions</h2>
                  <p>{paper.limitations}</p>
                </section>
              )}
            </div>
          </details>
        )}

        <div className="source-panel">
          <div>
            <span className="detail-label">ORIGINAL SOURCE</span>
            <p>Read the full paper from {paper.source}, or see its PubMed record.</p>
          </div>
          <div className="source-links">
            <a
              href={paper.doi ? `https://doi.org/${paper.doi}` : `https://pubmed.ncbi.nlm.nih.gov/${paper.id}/`}
              target="_blank"
              rel="noreferrer"
            >
              {paper.doi ? 'Open the paper' : 'View on PubMed'} <Icon name="arrow" size={17} />
            </a>
            {paper.doi && (
              <a className="secondary" href={`https://pubmed.ncbi.nlm.nih.gov/${paper.id}/`} target="_blank" rel="noreferrer">
                PubMed
              </a>
            )}
          </div>
        </div>

        <p className="source-note">
          Summaries are pulled from each paper’s published abstract and shown as written by the authors.
          They are not medical advice. Always read the original paper for its complete methods, data, and conclusions.
        </p>
      </div>
    </section>
  )
}

export default StudyPage