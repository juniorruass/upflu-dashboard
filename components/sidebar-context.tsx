"use client";
import { createContext, useContext, useState, ReactNode } from "react";

const Ctx = createContext({ open: false, toggle: () => {}, close: () => {} });

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSidebar = () => useContext(Ctx);
