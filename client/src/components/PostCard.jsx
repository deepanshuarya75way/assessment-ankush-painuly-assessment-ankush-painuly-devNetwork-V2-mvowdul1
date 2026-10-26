import { Link } from "react-router-dom";
import { useState } from "react";
import UserAvatar from "./UserAvatar";
import PremiumBadge from "./PremiumBadge";

const reactions = ["fire", "insightful", "nicework", "interesting"];

function getCount(post, reaction) {
  return post?.reactions?.[reaction]?.length || 0;
}

function getUserReaction(post, userId) {
  return reactions.find((reaction) =>
    post?.reactions?.[reaction]?.some((id) => id === userId || id?._id === userId)
  );
}

export default function PostCard({
  post,
  currentUserId,
  onReact,
  onComment,
  onDeleteComment,
  onToggleSave,
  onDeletePost,
  onRepost,
}) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const activeReaction = getUserReaction(post, currentUserId);
  const isSaved = post?.savedBy?.some((id) => id === currentUserId || id?._id === currentUserId);
  const postToShow = post.repostOf || post;

  const submitComment = async (event) => {
    event.preventDefault();
    await onComment(post._id, commentText);
    setCommentText("");
  };

  return (
    <article className="rounded-3xl border border-dark-500 bg-dark-700 p-5">
      {post.repostOf && (
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-brand-300">
          Reposted
        </p>
      )}

      <div className="flex items-start gap-3">
        <UserAvatar user={post.author} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Link
                to={`/profile/${post.author?._id}`}
                className="inline-flex items-center gap-1 font-semibold text-white hover:text-brand-300"
              >
                {post.author?.name}
                <PremiumBadge user={post.author} size="sm" />
              </Link>
              <p className="text-sm text-slate-400">
                {post.author?.headline || "Developer on DevNetwork"}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {new Date(post.createdAt).toLocaleString()}
            </p>
          </div>

          {post.content && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-200">
              {post.content}
            </p>
          )}

          {post.repostOf && (
            <div className="mt-4 rounded-2xl border border-dark-400 bg-dark-800 p-4">
              <div className="mb-3 flex items-start gap-3">
                <UserAvatar user={postToShow.author} size="sm" />
                <div className="min-w-0">
                  <Link
                    to={`/profile/${postToShow.author?._id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-brand-300"
                  >
                    {postToShow.author?.name}
                    <PremiumBadge user={postToShow.author} size="sm" />
                  </Link>
                  <p className="text-xs text-slate-400">
                    {postToShow.author?.headline || "Developer on DevNetwork"}
                  </p>
                </div>
              </div>
              {postToShow.content && (
                <p className="whitespace-pre-wrap text-sm text-slate-300">
                  {postToShow.content}
                </p>
              )}
              {postToShow.image && (
                <img
                  src={postToShow.image}
                  alt="Reposted content"
                  className="mt-3 max-h-[75vh] w-full rounded-2xl object-contain bg-dark-900"
                />
              )}
              {postToShow.codeSnippet?.code && (
                <div className="mt-3 rounded-2xl border border-slate-800 bg-[#0b1220] p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-brand-300">
                    {postToShow.codeSnippet.language || "code"}
                  </p>
                  <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-slate-200">
                    {postToShow.codeSnippet.code}
                  </pre>
                </div>
              )}
              {!!postToShow.tags?.length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {postToShow.tags.map((tag) => (
                    <span
                      key={`${postToShow._id}-${tag}`}
                      className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {!post.repostOf && post.image && (
            <img
              src={post.image}
              alt="Post"
              className="mt-4 max-h-[75vh] w-full rounded-2xl object-contain bg-dark-900"
            />
          )}

          {!post.repostOf && post.codeSnippet?.code && (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-brand-300">
                {post.codeSnippet.language || "code"}
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-slate-200">
                {post.codeSnippet.code}
              </pre>
            </div>
          )}

          {!!post.tags?.length && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={`${post._id}-${tag}`}
                  className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {reactions.map((reaction) => (
              <button
                key={reaction}
                type="button"
                onClick={() => onReact(post._id, reaction)}
                className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                  activeReaction === reaction
                    ? "bg-brand-500 text-white"
                    : "bg-dark-800 text-slate-300 hover:bg-dark-600 hover:text-slate-900"
                }`}
              >
                {reaction} {getCount(post, reaction)}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => setShowComments((current) => !current)}
              className="inline-flex items-center gap-2 rounded-xl border border-dark-400 px-3 py-2 text-slate-300 hover:text-slate-900"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <path
                  d="M8 10H16M8 14H13M21 12C21 16.4183 16.9706 20 12 20C10.735 20 9.53077 19.7681 8.44817 19.3482L3 20L4.08259 16.3916C3.4014 15.1246 3 13.6141 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Comments {post.comments?.length || 0}
            </button>
            <button
              type="button"
              onClick={() => onToggleSave(post._id)}
              className="rounded-xl border border-dark-400 px-3 py-2 text-slate-300 hover:text-slate-900"
            >
              {isSaved ? "Unsave" : "Save"}
            </button>
            {!post.repostOf && (
              <button
                type="button"
                onClick={() => onRepost(post._id)}
                className="rounded-xl border border-dark-400 px-3 py-2 text-slate-300 hover:text-slate-900"
              >
                Repost
              </button>
            )}
            {post.author?._id === currentUserId && (
              <button
                type="button"
                onClick={() => onDeletePost(post._id)}
                className="rounded-xl border border-red-500/30 px-3 py-2 text-red-300 hover:bg-red-500/10"
              >
                Delete
              </button>
            )}
          </div>

          {showComments && (
            <div className="mt-5 rounded-2xl border border-dark-400 bg-dark-800 p-4">
              <form onSubmit={submitComment} className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Write a comment"
                  className="flex-1 rounded-2xl border border-dark-400 bg-dark-900 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-medium text-white"
                >
                  Send
                </button>
              </form>

              {!!post.comments?.length ? (
                <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                  {post.comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="rounded-2xl border border-dark-400 bg-dark-900 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            <span className="inline-flex items-center gap-1">
                              {comment.user?.name || "Developer"}
                              <PremiumBadge user={comment.user} size="sm" />
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-slate-300">{comment.text}</p>
                        </div>
                        {(comment.user?._id === currentUserId || post.author?._id === currentUserId) && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment(post._id, comment._id)}
                            className="text-xs text-red-300"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">No comments yet. Start the discussion.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
