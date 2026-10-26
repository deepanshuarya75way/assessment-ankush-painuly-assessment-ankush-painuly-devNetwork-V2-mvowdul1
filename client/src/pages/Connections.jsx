import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import PremiumBadge from "../components/PremiumBadge";

export default function Connections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/connections");
      setConnections(res.data.connections);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const handleRemove = async (connectionId) => {
    try {
      await api.delete(`/connections/remove/${connectionId}`);
      setConnections((current) =>
        current.filter((connection) => connection.connectionId !== connectionId)
      );
      toast.success("Connection removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Remove failed");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-dark-500 bg-dark-700 p-6">
        <h1 className="text-3xl font-semibold text-white">Your connections</h1>
        <p className="mt-2 text-slate-400">
          Keep in touch with developers you already connected with.
        </p>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center text-slate-400">
          Loading connections...
        </div>
      ) : connections.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {connections.map((item) => (
            <article
              key={item.connectionId}
              className="rounded-3xl border border-dark-500 bg-dark-700 p-5"
            >
              <div className="flex items-start gap-4">
                <UserAvatar user={item.user} size="lg" />
                <div className="flex-1">
                  <Link
                    to={`/profile/${item.user?._id}`}
                    className="inline-flex items-center gap-1 text-lg font-semibold text-white hover:text-brand-300"
                  >
                    {item.user?.name}
                    <PremiumBadge user={item.user} size="sm" />
                  </Link>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.user?.headline || "Developer on DevNetwork"}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    Connected on {new Date(item.connectedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <Link
                  to={`/chat/${item.user?._id}`}
                  className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  Chat
                </Link>
                <Link
                  to={`/profile/${item.user?._id}`}
                  className="rounded-2xl border border-dark-400 px-4 py-3 text-sm text-slate-200"
                >
                  View profile
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(item.connectionId)}
                  className="rounded-2xl border border-red-500/30 px-4 py-3 text-sm text-red-300"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">No connections yet</h2>
          <p className="mt-2 text-slate-400">
            Explore developers and send your first connection request.
          </p>
        </div>
      )}
    </div>
  );
}
