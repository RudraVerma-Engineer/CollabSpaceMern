import { assetUrl } from "../../utils/assets.js";
import { getInitials } from "../../utils/format.js";

const Avatar = ({ user, size = 40, showPresence = false }) => (
  <span className="avatar" style={{ "--avatar-size": `${size}px` }}>
    {user?.avatar ? <img src={assetUrl(user.avatar)} alt="" /> : getInitials(user?.name)}
    {showPresence && user?.isOnline && <span className="presence-dot" title="Online" />}
  </span>
);

export default Avatar;
