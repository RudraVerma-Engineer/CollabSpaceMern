import { Link } from "react-router-dom";

import Avatar from "../common/Avatar.jsx";
import ConfirmButton from "../common/ConfirmButton.jsx";

const MemberList = ({ project, canRemove, onRemove }) => (
  <ul className="member-list">
    {project.members.map((member) => {
      const isOwner = member._id === project.owner._id;

      return (
        <li key={member._id} className="member-item">
          <Avatar user={member} size={34} showPresence />
          <div>
            <Link to={`/people/${member._id}`}>{member.name}</Link>
            <div className="muted">{isOwner ? "Owner" : "Member"}</div>
          </div>

          {canRemove && !isOwner && (
            <ConfirmButton
              title={`Remove ${member.name}?`}
              message="They will lose access to the project's team chat."
              confirmLabel="Remove"
              onConfirm={() => onRemove(member)}
            >
              Remove
            </ConfirmButton>
          )}
        </li>
      );
    })}
  </ul>
);

export default MemberList;
