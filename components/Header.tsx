"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock, Calendar, History, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/semana", label: "Configurar Semana", icon: Calendar },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/usuario", label: "Mi Cuenta", icon: User },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    api.logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-orange-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link 
          href="/semana" 
          className="flex items-center gap-2 text-xl font-bold"
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500">
            <Clock className="size-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text font-display text-transparent">
            Intratime Killer
          </span>
        </Link>

        {/* Navegación desktop */}
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    isActive && "pointer-events-none"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          <div className="ml-2 h-6 w-px bg-gray-200" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-gray-600 hover:text-red-600"
          >
            <LogOut className="size-4" />
            Salir
          </Button>
        </nav>

        {/* Navegación mobile */}
        <nav className="flex items-center gap-1 md:hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "size-9",
                    isActive && "pointer-events-none"
                  )}
                >
                  <Icon className="size-4" />
                </Button>
              </Link>
            );
          })}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="size-9 text-gray-600 hover:text-red-600"
          >
            <LogOut className="size-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
