import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import api from "../api/axios";
import PostComposer from "../components/PostComposer";
import PostCard from "../components/PostCard";

export default function Feed() {
  const { user } = useSelector((store) => store.user);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadFeed = async (nextPage = 1, append = false) => {
    try {
      setLoading(!append);
      const res = await api.get(`/posts/feed?page=${nextPage}&limit=10`);
      setPosts((current) => (append ? [...current, ...res.data.posts] : res.data.posts));
      setPage(res.data.page);
      setHasMore(res.data.hasMore);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleCreatePost = async (form) => {
    if (!form.content.trim() && !form.image && !form.code.trim()) {
      toast.error("Write something or add media before posting");
      return;
    }

    try {
      setCreating(true);
      const formData = new FormData();
      formData.append("content", form.content);
      formData.append("visibility", form.visibility);

      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      if (tags.length) {
        formData.append("tags", JSON.stringify(tags));
      }

      if (form.code.trim()) {
        formData.append(
          "codeSnippet",
          JSON.stringify({
            code: form.code,
            language: form.language || "javascript",
          })
        );
      }

      if (form.image) {
        formData.append("image", form.image);
      }

      const res = await api.post("/posts", formData);
      setPosts((current) => [res.data.post, ...current]);
      toast.success("Post created");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create post");
    } finally {
      setCreating(false);
    }
  };

  const replacePost = (postId, updater) => {
    setPosts((current) =>
      current.map((post) => (post._id === postId ? updater(post) : post))
    );
  };

  const handleReact = async (postId, reaction) => {
    try {
      const res = await api.patch(`/posts/${postId}/react`, { reaction });
      replacePost(postId, (post) => {
        const nextReactions = { ...post.reactions };
        Object.keys(nextReactions).forEach((key) => {
          nextReactions[key] = (nextReactions[key] || []).filter(
            (id) => id !== user._id && id?._id !== user._id
          );
        });
        if (res.data.userReaction) {
          nextReactions[res.data.userReaction] = [
            ...(nextReactions[res.data.userReaction] || []),
            user._id,
          ];
        }
        return { ...post, reactions: nextReactions };
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Reaction failed");
    }
  };

  const handleComment = async (postId, text) => {
    if (!text.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const res = await api.post(`/posts/${postId}/comment`, { text });
      replacePost(postId, (post) => ({ ...post, comments: res.data.comments }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Comment failed");
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const res = await api.delete(`/posts/${postId}/comment/${commentId}`);
      replacePost(postId, (post) => ({ ...post, comments: res.data.comments }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete comment failed");
    }
  };

  const handleToggleSave = async (postId) => {
    try {
      const res = await api.patch(`/posts/${postId}/save`);
      replacePost(postId, (post) => ({
        ...post,
        savedBy: res.data.isSaved
          ? [...(post.savedBy || []), user._id]
          : (post.savedBy || []).filter((id) => id !== user._id && id?._id !== user._id),
      }));
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((current) => current.filter((post) => post._id !== postId));
      toast.success("Post deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const handleRepost = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/repost`, { note: "" });
      setPosts((current) => [res.data.post, ...current]);
      toast.success("Post reposted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Repost failed");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-dark-500 bg-gradient-to-br from-dark-700 to-dark-800 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Feed</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Share progress, discuss ideas, and keep up with your developer circle.
        </p>
      </section>

      <PostComposer onCreate={handleCreatePost} loading={creating} />

      {loading ? (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center text-slate-400">
          Loading feed...
        </div>
      ) : posts.length ? (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={user?._id}
              onReact={handleReact}
              onComment={handleComment}
              onDeleteComment={handleDeleteComment}
              onToggleSave={handleToggleSave}
              onDeletePost={handleDeletePost}
              onRepost={handleRepost}
            />
          ))}
          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => loadFeed(page + 1, true)}
                className="rounded-2xl border border-dark-400 bg-dark-700 px-5 py-3 text-sm font-medium text-slate-200"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">No posts yet</h2>
          <p className="mt-2 text-slate-400">
            Create your first post or connect with more developers to grow your feed.
          </p>
        </div>
      )}
    </div>
  );
}
