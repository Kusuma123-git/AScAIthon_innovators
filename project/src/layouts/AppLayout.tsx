import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Camera,
  Scan,
  ListChecks,
  FileText,
  BarChart3,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "../utils/cn";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/camera", icon: Camera, label: "Camera Feed" },
  { to: "/detections", icon: Scan, label: "Object Detection" },
  { to: "/tasks", icon: ListChecks, label: "Task Management" },
  { to: "/logs", icon: FileText, label: "Activity Logs" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-neutral-200 flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-neutral-200">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center shrink-0">
              <Scan className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-sm tracking-tight whitespace-nowrap">
                Warehouse Picker
              </span>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden p-1 text-neutral-500 hover:text-neutral-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              {!collapsed && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-neutral-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <Menu className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center px-4 lg:px-6 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 text-neutral-600 hover:text-neutral-900"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center flex-1 max-w-md bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 gap-2">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search objects, tasks, logs..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-neutral-400"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-semibold">
              OP
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
