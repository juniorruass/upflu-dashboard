import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/components/sidebar-context";
import ConstellationCanvas from "@/components/constellation-canvas";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <style>{`
        .dashboard-main { margin-left: 240px; }
        @media (max-width: 768px) { .dashboard-main { margin-left: 0; } }

        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.35; }
          33%       { transform: translate(60px, -40px) scale(1.08); opacity: 0.42; }
          66%       { transform: translate(-30px, 30px) scale(0.95); opacity: 0.28; }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }
          40%       { transform: translate(-50px, 60px) scale(1.1); opacity: 0.32; }
          75%       { transform: translate(40px, -20px) scale(0.92); opacity: 0.20; }
        }
        @keyframes orb3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
          50%       { transform: translate(30px, 50px) scale(1.05); opacity: 0.22; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>

        {/* Background animated orbs */}
        <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          {/* Orb 1 — top right */}
          <div style={{
            position: "absolute", top: "-10%", right: "5%",
            width: "500px", height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,207,255,0.18) 0%, transparent 70%)",
            animation: "orb1 18s ease-in-out infinite",
            filter: "blur(40px)",
          }} />
          {/* Orb 2 — bottom left */}
          <div style={{
            position: "absolute", bottom: "5%", left: "15%",
            width: "380px", height: "380px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,207,255,0.12) 0%, transparent 70%)",
            animation: "orb2 24s ease-in-out infinite",
            filter: "blur(50px)",
          }} />
          {/* Orb 3 — center subtle */}
          <div style={{
            position: "absolute", top: "40%", right: "30%",
            width: "260px", height: "260px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,207,255,0.08) 0%, transparent 70%)",
            animation: "orb3 30s ease-in-out infinite",
            filter: "blur(60px)",
          }} />
          {/* Constellation canvas */}
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
