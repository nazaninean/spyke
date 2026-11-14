import PaperCard from './PaperCard'
import Icon from './Icon'
import { TOPICS } from '../utils'

function Feed({
  papers,
  topic,
  onTopicChange,
  showSaved,
  query,
  loading,
  error,
  isSaved,
  onToggleSaved,
  onOpen,
  onRetry,
  onReset,
}) {
  const isLoading = loading && !showSaved
  const failed = Boolean(error) && !showSaved
  const empty = !isLoading && !failed && papers.length === 0

  return (
    <section className="feed shell">
      <div className="feed-heading">
        <div>
          <p className="section-kicker">
            {showSaved ? 'Your library' : query ? 'Search results' : 'Fresh from the lab'}
          </p>
          <h2>{showSaved ? 'Saved studies' : query ? `“${query}”` : 'Latest research'}</h2>
        </div>
        <p>
          {isLoading ? 'Loading…' : `${papers.length} ${papers.length === 1 ? 'study' : 'studies'}`}
        </p>
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

      <div className="paper-list" aria-busy={isLoading}>
        {isLoading &&
          [0, 1, 2].map((n) => (
            <div className="paper-card skeleton" key={n} aria-hidden="true">
              <div className="index-block" />
              <div className="paper-content"><i /><b /><b /><b /></div>
            </div>
          ))}

        {!isLoading &&
          !failed &&
          papers.map((paper, index) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              index={index}
              isSaved={isSaved(paper.id)}
              onToggleSaved={onToggleSaved}
              onOpen={onOpen}
            />
          ))}

        {failed && (
          <div className="empty-state">
            <Icon name="brain" size={38} />
            <h3>Couldn’t reach PubMed</h3>
            <p>Check your connection and try again.</p>
            <button onClick={onRetry}>Try again</button>
          </div>
        )}

        {empty && (
          <div className="empty-state">
            <Icon name="brain" size={38} />
            <h3>No studies here yet</h3>
            <p>
              {showSaved
                ? 'Save a study from the latest feed and it will appear here.'
                : 'Try another topic or search term.'}
            </p>
            <button onClick={onReset}>Browse latest research</button>
          </div>
        )}
      </div>
    </section>
  )
}

export default Feed