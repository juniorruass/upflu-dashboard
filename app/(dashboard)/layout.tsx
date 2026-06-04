import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/components/sidebar-context";
import ConstellationCanvas from "@/components/constellation-canvas";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <style>{`
        .dashboard-main { margin-left: 240px; }
        @media (max-width: 768px) { .dashboard-main { margin-left: 0; } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>

        {/* Space background */}
        <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden", background: "#05060a" }}>
          <ConstellationCanvas />
        </div>

        <Sidebar />
        <main className="dashboard-main" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden", position: "relative", zIndex: 1 }}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
