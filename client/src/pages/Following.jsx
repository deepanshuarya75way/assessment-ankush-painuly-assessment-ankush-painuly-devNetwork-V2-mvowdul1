import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import UserAvatar from "../components/UserAvatar";

export default function Following() {
  const { userId } = useParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFollowing = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/users/${userId}/following`);
        setUsers(res.data.users);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load following");
      } finally {
        setLoading(false);
      }
    };

    loadFollowing();
  }, [userId]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-dark-500 bg-dark-700 p-6">
        <h1 className="text-3xl font-semibold text-white">Following</h1>
      </section>
      {loading ? (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center text-slate-400">Loading following...</div>
      ) : users.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {users.map((user) => (
            <Link key={user._id} to={`/profile/${user._id}`} className="rounded-3xl border border-dark-500 bg-dark-700 p-5">
              <div className="flex items-start gap-4">
                <UserAvatar user={user} size="lg" />
                <div>
                  <h2 className="text-lg font-semibold text-white">{user.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{user.headline || "Developer on DevNetwork"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center text-slate-400">Not following anyone yet.</div>
      )}
    </div>
  );
}
