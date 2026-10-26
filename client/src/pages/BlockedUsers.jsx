import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import UserAvatar from "../components/UserAvatar";

export default function BlockedUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlockedUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get("/users/blocked/list");
        setUsers(res.data.users);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load blocked users");
      } finally {
        setLoading(false);
      }
    };

    loadBlockedUsers();
  }, []);

  const handleUnblock = async (userId) => {
    try {
      await api.post(`/users/${userId}/unblock`);
      setUsers((current) => current.filter((user) => user._id !== userId));
      toast.success("User unblocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unblock failed");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-dark-500 bg-dark-700 p-6">
        <h1 className="text-3xl font-semibold text-white">Blocked users</h1>
      </section>
      {loading ? (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center text-slate-400">Loading blocked users...</div>
      ) : users.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {users.map((user) => (
            <div key={user._id} className="rounded-3xl border border-dark-500 bg-dark-700 p-5">
              <div className="flex items-start justify-between gap-4">
                <Link to={`/profile/${user._id}`} className="flex items-start gap-4">
                  <UserAvatar user={user} size="lg" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">{user.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{user.headline || "Developer on DevNetwork"}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => handleUnblock(user._id)}
                  className="rounded-2xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300"
                >
                  Unblock
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center text-slate-400">No blocked users.</div>
      )}
    </div>
  );
}
