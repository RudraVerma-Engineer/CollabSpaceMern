import Avatar from "../common/Avatar.jsx";
import ChipList from "../common/ChipList.jsx";

const ProfileHeader = ({ user, actions }) => (
  <div className="card profile-header">
    <Avatar user={user} size={84} showPresence />

    <div className="profile-header-body">
      <h1>{user.name}</h1>
      {user.college && <span className="muted">{user.college}</span>}
      {user.bio ? <p>{user.bio}</p> : <p className="muted">No bio yet.</p>}
      <ChipList items={user.skills} />

      {user.githubProfile && (
        <a href={user.githubProfile} target="_blank" rel="noreferrer">GitHub profile</a>
      )}
    </div>

    {actions}
  </div>
);

export default ProfileHeader;
