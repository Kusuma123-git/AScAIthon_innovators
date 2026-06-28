import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, Crosshair, RefreshCw } from "lucide-react";
import { createDetection, createLog } from "../services/supabase";

interface SimulatedObject {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
  color: string;
}

const OBJECT_NAMES = ["Box", "Cylinder", "Pallet", "Crate", "Bag", "Container"];

function generateRandomObjects(): SimulatedObject[] {
  const count = Math.floor(Math.random() * 4) + 2;
  const objects: SimulatedObject[] = [];
  for (let i = 0; i < count; i++) {
    objects.push({
      id: i,
      name: OBJECT_NAMES[Math.floor(Math.random() * OBJECT_NAMES.length)],
      x: Math.random() * 60 + 10,
      y: Math.random() * 50 + 15,
      w: Math.random() * 15 + 8,
      h: Math.random() * 15 + 8,
      confidence: Math.random() * 0.3 + 0.7,
      color: ["#171717", "#404040", "#737373", "#a3a3a3"][Math.floor(Math.random() * 4)],
    });
  }
  return objects;
}

export default function CameraFeed() {
  const [objects, setObjects] = useState<SimulatedObject[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SimulatedObject | null>(null);
  const [fps] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const refreshObjects = useCallback(() => {
    setObjects(generateRandomObjects());
  }, []);

  useEffect(() => {
    refreshObjects();
    intervalRef.current = setInterval(refreshObjects, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshObjects]);

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      for (const obj of objects) {
        await createDetection({
          object_name: obj.name,
          confidence: parseFloat(obj.confidence.toFixed(3)),
          position_x: parseFloat(obj.x.toFixed(1)),
          position_y: parseFloat(obj.y.toFixed(1)),
          timestamp: new Date().toISOString(),
        });
      }
      await createLog({
        action: `Captured ${objects.length} objects from camera feed`,
        category: "detection",
        details: { count: objects.length },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsCapturing(false), 800);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Camera Feed</h1>
          <p className="text-sm text-neutral-500 mt-1">Live object detection stream</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <span className="text-xs text-neutral-500 font-mono">{fps} FPS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera feed */}
        <div className="lg:col-span-2 space-y-4">
          <div
            ref={feedRef}
            className="relative bg-neutral-900 rounded-lg overflow-hidden aspect-video select-none"
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
            </div>

            {/* Crosshair center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Crosshair className="w-8 h-8 text-white/20" />
            </div>

            {/* Detection boxes */}
            {objects.map((obj) => (
              <div
                key={obj.id}
                className="absolute border-2 cursor-pointer transition-all hover:opacity-80"
                style={{
                  left: `${obj.x}%`,
                  top: `${obj.y}%`,
                  width: `${obj.w}%`,
                  height: `${obj.h}%`,
                  borderColor: obj.color,
                }}
                onClick={() => setSelectedObject(obj)}
              >
                <div
                  className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap"
                  style={{ backgroundColor: obj.color }}
                >
                  {obj.name} {(obj.confidence * 100).toFixed(0)}%
                </div>
                {/* Corner markers */}
                <div
                  className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2"
                  style={{ borderColor: obj.color }}
                />
                <div
                  className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2"
                  style={{ borderColor: obj.color }}
                />
                <div
                  className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2"
                  style={{ borderColor: obj.color }}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2"
                  style={{ borderColor: obj.color }}
                />
              </div>
            ))}

            {/* Capture flash */}
            {isCapturing && (
              <div className="absolute inset-0 bg-white/30 animate-pulse pointer-events-none" />
            )}

            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="w-4 h-4 text-white/70" />
                  <span className="text-xs text-white/70 font-mono">Camera 01 - Conveyor A</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshObjects}
                    className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCapture}
                    disabled={isCapturing}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    {isCapturing ? "Capturing..." : "Capture"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Object list */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="font-semibold text-sm mb-3">Detected Objects</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {objects.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => setSelectedObject(obj)}
                  className={`text-left p-3 rounded-md border transition-colors ${
                    selectedObject?.id === obj.id
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <p className="text-sm font-medium">{obj.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    x:{obj.x.toFixed(1)} y:{obj.y.toFixed(1)}
                  </p>
                  <p className="text-xs font-mono mt-1">{(obj.confidence * 100).toFixed(0)}%</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="font-semibold text-sm mb-4">Object Details</h3>
            {selectedObject ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Name</p>
                  <p className="text-sm font-medium">{selectedObject.name}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Confidence</p>
                  <p className="text-sm font-medium">{(selectedObject.confidence * 100).toFixed(1)}%</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">Position X</p>
                    <p className="text-sm font-medium">{selectedObject.x.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">Position Y</p>
                    <p className="text-sm font-medium">{selectedObject.y.toFixed(2)}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">Width</p>
                    <p className="text-sm font-medium">{selectedObject.w.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">Height</p>
                    <p className="text-sm font-medium">{selectedObject.h.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">Click an object to view details</p>
            )}
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="font-semibold text-sm mb-4">Camera Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Resolution</span>
                <span className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded">1920x1080</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Frame Rate</span>
                <span className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded">30 FPS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Exposure</span>
                <span className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded">Auto</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Model</span>
                <span className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded">YOLOv8n</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
