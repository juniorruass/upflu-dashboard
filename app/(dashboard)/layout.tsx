import Sidebar from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        .dashboard-main { margin-left: 240px; }
        @media (max-width: 768px) { .dashboard-main { margin-left: 64px; } }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "#111111" }}>
        <Sidebar />
        <main
          className="dashboard-main"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            overflow: "hidden",
            transition: "margin-left 0.2s ease",
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}
