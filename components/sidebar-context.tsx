"use client";
import { createContext, useContext, useState, ReactNode } from "react";

const Ctx = createContext({
  open: false,
  toggle: () => {},
  close: () => {},
  collapsed: false,
  toggleCollapse: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Ctx.Provider value={{
      open,
      toggle: () => setOpen((v) => !v),
      close: () => setOpen(false),
      collapsed,
      toggleCollapse: () => setCollapsed((v) => !v),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSidebar = () => useContext(Ctx);
