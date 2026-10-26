import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { clearUser } from "../features/auth/userSlice";
import UserAvatar from "../components/UserAvatar";
import PremiumBadge from "../components/PremiumBadge";
import PostCard from "../components/PostCard";

const emptyForm = {
  name: "",
  headline: "",
  bio: "",
  location: "",
  github: "",
  linkedin: "",
  website: "",
  skills: "",
  techStack: "",
  availability: "just_exploring",
  experience: [],
  projects: [],
};

export default function Profile() {
  const { user: currentUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();
  const isOwnProfile = currentUser?._id === userId;

  const [profile, setProfile] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const socialLinks = useMemo(
    () =>
      [
        { label: "GitHub", value: profile?.github },
        { label: "LinkedIn", value: profile?.linkedin },
        { label: "Website", value: profile?.website },
      ].filter((item) => item.value),
    [profile]
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, postsRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/posts/user/${userId}`),
      ]);

      setProfile(profileRes.data.user);
      setConnectionStatus(profileRes.data.connectionStatus);
      setIsFollowing(Boolean(profileRes.data.isFollowing));
      setIsBlocked(Boolean(profileRes.data.isBlocked));
      setPosts(postsRes.data.posts);
      setForm({
        name: profileRes.data.user.name || "",
        headline: profileRes.data.user.headline || "",
        bio: profileRes.data.user.bio || "",
        location: profileRes.data.user.location || "",
        github: profileRes.data.user.github || "",
        linkedin: profileRes.data.user.linkedin || "",
        website: profileRes.data.user.website || "",
        skills: (profileRes.data.user.skills || []).join(", "),
        techStack: (profileRes.data.user.techStack || []).join(", "),
        availability: profileRes.data.user.availability || "just_exploring",
        experience: (profileRes.data.user.experience || []).map((item) => ({
          title: item.title || "",
          company: item.company || "",
          from: item.from ? item.from.slice(0, 10) : "",
          to: item.to ? item.to.slice(0, 10) : "",
          current: Boolean(item.current),
          description: item.description || "",
        })),
        projects: (profileRes.data.user.projects || []).map((item) => ({
          title: item.title || "",
          description: item.description || "",
          techStack: (item.techStack || []).join(", "),
          githubLink: item.githubLink || "",
          liveLink: item.liveLink || "",
        })),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const updatePost = (postId, updater) => {
    setPosts((current) =>
      current.map((post) => (post._id === postId ? updater(post) : post))
    );
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = {
        ...form,
        skills: form.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        techStack: form.techStack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        experience: form.experience
          .filter((item) => item.title || item.company || item.description)
          .map((item) => ({
            ...item,
            from: item.from || undefined,
            to: item.current ? undefined : item.to || undefined,
          })),
        projects: form.projects
          .filter((item) => item.title || item.description)
          .map((item) => ({
            ...item,
            techStack: item.techStack
              .split(",")
              .map((tech) => tech.trim())
              .filter(Boolean),
          })),
      };
      const res = await api.patch("/users/update", payload);
      setProfile(res.data.user);
      setForm((current) => ({
        ...current,
        experience: (res.data.user.experience || []).map((item) => ({
          title: item.title || "",
          company: item.company || "",
          from: item.from ? item.from.slice(0, 10) : "",
          to: item.to ? item.to.slice(0, 10) : "",
          current: Boolean(item.current),
          description: item.description || "",
        })),
        projects: (res.data.user.projects || []).map((item) => ({
          title: item.title || "",
          description: item.description || "",
          techStack: (item.techStack || []).join(", "),
          githubLink: item.githubLink || "",
          liveLink: item.liveLink || "",
        })),
      }));
      setEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const updateExperience = (index, field, value) => {
    setForm((current) => ({
      ...current,
      experience: current.experience.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const updateProject = (index, field, value) => {
    setForm((current) => ({
      ...current,
      projects: current.projects.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.patch("/users/avatar", formData);
      setProfile((current) => ({ ...current, avatar: res.data.avatar }));
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await api.post(`/connections/send/${userId}`);
      setConnectionStatus({
        status: "pending",
        connectionId: res.data.connection._id,
        isSender: true,
      });
      toast.success("Connection request sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
    }
  };

  const handleRemoveConnection = async () => {
    try {
      await api.delete(`/connections/remove/${connectionStatus.connectionId}`);
      setConnectionStatus(null);
      toast.success(
        connectionStatus?.status === "pending"
          ? "Request cancelled"
          : "Connection removed"
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  const handleFollow = async () => {
    try {
      const res = await api.post(`/users/${userId}/follow`);
      setIsFollowing(res.data.isFollowing);
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Follow failed");
    }
  };

  const handleBlock = async () => {
    try {
      if (isBlocked) {
        const res = await api.post(`/users/${userId}/unblock`);
        setIsBlocked(false);
        toast.success(res.data.message);
        return;
      }

      const res = await api.post(`/users/${userId}/block`);
      setIsBlocked(true);
      setIsFollowing(false);
      setConnectionStatus(null);
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Block action failed");
    }
  };

  const handleReact = async (postId, reaction) => {
    try {
      const res = await api.patch(`/posts/${postId}/react`, { reaction });
      updatePost(postId, (post) => {
        const nextReactions = { ...post.reactions };
        Object.keys(nextReactions).forEach((key) => {
          nextReactions[key] = (nextReactions[key] || []).filter(
            (id) => id !== currentUser._id && id?._id !== currentUser._id
          );
        });
        if (res.data.userReaction) {
          nextReactions[res.data.userReaction] = [
            ...(nextReactions[res.data.userReaction] || []),
            currentUser._id,
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
      const res = await api.patch(`/posts/${postId}/save`);
      updatePost(postId, (post) => ({
        ...post,
        savedBy: res.data.isSaved
          ? [...(post.savedBy || []), currentUser._id]
          : (post.savedBy || []).filter(
              (id) => id !== currentUser._id && id?._id !== currentUser._id
            ),
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
      await api.post(`/posts/${postId}/repost`, { note: "" });
      toast.success("Post reposted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Repost failed");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      dispatch(clearUser());
      toast.success("Logged out");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center text-slate-400">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center text-slate-400">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-dark-500 bg-dark-700 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <UserAvatar user={profile} size="xl" />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <h1 className="inline-flex items-center gap-2 text-3xl font-semibold text-white">
                  {profile.name}
                  <PremiumBadge user={profile} />
                </h1>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => setShowMobileMenu(true)}
                    className="ml-auto rounded-2xl border border-dark-400 p-2 text-slate-200 lg:hidden"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 7H20M4 12H20M4 17H20"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <p className="mt-2 text-slate-300">
                {profile.headline || "Developer on DevNetwork"}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                {profile.bio || "No bio added yet."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
                <span>{profile.location || "No location"}</span>
                <span className="capitalize">
                  {profile.availability?.replaceAll("_", " ")}
                </span>
                <span>Profile {profile.profileCompletion || 0}% complete</span>
              </div>
              {!!socialLinks.length && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {socialLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.value}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-brand-300 hover:text-white"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing((current) => !current)}
                  className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  {editing ? "Close editor" : "Edit profile"}
                </button>
                <label className="rounded-2xl border border-dark-400 px-4 py-3 text-sm text-slate-200">
                  {avatarUploading ? "Uploading..." : "Upload avatar"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </>
            ) : (
              <>
                {connectionStatus?.status === "accepted" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate(`/chat/${profile?._id}`)}
                      className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Chat
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveConnection}
                      className="rounded-2xl border border-brand-500 px-4 py-3 text-sm font-semibold text-brand-300"
                    >
                      Connected
                    </button>
                  </>
                ) : connectionStatus?.status === "pending" ? (
                  connectionStatus?.isSender ? (
                    <button
                      type="button"
                      onClick={handleRemoveConnection}
                      className="rounded-2xl border border-amber-500/40 px-4 py-3 text-sm font-semibold text-amber-300"
                    >
                      Cancel request
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="rounded-2xl border border-amber-500/30 px-4 py-3 text-sm font-semibold text-amber-300 opacity-80"
                    >
                      Request pending
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleConnect}
                    className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Connect
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFollow}
                  className="rounded-2xl border border-dark-400 px-4 py-3 text-sm text-slate-200"
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
                <button
                  type="button"
                  onClick={handleBlock}
                  className="rounded-2xl border border-red-500/30 px-4 py-3 text-sm text-red-300"
                >
                  {isBlocked ? "Unblock" : "Block"}
                </button>
              </>
            )}
          </div>
        </div>

        {!!profile.skills?.length && (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={`${profile._id}-${skill}`}
                className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {!!profile.techStack?.length && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.techStack.map((item) => (
              <span
                key={`${profile._id}-stack-${item}`}
                className="rounded-full bg-dark-800 px-3 py-1 text-xs text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        )}

      </section>

      {isOwnProfile && showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden">
          <div className="ml-auto flex h-full w-[82%] max-w-sm flex-col border-l border-dark-500 bg-dark-800 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">More</h2>
                <p className="text-sm text-slate-400">Quick access</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="rounded-2xl border border-dark-400 px-3 py-2 text-sm text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <Link
                to={`/followers/${currentUser?._id}`}
                onClick={() => setShowMobileMenu(false)}
                className="block rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm font-medium text-slate-200"
              >
                Followers
              </Link>
              <Link
                to={`/following/${currentUser?._id}`}
                onClick={() => setShowMobileMenu(false)}
                className="block rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm font-medium text-slate-200"
              >
                Following
              </Link>
              <Link
                to="/saved"
                onClick={() => setShowMobileMenu(false)}
                className="block rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm font-medium text-slate-200"
              >
                Saved
              </Link>
              <Link
                to="/blocked"
                onClick={() => setShowMobileMenu(false)}
                className="block rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm font-medium text-slate-200"
              >
                Blocked
              </Link>
            </div>

            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-2xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {isOwnProfile && editing && (
        <form
          onSubmit={handleProfileSave}
          className="grid gap-4 rounded-3xl border border-dark-500 bg-dark-700 p-6 md:grid-cols-2"
        >
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Name"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <input
            value={form.headline}
            onChange={(event) => setForm((current) => ({ ...current, headline: event.target.value }))}
            placeholder="Headline"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <input
            value={form.location}
            onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
            placeholder="Location"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <select
            value={form.availability}
            onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value }))}
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none"
          >
            <option value="open_to_work">Open to work</option>
            <option value="open_to_collaborate">Open to collaborate</option>
            <option value="busy">Busy</option>
            <option value="just_exploring">Just exploring</option>
          </select>
          <input
            value={form.github}
            onChange={(event) => setForm((current) => ({ ...current, github: event.target.value }))}
            placeholder="GitHub link"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <input
            value={form.linkedin}
            onChange={(event) => setForm((current) => ({ ...current, linkedin: event.target.value }))}
            placeholder="LinkedIn link"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <input
            value={form.website}
            onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
            placeholder="Website link"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <input
            value={form.skills}
            onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))}
            placeholder="Skills: react,node,express"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <input
            value={form.techStack}
            onChange={(event) => setForm((current) => ({ ...current, techStack: event.target.value }))}
            placeholder="Tech stack: mern,docker,aws"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none md:col-span-2"
          />
          <textarea
            value={form.bio}
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            rows={5}
            placeholder="Short bio"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none md:col-span-2"
          />
          <div className="rounded-3xl border border-dark-400 bg-dark-800 p-4 md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Experience</h3>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    experience: [
                      ...current.experience,
                      {
                        title: "",
                        company: "",
                        from: "",
                        to: "",
                        current: false,
                        description: "",
                      },
                    ],
                  }))
                }
                className="text-sm font-medium text-brand-300"
              >
                Add experience
              </button>
            </div>
            <div className="space-y-4">
              {form.experience.map((item, index) => (
                <div key={`experience-${index}`} className="rounded-2xl border border-dark-400 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={item.title}
                      onChange={(event) => updateExperience(index, "title", event.target.value)}
                      placeholder="Role"
                      className="rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-slate-100 outline-none"
                    />
                    <input
                      value={item.company}
                      onChange={(event) => updateExperience(index, "company", event.target.value)}
                      placeholder="Company"
                      className="rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-slate-100 outline-none"
                    />
                    <input
                      type="date"
                      value={item.from}
                      onChange={(event) => updateExperience(index, "from", event.target.value)}
                      className="rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-slate-100 outline-none"
                    />
                    <input
                      type="date"
                      value={item.to}
                      onChange={(event) => updateExperience(index, "to", event.target.value)}
                      disabled={item.current}
                      className="rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-slate-100 outline-none disabled:opacity-50"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-2">
                      <input
                        type="checkbox"
                        checked={item.current}
                        onChange={(event) => updateExperience(index, "current", event.target.checked)}
                      />
                      I currently work here
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(event) => updateExperience(index, "description", event.target.value)}
                      rows={3}
                      placeholder="What did you work on?"
                      className="rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-slate-100 outline-none md:col-span-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        experience: current.experience.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                    className="mt-3 text-sm text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {!form.experience.length && (
                <p className="text-sm text-slate-400">No experience added yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-dark-400 bg-dark-800 p-4 md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Projects</h3>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    projects: [
                      ...current.projects,
                      {
                        title: "",
                        description: "",
                        techStack: "",
                        githubLink: "",
                        liveLink: "",
                      },
                    ],
                  }))
                }
                className="text-sm font-medium text-brand-300"
              >
                Add project
              </button>
            </div>
            <div className="space-y-4">
              {form.projects.map((item, index) => (
                <div key={`project-${index}`} className="rounded-2xl border border-dark-400 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={item.title}
                      onChange={(event) => updateProject(index, "title", event.target.value)}
                      placeholder="Project title"
                      className="rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-slate-100 outline-none"
                    />
                    <input
                      value={item.techStack}
                      onChange={(event) => updateProject(index, "techStack", event.target.value)}
                      placeholder="Tech stack: react,node,mongodb"
                      className="rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-slate-100 outline-none"
                    />
                    <input
                      value={item.githubLink}
                      onChange={(event) => updateProject(index, "githubLink", event.target.value)}
                      placeholder="GitHub URL"
                      className="rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-slate-100 outline-none"
                    />
                    <input
                      value={item.liveLink}
                      onChange={(event) => updateProject(index, "liveLink", event.target.value)}
                      placeholder="Live URL"
                      className="rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-slate-100 outline-none"
                    />
                    <textarea
                      value={item.description}
                      onChange={(event) => updateProject(index, "description", event.target.value)}
                      rows={3}
                      placeholder="Describe the project"
                      className="rounded-2xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-slate-100 outline-none md:col-span-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        projects: current.projects.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                    className="mt-3 text-sm text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {!form.projects.length && (
                <p className="text-sm text-slate-400">No projects added yet.</p>
              )}
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      )}

      {!!profile.experience?.length && (
        <section className="rounded-3xl border border-dark-500 bg-dark-700 p-6">
          <h2 className="text-2xl font-semibold text-white">Experience</h2>
          <div className="mt-5 space-y-4">
            {profile.experience.map((item, index) => (
              <div key={`experience-view-${index}`} className="rounded-2xl border border-dark-400 bg-dark-800 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.company}</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {item.from ? new Date(item.from).toLocaleDateString() : "Start"}{" "}
                    - {item.current ? "Present" : item.to ? new Date(item.to).toLocaleDateString() : "End"}
                  </p>
                </div>
                {item.description && (
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!!profile.projects?.length && (
        <section className="rounded-3xl border border-dark-500 bg-dark-700 p-6">
          <h2 className="text-2xl font-semibold text-white">Projects</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {profile.projects.map((item, index) => (
              <div key={`project-view-${index}`} className="rounded-2xl border border-dark-400 bg-dark-800 p-4">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                {item.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                )}
                {!!item.techStack?.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.techStack.map((tech) => (
                      <span
                        key={`${item.title}-${tech}`}
                        className="rounded-full bg-dark-700 px-3 py-1 text-xs text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-4 text-sm">
                  {item.githubLink && (
                    <a href={item.githubLink} target="_blank" rel="noreferrer" className="text-brand-300">
                      GitHub
                    </a>
                  )}
                  {item.liveLink && (
                    <a href={item.liveLink} target="_blank" rel="noreferrer" className="text-brand-300">
                      Live demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-5">
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-5">
          <h2 className="text-2xl font-semibold text-white">Posts</h2>
          <p className="mt-2 text-slate-400">
            Updates shared by {profile.name}.
          </p>
        </div>

        {posts.length ? (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUser?._id}
              onReact={handleReact}
              onComment={handleComment}
              onDeleteComment={handleDeleteComment}
              onToggleSave={handleToggleSave}
              onDeletePost={handleDeletePost}
              onRepost={handleRepost}
            />
          ))
        ) : (
          <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center">
            <h3 className="text-xl font-semibold text-white">No posts yet</h3>
            <p className="mt-2 text-slate-400">This profile has not shared any posts yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
