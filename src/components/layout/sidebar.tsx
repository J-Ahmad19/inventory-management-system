"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  LayoutDashboard,
  MapPin,
  Package,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/locations/management", label: "Manage Locations", icon: MapPin },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
];

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { metrics, alerts } = useRealtime();

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl",
        isMobile ? "fixed left-0 top-0 z-40" : "fixed left-0 top-0 z-40"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-lg shadow-emerald-600/30">
          <Boxes className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white">StockFlow</h1>
          <p className="text-[10px] text-slate-500">Inventory Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
              const alertCount =
            item.href === "/alerts" ? alerts?.filter((a) => !a.acknowledged).length || 0 : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && onClose?.()}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-emerald-600/10 text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {alertCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/20 px-1.5 text-[10px] font-bold text-red-400">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-2 rounded-lg bg-slate-900/50 px-3 py-2">
          <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
          <span className="text-xs text-slate-400">Data sync active</span>
        </div>
      </div>
    </aside>
  );
}
