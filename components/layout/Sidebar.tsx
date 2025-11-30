"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  Building2,
  ShoppingCart,
  ScanLine,
  History,
  Users,
  PackageCheck,
  ChevronRight,
} from "lucide-react"

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Articles",
    href: "/articles",
    icon: Package,
  },
  {
    name: "Fournisseurs",
    href: "/fournisseurs",
    icon: Building2,
  },
  {
    name: "Commandes",
    href: "/commandes",
    icon: ShoppingCart,
  },
  {
    name: "Scanner",
    href: "/scanner",
    icon: ScanLine,
    badge: "Nouveau",
  },
  {
    name: "Mouvements",
    href: "/mouvements",
    icon: History,
  },
  {
    name: "Stock Technicien",
    href: "/stock-technicien",
    icon: Users,
  },
  {
    name: "Réceptions",
    href: "/receptions",
    icon: PackageCheck,
  },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-200 dark:border-gray-800">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">SEMACTIVE</h1>
              <p className="text-xs text-muted-foreground">Gestion inventaire</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "nav-link group",
                    isActive && "nav-link-active"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    isActive && "text-primary"
                  )} />
                  <span className="flex-1">{item.name}</span>
                  
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {item.badge}
                    </span>
                  )}
                  
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-primary" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <ScanLine className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  Raccourci scanner
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Appuyez sur S
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
