import { useState } from "react";

const initialForm = {
  content: "",
  tags: "",
  code: "",
  language: "javascript",
  visibility: "public",
  image: null,
};

export default function PostComposer({ onCreate, loading }) {
  const [form, setForm] = useState(initialForm);
  const [showCode, setShowCode] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreate(form);
    setForm(initialForm);
    setShowCode(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-dark-500 bg-dark-700 p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Share something</h2>
          <p className="text-sm text-slate-400">
            Post an update, code snippet, or idea.
          </p>
        </div>
        <select
          value={form.visibility}
          onChange={(event) =>
            setForm((current) => ({ ...current, visibility: event.target.value }))
          }
          className="rounded-xl border border-dark-400 bg-dark-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-500"
        >
          <option value="public">Public</option>
          <option value="connections">Connections</option>
        </select>
      </div>

      <textarea
        value={form.content}
        onChange={(event) =>
          setForm((current) => ({ ...current, content: event.target.value }))
        }
        rows={4}
        placeholder="What are you building today?"
        className="mb-4 w-full rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-brand-500"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={form.tags}
          onChange={(event) =>
            setForm((current) => ({ ...current, tags: event.target.value }))
          }
          placeholder="Tags: react,node,mongodb"
          className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-brand-500"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              image: event.target.files?.[0] || null,
            }))
          }
          className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-500 file:px-3 file:py-2 file:text-white"
        />
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowCode((current) => !current)}
          className="text-sm font-medium text-brand-300 transition hover:text-brand-500"
        >
          {showCode ? "Hide code snippet" : "Add code snippet"}
        </button>
      </div>

      {showCode && (
        <div className="mt-4 grid gap-4">
          <input
            value={form.language}
            onChange={(event) =>
              setForm((current) => ({ ...current, language: event.target.value }))
            }
            placeholder="Language"
            className="rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-brand-500"
          />
          <textarea
            value={form.code}
            onChange={(event) =>
              setForm((current) => ({ ...current, code: event.target.value }))
            }
            rows={6}
            placeholder="Paste your code here"
            className="w-full rounded-2xl border border-slate-800 bg-[#0b1220] px-4 py-3 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-brand-500"
          />
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? "Posting..." : "Create post"}
        </button>
      </div>
    </form>
  );
}
