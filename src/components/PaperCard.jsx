import Icon from './Icon'
import { accentFor } from '../utils'

function PaperCard({ paper, index, isSaved, onToggleSaved, onOpen }) {
  return (
    <article className="paper-card">
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
          <button className="read-link" onClick={() => onOpen(paper.id)}>
            Read the summary <Icon name="arrow" size={18} />
          </button>
          <div>
            <span>{paper.readTime} min read</span>
            <button
              className={isSaved ? 'save-button saved' : 'save-button'}
              onClick={() => onToggleSaved(paper)}
              aria-label={isSaved ? 'Remove from saved' : 'Save study'}
            >
              <Icon name="bookmark" size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default PaperCard