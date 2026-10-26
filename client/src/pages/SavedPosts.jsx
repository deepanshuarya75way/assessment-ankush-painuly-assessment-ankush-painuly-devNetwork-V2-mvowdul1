import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import api from "../api/axios";
import PostCard from "../components/PostCard";

export default function SavedPosts() {
  const { user } = useSelector((store) => store.user);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSavedPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/posts/saved");
      setPosts(res.data.posts);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load saved posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const updatePost = (postId, updater) => {
    setPosts((current) =>
      current
        .map((post) => (post._id === postId ? updater(post) : post))
        .filter(Boolean)
    );
  };

  const handleReact = async (postId, reaction) => {
    try {
      const res = await api.patch(`/posts/${postId}/react`, { reaction });
      updatePost(postId, (post) => {
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
      updatePost(postId, (post) => ({ ...post, comments: res.data.comments }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Comment failed");
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const res = await api.delete(`/posts/${postId}/comment/${commentId}`);
      updatePost(postId, (post) => ({ ...post, comments: res.data.comments }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete comment failed");
    }
  };

  const handleToggleSave = async (postId) => {
    try {
      await api.patch(`/posts/${postId}/save`);
      updatePost(postId, () => null);
      toast.success("Post removed from saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      updatePost(postId, () => null);
      toast.success("Post deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const handleRepost = async (postId) => {
    try {
      await api.post(`/posts/${postId}/repost`, { note: "" });
      toast.success("Post reposted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Repost failed");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-dark-500 bg-dark-700 p-6">
        <h1 className="text-3xl font-semibold text-white">Saved posts</h1>
        <p className="mt-2 text-slate-400">
          Keep important updates and code ideas here for later.
        </p>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center text-slate-400">
          Loading saved posts...
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
        </div>
      ) : (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">No saved posts yet</h2>
          <p className="mt-2 text-slate-400">
            Save useful posts from your feed and they will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
