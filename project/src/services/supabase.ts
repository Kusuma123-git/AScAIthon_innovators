import { createClient } from "@supabase/supabase-js";
import type { Detection, Task, LogEntry } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getDetections(search?: string) {
  let query = supabase
    .from("detections")
    .select("*")
    .order("timestamp", { ascending: false });
  if (search) {
    query = query.ilike("object_name", `%${search}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Detection[];
}

export async function createDetection(detection: Omit<Detection, "id" | "created_at">) {
  const { data, error } = await supabase.from("detections").insert(detection).select().single();
  if (error) throw error;
  return data as Detection;
}

export async function getTasks(status?: string) {
  let query = supabase.from("tasks").select("*").order("created_at", { ascending: false });
  if (status) {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(task: Omit<Task, "id" | "created_at" | "completed_at">) {
  const { data, error } = await supabase.from("tasks").insert(task).select().single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function getLogs(category?: string) {
  let query = supabase.from("logs").select("*").order("timestamp", { ascending: false });
  if (category) {
    query = query.eq("category", category);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LogEntry[];
}

export async function createLog(log: Omit<LogEntry, "id" | "created_at">) {
  const { data, error } = await supabase.from("logs").insert(log).select().single();
  if (error) throw error;
  return data as LogEntry;
}

export async function getDashboardStats() {
  const { data: detections, error: dErr } = await supabase.from("detections").select("id", { count: "exact", head: true });
  if (dErr) throw dErr;

  const { data: activeTasks, error: aErr } = await supabase.from("tasks").select("id", { count: "exact", head: true }).in("status", ["pending", "in_progress"]);
  if (aErr) throw aErr;

  const { data: completedTasks, error: cErr } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "completed");
  if (cErr) throw cErr;

  const { data: allTasks, error: tErr } = await supabase.from("tasks").select("id", { count: "exact", head: true });
  if (tErr) throw tErr;

  const totalTasks = allTasks?.length ?? 0;
  const completed = completedTasks?.length ?? 0;
  const successRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  const systemHealth: "healthy" | "warning" | "critical" = successRate >= 90 ? "healthy" : successRate >= 70 ? "warning" : "critical";

  return {
    totalDetections: detections?.length ?? 0,
    activeTasks: activeTasks?.length ?? 0,
    completedTasks: completed,
    successRate,
    systemHealth,
  };
}

export async function getAnalytics() {
  const { data: detections, error: dErr } = await supabase.from("detections").select("timestamp");
  if (dErr) throw dErr;

  const { data: tasks, error: tErr } = await supabase.from("tasks").select("status");
  if (tErr) throw tErr;

  const { data: detectionNames, error: nErr } = await supabase.from("detections").select("object_name");
  if (nErr) throw nErr;

  const dailyMap = new Map<string, { detections: number; tasks: number }>();
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap.set(key, { detections: 0, tasks: 0 });
  }

  (detections ?? []).forEach((d) => {
    const key = new Date(d.timestamp).toISOString().split("T")[0];
    if (dailyMap.has(key)) {
      const cur = dailyMap.get(key)!;
      dailyMap.set(key, { ...cur, detections: cur.detections + 1 });
    }
  });

  const detectionStatsMap = new Map<string, number>();
  (detectionNames ?? []).forEach((d) => {
    detectionStatsMap.set(d.object_name, (detectionStatsMap.get(d.object_name) ?? 0) + 1);
  });

  const taskMetricsMap = new Map<string, number>();
  (tasks ?? []).forEach((t) => {
    taskMetricsMap.set(t.status, (taskMetricsMap.get(t.status) ?? 0) + 1);
  });

  return {
    dailyOperations: Array.from(dailyMap.entries()).map(([date, val]) => ({ date, ...val })),
    detectionStats: Array.from(detectionStatsMap.entries()).map(([object_name, count]) => ({ object_name, count })),
    taskMetrics: Array.from(taskMetricsMap.entries()).map(([status, count]) => ({ status, count })),
  };
}
