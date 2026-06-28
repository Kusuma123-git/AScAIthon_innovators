import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import type { Detection, Task, LogEntry } from "../types";

export function useRealtimeDetections(initial: Detection[] = []) {
  const [data, setData] = useState<Detection[]>(initial);

  useEffect(() => {
    const channel = supabase
      .channel("detections_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "detections" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setData((prev) => [payload.new as Detection, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setData((prev) =>
              prev.map((d) => (d.id === payload.new.id ? (payload.new as Detection) : d))
            );
          } else if (payload.eventType === "DELETE") {
            setData((prev) => prev.filter((d) => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return data;
}

export function useRealtimeTasks(initial: Task[] = []) {
  const [data, setData] = useState<Task[]>(initial);

  useEffect(() => {
    const channel = supabase
      .channel("tasks_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setData((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setData((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Task) : t))
            );
          } else if (payload.eventType === "DELETE") {
            setData((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return data;
}

export function useRealtimeLogs(initial: LogEntry[] = []) {
  const [data, setData] = useState<LogEntry[]>(initial);

  useEffect(() => {
    const channel = supabase
      .channel("logs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logs" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setData((prev) => [payload.new as LogEntry, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setData((prev) =>
              prev.map((l) => (l.id === payload.new.id ? (payload.new as LogEntry) : l))
            );
          } else if (payload.eventType === "DELETE") {
            setData((prev) => prev.filter((l) => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return data;
}
