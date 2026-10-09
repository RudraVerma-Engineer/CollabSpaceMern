import { useState } from "react";
import { useNavigate } from "react-router-dom";

import EmptyState from "../components/common/EmptyState.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import LoadMore from "../components/common/LoadMore.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import UserCard from "../components/people/UserCard.jsx";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import { useToast } from "../hooks/useToast.js";
import { createDirectConversation } from "../services/conversation.service.js";
import { searchUsers } from "../services/user.service.js";
import { getErrorMessage } from "../utils/errors.js";

const People = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const filters = useDebouncedValue({ q, skill });

  const people = usePaginatedList(
    (page) => searchUsers({ page, q: filters.q || undefined, skill: filters.skill || undefined }),
    "users",
    [filters],
  );

  const messageUser = async (user) => {
    try {
      const response = await createDirectConversation(user._id);
      navigate(`/messages/${response.data.conversation._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="stack">
      <PageHeader title="People" subtitle="Discover developers by skill, college or name." />

      <div className="filters" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search people" aria-label="Search people" />
        <input type="search" value={skill} onChange={(e) => setSkill(e.target.value)}
          placeholder="Exact skill, e.g. react" aria-label="Skill" />
      </div>

      <ErrorMessage message={people.error} />
      {people.loading && <LoadingState />}

      {!people.loading && people.items.length === 0 && !people.error && (
        <EmptyState title="No one matches yet">Try a different name or skill.</EmptyState>
      )}

      <div className="card-grid">
        {people.items.map((user) => <UserCard key={user._id} user={user} onMessage={messageUser} />)}
      </div>

      <LoadMore hasMore={people.hasMore} loading={people.loadingMore} onClick={people.loadMore} />
    </div>
  );
};

export default People;
