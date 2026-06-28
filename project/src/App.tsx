import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import CameraFeed from "./pages/CameraFeed";
import ObjectDetection from "./pages/ObjectDetection";
import TaskManagement from "./pages/TaskManagement";
import ActivityLogs from "./pages/ActivityLogs";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/camera" element={<CameraFeed />} />
          <Route path="/detections" element={<ObjectDetection />} />
          <Route path="/tasks" element={<TaskManagement />} />
          <Route path="/logs" element={<ActivityLogs />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
