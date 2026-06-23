"use client";

import { useSidebar } from "./sidebar-context";
import GlobalAlerts from "./global-alerts";

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const sidebarW = collapsed ? "64px" : "240px";

  return (
    <>
      <style>{`
        .dashboard-main { margin-left: ${sidebarW}; transition: margin-left 0.2s ease; }
        @media (max-width: 768px) { .dashboard-main { margin-left: 0 !important; } }
      `}</style>
      <main
        className="dashboard-main"
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden", position: "relative", zIndex: 1 }}
      >
        <GlobalAlerts />
        {children}
      </main>
    </>
  );
}
