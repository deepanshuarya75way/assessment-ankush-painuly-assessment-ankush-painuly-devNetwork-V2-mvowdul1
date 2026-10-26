import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import PremiumBadge from "../components/PremiumBadge";

export default function Explore() {
  const [query, setQuery] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSearching = Boolean(query.trim() || skills.trim() || availability);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (skills.trim()) params.set("skills", skills.trim());
      if (availability) params.set("availability", availability);

      const endpoint = isSearching
        ? `/users/search?${params.toString()}`
        : "/users/discover";

      const usersRes = await api.get(endpoint);
      setUsers(usersRes.data.users);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load developers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleConnect = async (userId) => {
    try {
      const res = await api.post(`/connections/send/${userId}`);
      setUsers((current) =>
        current.map((user) =>
          user._id === userId
            ? {
                ...user,
                connectionStatus: {
                  status: res.data.connection.status,
                  connectionId: res.data.connection._id,
                  isSender: true,
                },
              }
            : user
        )
      );
      toast.success("Connection request sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
    }
  };

  const handleRemoveConnection = async (user) => {
    try {
      await api.delete(
        `/connections/remove/${user.connectionStatus.connectionId}`
      );

      setUsers((current) =>
        current.map((item) =>
          item._id === user._id ? { ...item, connectionStatus: null } : item
        )
      );

      toast.success(
        user.connectionStatus?.status === "pending"
          ? "Request cancelled"
          : "Connection removed"
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-dark-500 bg-dark-700 p-6">
        <h1 className="text-3xl font-semibold text-white">Explore developers</h1>
        <p className="mt-2 text-slate-400">
          Search people by name, headline, skills, and availability.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or headline"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-brand-500"
          />
          <input
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            placeholder="Skills like react,node"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-brand-500"
          />
          <select
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-brand-500"
          >
            <option value="">All availability</option>
            <option value="open_to_work">Open to work</option>
            <option value="open_to_collaborate">Open to collaborate</option>
            <option value="busy">Busy</option>
            <option value="just_exploring">Just exploring</option>
          </select>
          <button
            type="button"
            onClick={loadUsers}
            className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white"
          >
            Search
          </button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center text-slate-400">
          Loading developers...
        </div>
      ) : users.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {users.map((user) => (
            <article
              key={user._id}
              className="rounded-3xl border border-dark-500 bg-dark-700 p-5"
            >
              <div className="flex items-start gap-4">
                <UserAvatar user={user} size="lg" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/profile/${user._id}`}
                    className="inline-flex items-center gap-1 text-xl font-semibold text-white hover:text-brand-300"
                  >
                    {user.name}
                    <PremiumBadge user={user} size="sm" />
                  </Link>
                  <p className="mt-1 text-sm text-slate-400">
                    {user.headline || "Developer on DevNetwork"}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    {user.location || "Location not added"}
                  </p>
                  <p className="mt-2 text-sm capitalize text-brand-300">
                    {user.availability?.replaceAll("_", " ")}
                  </p>
                  {!!user.skills?.length && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {user.skills.map((skill) => (
                        <span
                          key={`${user._id}-${skill}`}
                          className="rounded-full bg-dark-800 px-3 py-1 text-xs text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!isSearching && (
                <div className="mt-5 flex gap-3">
                  <Link
                    to={`/profile/${user._id}`}
                    className="rounded-2xl border border-dark-400 px-4 py-3 text-sm text-slate-200"
                  >
                    View profile
                  </Link>
                  {user.connectionStatus?.status === "accepted" ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveConnection(user)}
                      className="rounded-2xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300"
                    >
                      Remove
                    </button>
                  ) : user.connectionStatus?.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveConnection(user)}
                      className="rounded-2xl border border-amber-500/30 px-4 py-3 text-sm font-semibold text-amber-300"
                    >
                      Cancel request
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConnect(user._id)}
                      className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Connect
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">No developers found</h2>
          <p className="mt-2 text-slate-400">Try a different search or remove filters.</p>
        </div>
      )}
    </div>
  );
}
