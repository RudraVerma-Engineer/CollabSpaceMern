import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="state-box">
    <h3>Page not found</h3>
    <p>The page you are looking for does not exist.</p>
    <Link to="/feed" className="btn btn-primary">Back to the feed</Link>
  </div>
);

export default NotFound;
