import { useState } from "react";

import EmptyState from "../components/common/EmptyState.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import LoadMore from "../components/common/LoadMore.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import PostCard from "../components/posts/PostCard.jsx";
import PostForm from "../components/posts/PostForm.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import { useToast } from "../hooks/useToast.js";
import { deletePost, getPosts } from "../services/post.service.js";
import { POST_TYPES } from "../utils/constants.js";
import { getErrorMessage } from "../utils/errors.js";

const Feed = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [type, setType] = useState("");
  const [tag, setTag] = useState("");
  const [tab, setTab] = useState("all"); // "all" | "saved"

  const posts = usePaginatedList(
    (page) => getPosts({
        page,
        type: type || undefined,
        tag: tag || undefined,
        saved: tab === "saved" || undefined,
      }),
    "posts",
    [type, tag, tab],
  );

  const handleDelete = async (post) => {
    try {
      await deletePost(post._id);
      posts.removeItem(post._id);
      toast.success("Post deleted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="stack">
      <PageHeader title="Feed" subtitle="What developers and students are building right now." />

      <PostForm onCreated={posts.addItem} />

      <div className="tabs" role="tablist">
        {[["all", "All posts"], ["saved", "Saved"]].map(([value, label]) => (
          <button key={value} role="tab" aria-selected={tab === value}
            className={`tab ${tab === value ? "active" : ""}`} onClick={() => setTab(value)}>
            {label}
          </button>
        ))}
      </div>

      <div className="filter-chips" role="group" aria-label="Filter posts">
        {[{ value: "", label: "All" }, ...POST_TYPES].map((option) => (
          <button key={option.value} type="button"
            className={`filter-chip ${type === option.value ? "active" : ""}`}
            onClick={() => setType(option.value)}>
            {option.label}
          </button>
        ))}

        {tag && (
          <button type="button" className="filter-chip active" onClick={() => setTag("")}>
            #{tag} ×
          </button>
        )}
      </div>

      <ErrorMessage message={posts.error} />
      {posts.loading && <LoadingState />}

      {!posts.loading && posts.items.length === 0 && !posts.error && (
        <EmptyState title={tab === "saved" ? "Nothing saved yet" : "No posts here yet"}>
          {tab === "saved" ? "Use ☆ Save on a post to keep it here." : "Be the first to share something."}
        </EmptyState>
      )}

      {posts.items.map((post) => (
        <PostCard key={post._id} post={post} currentUserId={user._id}
          onDelete={handleDelete} onTagSelect={setTag}
          onChange={(id, changes) => (tab === "saved" && changes.savedByMe === false ? posts.removeItem(id) : posts.updateItem(id, changes))} />
      ))}

      <LoadMore hasMore={posts.hasMore} loading={posts.loadingMore} onClick={posts.loadMore} />
    </div>
  );
};

export default Feed;
