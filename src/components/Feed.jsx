import PaperCard from './PaperCard'
import { TOPICS } from '../utils'

function Feed({ papers, topic, onTopicChange, showSaved, query, isSaved, onToggleSaved, onOpen }) {
  return (
    <section className="feed shell">
      <div className="feed-heading">
        <div>
          <p className="section-kicker">
            {showSaved ? 'Your library' : query ? 'Search results' : 'Fresh from the lab'}
          </p>
          <h2>{showSaved ? 'Saved studies' : query ? `“${query}”` : 'Latest research'}</h2>
        </div>
        <p>{papers.length} {papers.length === 1 ? 'study' : 'studies'}</p>
      </div>

      <div className="topic-row" aria-label="Filter by topic">
        {TOPICS.map((item) => (
          <button
            key={item}
            className={topic === item ? 'topic active' : 'topic'}
            onClick={() => onTopicChange(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="paper-list">
        {papers.map((paper, index) => (
          <PaperCard
            key={paper.id}
            paper={paper}
            index={index}
            isSaved={isSaved(paper.id)}
            onToggleSaved={onToggleSaved}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  )
}

export default Feed