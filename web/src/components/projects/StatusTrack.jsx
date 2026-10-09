import { PROJECT_STATUS_LABELS } from "../../utils/constants.js";

const STAGES = ["idea", "planning", "in_development", "completed"];

/** Four-step pipeline bar showing how far along a project is. */
const StatusTrack = ({ status }) => {
  const filledCount = STAGES.indexOf(status) + 1; // paused -> 0 filled

  return (
    <div className="status-track" style={{ "--stage-color": `var(--stage-${status})` }}>
      <div className="status-track-bars" aria-hidden="true">
        {STAGES.map((stage, index) => (
          <span key={stage} className={index < filledCount ? "filled" : ""} />
        ))}
      </div>
      <span className="status-track-label">{PROJECT_STATUS_LABELS[status]}</span>
    </div>
  );
};

export default StatusTrack;
