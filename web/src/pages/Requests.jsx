import { useState } from "react";

import EmptyState from "../components/common/EmptyState.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import LoadMore from "../components/common/LoadMore.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import RequestCard from "../components/inbox/RequestCard.jsx";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import { useToast } from "../hooks/useToast.js";
import {
  acceptRequest,
  cancelRequest,
  getReceivedRequests,
  getSentRequests,
  rejectRequest,
} from "../services/collaboration.service.js";
import { getErrorMessage } from "../utils/errors.js";

/** Collaboration inbox: requests for my projects, and requests I sent. */
const Requests = () => {
  const toast = useToast();
  const [tab, setTab] = useState("received");
  const [busyId, setBusyId] = useState(null);

  const requests = usePaginatedList(
    (page) => (tab === "received" ? getReceivedRequests({ page }) : getSentRequests({ page })),
    "requests",
    [tab],
  );

  const decide = async (request, action, successMessage) => {
    setBusyId(request._id);

    try {
      const response = await action(request._id);
      requests.updateItem(request._id, { status: response.data.request.status });
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <PageHeader title="Collaboration requests" subtitle="Accept people onto your projects, or follow up on your own requests." />

      <div className="tabs" role="tablist">
        {[["received", "Received"], ["sent", "Sent"]].map(([value, label]) => (
          <button key={value} role="tab" aria-selected={tab === value}
            className={`tab ${tab === value ? "active" : ""}`} onClick={() => setTab(value)}>
            {label}
          </button>
        ))}
      </div>

      <ErrorMessage message={requests.error} />
      {requests.loading && <LoadingState />}

      {!requests.loading && requests.items.length === 0 && !requests.error && (
        <EmptyState title={tab === "received" ? "No requests yet" : "You haven't sent any requests"}>
          {tab === "received"
            ? "When someone asks to join one of your projects, it shows up here."
            : "Find a project you like and send a request from its page."}
        </EmptyState>
      )}

      {requests.items.map((request) => (
        <RequestCard
          key={request._id}
          request={request}
          mode={tab}
          busy={busyId === request._id}
          onAccept={(item) => decide(item, acceptRequest, "Request accepted. They are now on the team.")}
          onReject={(item) => decide(item, rejectRequest, "Request rejected")}
          onCancel={(item) => decide(item, cancelRequest, "Request cancelled")}
        />
      ))}

      <LoadMore hasMore={requests.hasMore} loading={requests.loadingMore} onClick={requests.loadMore} />
    </div>
  );
};

export default Requests;
