import { useState, useEffect } from "react";
import { Search, AlertTriangle, Scan, Bot, Settings } from "lucide-react";
import { getLogs } from "../services/supabase";
import { useRealtimeLogs } from "../hooks/useRealtime";
import type { LogEntry } from "../types";

const categoryConfig = {
  system: { icon: Settings, color: "bg-neutral-100 text-neutral-600", dot: "bg-neutral-400" },
  detection: { icon: Scan, color: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  robot: { icon: Bot, color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  error: { icon: AlertTriangle, color: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const rtLogs = useRealtimeLogs(logs);

  useEffect(() => {
    async function load() {
      try {
        const data = await getLogs();
        setLogs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = rtLogs.filter((l) => {
    const matchesSearch = l.action.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? l.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-sm text-neutral-500 mt-1">System events and robot actions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md border border-neutral-200 text-sm outline-none focus:border-neutral-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["", "system", "detection", "robot", "error"] as const).map((c) => (
            <button
              key={c || "all"}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                categoryFilter === c
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {c ? c.charAt(0).toUpperCase() + c.slice(1) : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 font-medium text-neutral-600 w-32">Category</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Details</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const cfg = categoryConfig[l.category];
                return (
                  <tr
                    key={l.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {l.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{l.action}</td>
                    <td className="px-4 py-3">
                      {l.details ? (
                        <pre className="text-xs text-neutral-500 bg-neutral-50 rounded px-2 py-1 overflow-x-auto">
                          {JSON.stringify(l.details, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
