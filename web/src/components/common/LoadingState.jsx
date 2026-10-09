const LoadingState = ({ label = "Loading…" }) => (
  <div className="state-box" role="status">
    <div className="spinner" />
    <span>{label}</span>
  </div>
);

export default LoadingState;
