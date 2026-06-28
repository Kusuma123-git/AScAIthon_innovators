import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { getAnalytics } from "../services/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4"];

export default function Analytics() {
  const [data, setData] = useState({
    dailyOperations: [] as { date: string; detections: number; tasks: number }[],
    detectionStats: [] as { object_name: string; count: number }[],
    taskMetrics: [] as { status: string; count: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const analytics = await getAnalytics();
        setData(analytics);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">Performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Calendar className="w-4 h-4" />
          <span>Last 7 days</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily operations */}
        <div className="bg-white rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-neutral-600" />
            <h3 className="font-semibold text-sm">Daily Operations</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyOperations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { weekday: "short" })}
                  tick={{ fontSize: 12 }}
                  stroke="#a3a3a3"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e5e5e5",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="detections" fill="#171717" radius={[4, 4, 0, 0]} name="Detections" />
                <Bar dataKey="tasks" fill="#a3a3a3" radius={[4, 4, 0, 0]} name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detection stats */}
        <div className="bg-white rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-neutral-600" />
            <h3 className="font-semibold text-sm">Detection Statistics</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.detectionStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="object_name"
                  label={({ name, value }: { name?: string; value?: number }) => `${name ?? ""}: ${value ?? 0}`}
                  labelLine={false}
                >
                  {data.detectionStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e5e5e5",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task metrics */}
        <div className="bg-white rounded-lg border border-neutral-200 p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-neutral-600" />
            <h3 className="font-semibold text-sm">Task Completion Metrics</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.taskMetrics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                <YAxis
                  dataKey="status"
                  type="category"
                  tick={{ fontSize: 12 }}
                  stroke="#a3a3a3"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e5e5e5",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#171717" radius={[0, 4, 4, 0]} name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Total Detections</p>
          <p className="text-2xl font-bold mt-1">
            {data.detectionStats.reduce((a, b) => a + b.count, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Total Tasks</p>
          <p className="text-2xl font-bold mt-1">
            {data.taskMetrics.reduce((a, b) => a + b.count, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Completion Rate</p>
          <p className="text-2xl font-bold mt-1">
            {(() => {
              const total = data.taskMetrics.reduce((a, b) => a + b.count, 0);
              const completed = data.taskMetrics.find((t) => t.status === "completed")?.count ?? 0;
              return total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
