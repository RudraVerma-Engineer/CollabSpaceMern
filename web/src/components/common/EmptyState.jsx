const EmptyState = ({ title, children }) => (
  <div className="state-box card">
    <h3>{title}</h3>
    {children && <p>{children}</p>}
  </div>
);

export default EmptyState;
