import { useState, useEffect } from "react";
import { Search, Scan, ArrowUpDown, Download } from "lucide-react";
import { getDetections } from "../services/supabase";
import { useRealtimeDetections } from "../hooks/useRealtime";
import type { Detection } from "../types";

export default function ObjectDetection() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"timestamp" | "confidence" | "object_name">("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  const rtDetections = useRealtimeDetections(detections);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDetections();
        setDetections(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = rtDetections
    .filter((d) => (search ? d.object_name.toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "timestamp") return dir * (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (sortField === "confidence") return dir * (a.confidence - b.confidence);
      return dir * a.object_name.localeCompare(b.object_name);
    });

  const toggleSort = (field: "timestamp" | "confidence" | "object_name") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Object Name", "Confidence", "Position X", "Position Y", "Timestamp"].join(","),
      ...filtered.map((d) =>
        [d.id, d.object_name, d.confidence, d.position_x ?? "", d.position_y ?? "", d.timestamp].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "detections.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <h1 className="text-2xl font-bold tracking-tight">Object Detection</h1>
          <p className="text-sm text-neutral-500 mt-1">View and manage detected objects</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by object name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md border border-neutral-200 text-sm outline-none focus:border-neutral-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">{filtered.length} results</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  <button
                    onClick={() => toggleSort("object_name")}
                    className="flex items-center gap-1 hover:text-neutral-900"
                  >
                    Object Name
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  <button
                    onClick={() => toggleSort("confidence")}
                    className="flex items-center gap-1 hover:text-neutral-900"
                  >
                    Confidence
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Position</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  <button
                    onClick={() => toggleSort("timestamp")}
                    className="flex items-center gap-1 hover:text-neutral-900"
                  >
                    Timestamp
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Scan className="w-4 h-4 text-neutral-400" />
                      <span className="font-medium">{d.object_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 rounded-full"
                          style={{ width: `${d.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono">{(d.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-neutral-500">
                    {d.position_x !== null && d.position_y !== null
                      ? `x:${d.position_x.toFixed(1)} y:${d.position_y.toFixed(1)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(d.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.confidence >= 0.9
                          ? "bg-emerald-50 text-emerald-700"
                          : d.confidence >= 0.7
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          d.confidence >= 0.9
                            ? "bg-emerald-500"
                            : d.confidence >= 0.7
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {d.confidence >= 0.9 ? "High" : d.confidence >= 0.7 ? "Medium" : "Low"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    No detections found
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
