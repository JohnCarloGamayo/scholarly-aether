
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, Bot, Plus, Settings, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};
export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <aside className={`${collapsed ? "w-20" : "w-64"} bg-white min-h-screen p-4 border-r border-slate-200 fixed left-0 top-0 transition-all duration-200 z-40 flex flex-col`}>
      <div className="flex items-center justify-between mb-8 px-2 py-2">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center w-full" : ""}`}>
          {!collapsed ? (
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Digital Atelier</h1>
              <p className="text-xs text-slate-500 font-medium">Scholarly Workspace</p>
            </div>
          ) : (
             <div className="h-8 w-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold">DA</div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {[
          { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
          { icon: FileText, label: "Documents", href: "/documents" },
          { icon: Users, label: "Groups", href: "/groups" },
          { icon: Bot, label: "Workspace", href: "/workspace" },
        ].map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-4"} py-3 rounded-lg font-medium transition-colors ${
              isActive(item.href) 
                ? "text-emerald-700 bg-white shadow-sm border border-emerald-100" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <item.icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-2">
        {onToggle && (
           <button 
           onClick={onToggle}
           className={`w-full flex items-center gap-3 ${collapsed ? "justify-center" : "px-4"} py-3 rounded-lg text-slate-500 hover:bg-slate-50 transition`}
         >
           {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
           {!collapsed && <span>Collapse</span>}
         </button>
        )}
        <button className={`w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white py-3 rounded-full font-medium transition ${collapsed ? "px-0" : "px-4"}`}>
          <Plus className="w-5 h-5" />
          {!collapsed && <span>New Research</span>}
        </button>
        
        <Link 
          href="/settings" 
          className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-4"} py-3 mt-4 rounded-lg text-slate-600 hover:bg-slate-50 transition`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        
        <Link 
          href="/help" 
          className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-4"} py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition`}
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Help</span>}
        </Link>
      </div>
    </aside>
  );
}

