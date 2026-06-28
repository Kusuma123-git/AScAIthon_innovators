import { useState, useEffect } from "react";
import {
  ListChecks,
  Plus,
  Search,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { getTasks, createTask, updateTask, deleteTask, createLog } from "../services/supabase";
import { useRealtimeTasks } from "../hooks/useRealtime";
import type { Task } from "../types";

const statusConfig = {
  pending: { icon: Clock, color: "bg-neutral-100 text-neutral-600", label: "Pending" },
  in_progress: { icon: AlertCircle, color: "bg-blue-50 text-blue-700", label: "In Progress" },
  completed: { icon: CheckCircle, color: "bg-emerald-50 text-emerald-700", label: "Completed" },
  failed: { icon: XCircle, color: "bg-red-50 text-red-700", label: "Failed" },
};

const priorityConfig = {
  low: { color: "bg-neutral-100 text-neutral-600" },
  normal: { color: "bg-blue-50 text-blue-700" },
  high: { color: "bg-amber-50 text-amber-700" },
  critical: { color: "bg-red-50 text-red-700" },
};

export default function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortField, setSortField] = useState<"created_at" | "priority">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showCreate, setShowCreate] = useState(false);
  const [_editingTask, _setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ object_name: "", priority: "normal" as Task["priority"], notes: "" });

  const rtTasks = useRealtimeTasks(tasks);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = rtTasks
    .filter((t) => {
      const matchesSearch = t.object_name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter ? t.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "created_at") return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const prioOrder = { low: 0, normal: 1, high: 2, critical: 3 };
      return dir * (prioOrder[a.priority] - prioOrder[b.priority]);
    });

  const toggleSort = (field: "created_at" | "priority") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTask = await createTask({
        object_name: form.object_name,
        status: "pending",
        priority: form.priority,
        notes: form.notes || null,
      });
      await createLog({
        action: `Created task for ${form.object_name}`,
        category: "robot",
        details: { task_id: newTask.id },
        timestamp: new Date().toISOString(),
      });
      setForm({ object_name: "", priority: "normal", notes: "" });
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (task: Task, status: Task["status"]) => {
    try {
      const updates: Partial<Task> = { status };
      if (status === "completed" || status === "failed") {
        updates.completed_at = new Date().toISOString();
      }
      await updateTask(task.id, updates);
      await createLog({
        action: `Task ${task.object_name} marked as ${status}`,
        category: "robot",
        details: { task_id: task.id, status },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      await createLog({
        action: `Deleted task`,
        category: "system",
        details: { task_id: id },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
          <p className="text-sm text-neutral-500 mt-1">Create and manage pick-and-place tasks</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md border border-neutral-200 text-sm outline-none focus:border-neutral-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["", "pending", "in_progress", "completed", "failed"] as const).map((s) => (
            <button
              key={s || "all"}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {s ? s.replace("_", " ") : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Task queue summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["pending", "in_progress", "completed", "failed"] as const).map((s) => {
          const count = rtTasks.filter((t) => t.status === s).length;
          const cfg = statusConfig[s];
          return (
            <div key={s} className={`rounded-lg border p-4 ${cfg.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-80">{cfg.label}</span>
                <cfg.icon className="w-4 h-4 opacity-60" />
              </div>
              <div className="text-xl font-bold mt-1">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Object</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  <button
                    onClick={() => toggleSort("priority")}
                    className="flex items-center gap-1 hover:text-neutral-900"
                  >
                    Priority
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  <button
                    onClick={() => toggleSort("created_at")}
                    className="flex items-center gap-1 hover:text-neutral-900"
                  >
                    Created
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const sCfg = statusConfig[t.status];
                const pCfg = priorityConfig[t.priority];
                return (
                  <tr
                    key={t.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-neutral-400" />
                        <span className="font-medium">{t.object_name}</span>
                      </div>
                      {t.notes && <p className="text-xs text-neutral-500 mt-0.5 ml-6">{t.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pCfg.color}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sCfg.color}`}>
                        <sCfg.icon className="w-3 h-3" />
                        {sCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {t.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(t, "in_progress")}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Start"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        )}
                        {t.status === "in_progress" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(t, "completed")}
                              className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(t, "failed")}
                              className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                              title="Fail"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">New Task</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-neutral-100 rounded">
                <XCircle className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Object</label>
                <input
                  required
                  type="text"
                  value={form.object_name}
                  onChange={(e) => setForm((f) => ({ ...f, object_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 text-sm outline-none focus:border-neutral-400"
                  placeholder="e.g. Box, Pallet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Task["priority"] }))}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 text-sm outline-none focus:border-neutral-400"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 text-sm outline-none focus:border-neutral-400 resize-none"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-md border border-neutral-200 text-sm font-medium hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
