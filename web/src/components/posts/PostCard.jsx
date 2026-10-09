import { useState } from "react";
import { Link } from "react-router-dom";

import { likePost, savePost } from "../../services/post.service.js";
import { useToast } from "../../hooks/useToast.js";
import { POST_TYPE_LABELS } from "../../utils/constants.js";
import { getErrorMessage } from "../../utils/errors.js";
import { assetUrl } from "../../utils/assets.js";
import { timeAgo } from "../../utils/format.js";
import Avatar from "../common/Avatar.jsx";
import ChipList from "../common/ChipList.jsx";
import ConfirmButton from "../common/ConfirmButton.jsx";
import CommentSection from "./CommentSection.jsx";

/**
 * `onChange(postId, changes)` lets the parent list keep the post's counters
 * (likes, comments, saved) up to date. Omit it for a read-only card.
 */
const PostCard = ({ post, currentUserId, onDelete, onTagSelect, onChange }) => {
  const toast = useToast();
  const [showComments, setShowComments] = useState(false);
  const isAuthor = post.author?._id === currentUserId;

  const runAction = async (action, toChanges) => {
    try {
      const response = await action(post._id);
      onChange?.(post._id, toChanges(response.data));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <article className="card post-card">
      <header className="post-card-header">
        <Avatar user={post.author} />

        <div className="post-author">
          <Link to={`/people/${post.author?._id}`}><strong>{post.author?.name}</strong></Link>
          <span className="muted">
            {post.author?.college ? `${post.author.college} · ` : ""}
            {timeAgo(post.createdAt)}
          </span>
        </div>

        <span className="badge badge-primary" style={{ marginLeft: "auto" }}>
          {POST_TYPE_LABELS[post.type]}
        </span>

        {isAuthor && onDelete && (
          <ConfirmButton
            title="Delete this post?"
            message="This cannot be undone."
            confirmLabel="Delete post"
            onConfirm={() => onDelete(post)}
          >
            Delete
          </ConfirmButton>
        )}
      </header>

      <p className="post-content">{post.content}</p>

      {post.media?.length > 0 && (
        <div className="post-media">
          {post.media.map((url) => <img key={url} src={assetUrl(url)} alt="" />)}
        </div>
      )}

      {post.project && (
        <div className="post-project">
          <span>Project:</span>
          <Link to={`/projects/${post.project._id}`}>{post.project.title}</Link>
        </div>
      )}

      <ChipList items={post.tags} prefix="#" onSelect={onTagSelect} />

      {onChange && (
        <div className="post-actions">
          <button type="button" className={`action-btn ${post.likedByMe ? "active" : ""}`}
            aria-pressed={post.likedByMe}
            onClick={() => runAction(likePost, (d) => ({ likedByMe: d.liked, likesCount: d.likesCount }))}>
            {post.likedByMe ? "♥" : "♡"} {post.likesCount || 0}
          </button>

          <button type="button" className="action-btn" aria-expanded={showComments}
            onClick={() => setShowComments((open) => !open)}>
            💬 {post.commentsCount || 0}
          </button>

          <button type="button" className={`action-btn ${post.savedByMe ? "active" : ""}`}
            aria-pressed={post.savedByMe}
            onClick={() => runAction(savePost, (d) => ({ savedByMe: d.saved }))}>
            {post.savedByMe ? "★ Saved" : "☆ Save"}
          </button>
        </div>
      )}

      {showComments && (
        <CommentSection
          post={post}
          currentUserId={currentUserId}
          onCountChange={(delta) => onChange(post._id, { commentsCount: Math.max(0, (post.commentsCount || 0) + delta) })}
        />
      )}
    </article>
  );
};

export default PostCard;
