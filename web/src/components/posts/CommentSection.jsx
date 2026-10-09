import { useState } from "react";

import { addComment, deleteComment, getComments } from "../../services/post.service.js";
import { useFetch } from "../../hooks/useFetch.js";
import { useToast } from "../../hooks/useToast.js";
import { getErrorMessage } from "../../utils/errors.js";
import { timeAgo } from "../../utils/format.js";
import Avatar from "../common/Avatar.jsx";
import ErrorMessage from "../common/ErrorMessage.jsx";

/** Comment thread under a post. `onCountChange(delta)` keeps the post's counter in sync. */
const CommentSection = ({ post, currentUserId, onCountChange }) => {
  const toast = useToast();
  const { data, loading, error, setData } = useFetch(() => getComments(post._id, { limit: 50 }), [post._id]);

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const comments = data?.comments || [];

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await addComment(post._id, text);
      setData((previous) => ({ ...previous, comments: [...(previous?.comments || []), response.data.comment] }));
      onCountChange(1);
      setText("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (comment) => {
    try {
      await deleteComment(post._id, comment._id);
      setData((previous) => ({ ...previous, comments: previous.comments.filter((c) => c._id !== comment._id) }));
      onCountChange(-1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <section className="comments" aria-label="Comments">
      <ErrorMessage message={error} />
      {loading && !data && <p className="muted">Loading comments…</p>}

      {comments.map((comment) => (
        <div key={comment._id} className="comment">
          <Avatar user={comment.author} size={28} />
          <div className="comment-body">
            <strong>{comment.author?.name}</strong> <span className="muted">{timeAgo(comment.createdAt)}</span>
            <p>{comment.content}</p>
          </div>
          {(comment.author?._id === currentUserId || post.author?._id === currentUserId) && (
            <button type="button" className="btn-link" onClick={() => remove(comment)}>Delete</button>
          )}
        </div>
      ))}

      <form className="comment-form" onSubmit={submit}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…" aria-label="Write a comment" maxLength={1000} />
        <button type="submit" className="btn btn-sm btn-primary" disabled={saving || !text.trim()}>Reply</button>
      </form>
    </section>
  );
};

export default CommentSection;
