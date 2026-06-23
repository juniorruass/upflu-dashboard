import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/components/sidebar-context";
import ConstellationCanvas from "@/components/constellation-canvas";
import { DashboardMain } from "@/components/dashboard-main";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>

        {/* Space background */}
        <div aria-hidden className="constellation-bg" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden", background: "var(--up-canvas)" }}>
          <ConstellationCanvas />
        </div>

        <Sidebar />
        <DashboardMain>
          {children}
        </DashboardMain>
      </div>
    </SidebarProvider>
  );
}
