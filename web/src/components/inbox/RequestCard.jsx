import { Link } from "react-router-dom";

import { PROJECT_STATUS_LABELS } from "../../utils/constants.js";
import { timeAgo } from "../../utils/format.js";
import Avatar from "../common/Avatar.jsx";
import ChipList from "../common/ChipList.jsx";

const STATUS_BADGES = {
  pending: "badge-warn",
  accepted: "badge-good",
  rejected: "badge-bad",
  cancelled: "",
};

/**
 * `mode="received"`: owner sees who wants to join (accept / reject).
 * `mode="sent"`:     requester sees the project they asked to join (cancel).
 */
const RequestCard = ({ request, mode, busy, onAccept, onReject, onCancel }) => {
  const person = mode === "received" ? request.requester : request.owner;
  const isPending = request.status === "pending";

  return (
    <article className="card inbox-item">
      <Avatar user={person} size={44} />

      <div className="inbox-item-body">
        <div className="row-between">
          <strong>
            {mode === "received" ? (
              <>
                <Link to={`/people/${person._id}`}>{person.name}</Link> wants to join{" "}
              </>
            ) : (
              "You asked to join "
            )}
            <Link to={`/projects/${request.project?._id}`}>{request.project?.title}</Link>
          </strong>
          <span className={`badge ${STATUS_BADGES[request.status]}`}>{request.status}</span>
        </div>

        <span className="muted">
          {timeAgo(request.createdAt)}
          {request.project && ` · ${PROJECT_STATUS_LABELS[request.project.status]}`}
        </span>

        {mode === "received" && <ChipList items={request.requester.skills} />}
        {request.message && <p className="request-message">{request.message}</p>}

        {isPending && (
          <div className="inbox-item-actions">
            {mode === "received" ? (
              <>
                <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onAccept(request)}>
                  Accept
                </button>
                <button className="btn btn-sm" disabled={busy} onClick={() => onReject(request)}>
                  Reject
                </button>
              </>
            ) : (
              <button className="btn btn-sm" disabled={busy} onClick={() => onCancel(request)}>
                Cancel request
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default RequestCard;
