import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/components/sidebar-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <style>{`
        .dashboard-main { margin-left: 240px; }
        @media (max-width: 768px) { .dashboard-main { margin-left: 0; } }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "#080808" }}>
        <Sidebar />
        <main className="dashboard-main" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden" }}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
