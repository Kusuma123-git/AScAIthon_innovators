import { useEffect, useState } from "react";
import {
  Scan,
  ListChecks,
  CheckCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import { getDashboardStats, getDetections, getTasks, getLogs } from "../services/supabase";
import { useRealtimeDetections, useRealtimeTasks, useRealtimeLogs } from "../hooks/useRealtime";
import type { Detection, Task, LogEntry } from "../types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; up: boolean };
  status?: "healthy" | "warning" | "critical";
}

function StatCard({ title, value, icon: Icon, trend, status }: StatCardProps) {
  const statusColor =
    status === "healthy"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "warning"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : status === "critical"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-white text-neutral-900 border-neutral-200";

  return (
    <div className={`rounded-lg border p-5 ${statusColor}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium opacity-80">{title}</span>
        <Icon className="w-5 h-5 opacity-60" />
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {trend && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium">
          {trend.up ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" />
          )}
          <span>{trend.value}%</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDetections: 0,
    activeTasks: 0,
    completedTasks: 0,
    successRate: 0,
    systemHealth: "healthy" as "healthy" | "warning" | "critical",
  });
  const [detections, setDetections] = useState<Detection[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const rtDetections = useRealtimeDetections(detections);
  const rtTasks = useRealtimeTasks(tasks);
  const rtLogs = useRealtimeLogs(logs);

  useEffect(() => {
    async function load() {
      try {
        const [s, d, t, l] = await Promise.all([
          getDashboardStats(),
          getDetections(),
          getTasks(),
          getLogs(),
        ]);
        setStats(s);
        setDetections(d.slice(0, 5));
        setTasks(t.slice(0, 5));
        setLogs(l.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const chartData = [
    { time: "00:00", detections: 12, tasks: 4 },
    { time: "04:00", detections: 18, tasks: 6 },
    { time: "08:00", detections: 35, tasks: 12 },
    { time: "12:00", detections: 42, tasks: 15 },
    { time: "16:00", detections: 28, tasks: 9 },
    { time: "20:00", detections: 20, tasks: 7 },
    { time: "23:59", detections: 15, tasks: 5 },
  ];

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
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">System overview and real-time metrics</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-xs ${
              stats.systemHealth === "healthy"
                ? "bg-emerald-50 text-emerald-700"
                : stats.systemHealth === "warning"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                stats.systemHealth === "healthy"
                  ? "bg-emerald-500"
                  : stats.systemHealth === "warning"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
            {stats.systemHealth === "healthy"
              ? "System Healthy"
              : stats.systemHealth === "warning"
              ? "System Warning"
              : "System Critical"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Detections"
          value={stats.totalDetections}
          icon={Scan}
          trend={{ value: 12, up: true }}
        />
        <StatCard
          title="Active Tasks"
          value={stats.activeTasks}
          icon={ListChecks}
          trend={{ value: 5, up: false }}
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={CheckCircle}
          trend={{ value: 18, up: true }}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={TrendingUp}
          status={stats.systemHealth}
        />
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Operations Overview</h3>
            <span className="text-xs text-neutral-500">Last 24 hours</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="det" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e5e5e5",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="detections"
                  stroke="#171717"
                  strokeWidth={2}
                  fill="url(#det)"
                  name="Detections"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          {/* Recent detections */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Recent Detections</h3>
              <Scan className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="space-y-2">
              {rtDetections.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{d.object_name}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(d.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded">
                    {(d.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              {rtDetections.length === 0 && (
                <p className="text-sm text-neutral-400">No detections yet</p>
              )}
            </div>
          </div>

          {/* Recent tasks */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Recent Tasks</h3>
              <ListChecks className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="space-y-2">
              {rtTasks.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{t.object_name}</p>
                    <p className="text-xs text-neutral-500">{t.status}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : t.status === "in_progress"
                        ? "bg-blue-50 text-blue-700"
                        : t.status === "failed"
                        ? "bg-red-50 text-red-700"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
              {rtTasks.length === 0 && (
                <p className="text-sm text-neutral-400">No tasks yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System status */}
      <div className="bg-white rounded-lg border border-neutral-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-neutral-600" />
          <h3 className="font-semibold text-sm">System Status</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-md bg-neutral-50 border border-neutral-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <p className="text-sm font-medium">Camera Feed</p>
              <p className="text-xs text-neutral-500">Connected - 30 FPS</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-neutral-50 border border-neutral-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <p className="text-sm font-medium">Robot Arm</p>
              <p className="text-xs text-neutral-500">Online - Idle</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-neutral-50 border border-neutral-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <p className="text-sm font-medium">Object Detector</p>
              <p className="text-xs text-neutral-500">Running - YOLOv8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent logs */}
      <div className="bg-white rounded-lg border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-neutral-600" />
            <h3 className="font-semibold text-sm">Recent Activity</h3>
          </div>
        </div>
        <div className="space-y-2">
          {rtLogs.slice(0, 5).map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  l.category === "error"
                    ? "bg-red-500"
                    : l.category === "detection"
                    ? "bg-blue-500"
                    : l.category === "robot"
                    ? "bg-emerald-500"
                    : "bg-neutral-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{l.action}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(l.timestamp).toLocaleString()}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-medium uppercase">
                {l.category}
              </span>
            </div>
          ))}
          {rtLogs.length === 0 && (
            <p className="text-sm text-neutral-400">No activity yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
