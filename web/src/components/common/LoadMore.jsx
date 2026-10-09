const LoadMore = ({ hasMore, loading, onClick }) =>
  hasMore ? (
    <div className="load-more">
      <button type="button" className="btn" onClick={onClick} disabled={loading}>
        {loading ? "Loading…" : "Load more"}
      </button>
    </div>
  ) : null;

export default LoadMore;
