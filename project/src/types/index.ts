export interface Detection {
  id: string;
  object_name: string;
  confidence: number;
  position_x: number | null;
  position_y: number | null;
  timestamp: string;
  created_at: string;
}

export interface Task {
  id: string;
  object_name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  priority: "low" | "normal" | "high" | "critical";
  created_at: string;
  completed_at: string | null;
  notes: string | null;
}

export interface LogEntry {
  id: string;
  action: string;
  category: "system" | "detection" | "robot" | "error";
  details: Record<string, unknown> | null;
  timestamp: string;
  created_at: string;
}

export interface DashboardStats {
  totalDetections: number;
  activeTasks: number;
  completedTasks: number;
  successRate: number;
  systemHealth: "healthy" | "warning" | "critical";
}

export interface AnalyticsData {
  dailyOperations: { date: string; detections: number; tasks: number }[];
  detectionStats: { object_name: string; count: number }[];
  taskMetrics: { status: string; count: number }[];
}
