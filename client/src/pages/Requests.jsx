import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import UserAvatar from "../components/UserAvatar";

export default function Requests() {
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [incomingRes, sentRes] = await Promise.all([
        api.get("/connections/requests"),
        api.get("/connections/sent"),
      ]);
      setIncoming(incomingRes.data.requests);
      setSent(sentRes.data.requests);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReview = async (connectionId, status) => {
    try {
      await api.patch(`/connections/review/${status}/${connectionId}`);
      setIncoming((current) =>
        current.filter((request) => request._id !== connectionId)
      );
      toast.success(`Request ${status}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-dark-500 bg-dark-700 p-6">
        <h1 className="text-3xl font-semibold text-white">Requests</h1>
        <p className="mt-2 text-slate-400">
          Review incoming connection requests and track the ones you sent.
        </p>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-dark-500 bg-dark-700 p-8 text-center text-slate-400">
          Loading requests...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-dark-500 bg-dark-700 p-5">
            <h2 className="text-xl font-semibold text-white">Incoming</h2>
            <div className="mt-5 space-y-4">
              {incoming.length ? (
                incoming.map((request) => (
                  <div
                    key={request._id}
                    className="rounded-2xl border border-dark-400 bg-dark-800 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar user={request.sender} />
                      <div className="flex-1">
                        <Link
                          to={`/profile/${request.sender?._id}`}
                          className="font-semibold text-white hover:text-brand-300"
                        >
                          {request.sender?.name}
                        </Link>
                        <p className="mt-1 text-sm text-slate-400">
                          {request.sender?.headline || "Developer on DevNetwork"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReview(request._id, "accepted")}
                        className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview(request._id, "ignored")}
                        className="rounded-xl border border-dark-400 px-4 py-2 text-sm text-slate-300"
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No incoming requests.</p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-dark-500 bg-dark-700 p-5">
            <h2 className="text-xl font-semibold text-white">Sent</h2>
            <div className="mt-5 space-y-4">
              {sent.length ? (
                sent.map((request) => (
                  <div
                    key={request._id}
                    className="rounded-2xl border border-dark-400 bg-dark-800 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar user={request.receiver} />
                      <div className="flex-1">
                        <Link
                          to={`/profile/${request.receiver?._id}`}
                          className="font-semibold text-white hover:text-brand-300"
                        >
                          {request.receiver?.name}
                        </Link>
                        <p className="mt-1 text-sm text-slate-400">
                          {request.receiver?.headline || "Developer on DevNetwork"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-brand-300">Pending</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No sent requests.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
