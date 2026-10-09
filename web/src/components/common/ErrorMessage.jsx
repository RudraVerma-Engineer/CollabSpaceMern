const ErrorMessage = ({ message, onRetry }) =>
  message ? (
    <div className="form-error" role="alert">
      {message}{" "}
      {onRetry && (
        <button type="button" className="btn-link" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  ) : null;

export default ErrorMessage;
