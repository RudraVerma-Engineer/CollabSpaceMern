import { Link } from "react-router-dom";

import Avatar from "../common/Avatar.jsx";
import ChipList from "../common/ChipList.jsx";

const UserCard = ({ user, onMessage }) => (
  <article className="card user-card">
    <div className="user-card-header">
      <Avatar user={user} size={46} showPresence />
      <div>
        <Link to={`/people/${user._id}`}>{user.name}</Link>
        {user.college && <div className="muted">{user.college}</div>}
      </div>
    </div>

    {user.bio && <p className="user-card-bio">{user.bio}</p>}
    <ChipList items={user.skills} />

    <div className="user-card-actions">
      <Link to={`/people/${user._id}`} className="btn btn-sm">View profile</Link>
      <button type="button" className="btn btn-sm btn-primary" onClick={() => onMessage(user)}>
        Message
      </button>
    </div>
  </article>
);

export default UserCard;
