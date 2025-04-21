import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarRange,
  FileText,
  Star,
  Users,
  Brain,
  Settings,
  User,
  Book,
  LineChart,
  Flame,
  LogOut,
} from 'lucide-react';

interface SideNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<LucideProps>;
  badge?: string;
}

const sidebarNavItems: SideNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: CalendarRange,
  },
  {
    title: "Schedule",
    href: "/dashboard/schedule",
    icon: CalendarRange,
    badge: "New",
  },
  {
    title: "Notes",
    href: "/dashboard/notes",
    icon: FileText,
  },
  {
    title: "Skills & Goals",
    href: "/dashboard/skills",
    icon: Star,
  },
  {
    title: "Progress",
    href: "/dashboard/progress",
    icon: LineChart,
  },
  {
    title: "Study Groups",
    href: "/dashboard/study-groups",
    icon: Users,
  },
  {
    title: "AI Insights",
    href: "/dashboard/ai-insights",
    icon: Brain,
  },
  {
    title: "Study Buddy",
    href: "/dashboard/study-buddy",
    icon: Book,
  },
];

const settingsNavItems: SideNavItem[] = [
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActiveRoute = (href: string) => {
    return window.location.pathname === href;
  };

  const NavItem = ({ item }: { item: SideNavItem }) => (
    <Button
      key={item.href}
      variant="ghost"
      className={`w-full justify-start rounded-lg px-3 py-2 text-sm font-medium transition-colors h-10 ${
        isActiveRoute(item.href)
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
      onClick={() => {
        navigate(item.href);
        setIsMenuOpen(false);
      }}
    >
      <item.icon className="w-4 h-4 mr-3 shrink-0" />
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-2 py-0">
          {item.badge}
        </Badge>
      )}
    </Button>
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        {sidebarNavItems.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </div>
      <Separator className="my-2 bg-sidebar-border/50" />
      <div className="flex flex-col gap-1">
        {settingsNavItems.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </div>
      <div className="mt-auto">
        <Separator className="my-2 bg-sidebar-border/50" />
        <div className="px-3 py-2">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9 border border-sidebar-border/50">
              <AvatarImage src={currentUser?.photoURL || ""} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                {currentUser?.displayName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {currentUser?.displayName || "User"}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden fixed left-4 top-4 z-50"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar border-r">
          <SheetHeader className="p-4 text-left border-b border-sidebar-border">
            <SheetTitle className="text-sidebar-foreground font-semibold">StudySync</SheetTitle>
            <SheetDescription className="text-sidebar-foreground/70">
              Your study assistant
            </SheetDescription>
          </SheetHeader>
          <div className="px-2 py-4">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex">
        <aside className="hidden md:flex w-72 shrink-0 h-screen sticky top-0 border-r border-sidebar-border bg-sidebar overflow-y-auto">
          <div className="flex flex-col w-full">
            <div className="p-6 border-b border-sidebar-border">
              <h1 className="text-xl font-semibold text-sidebar-foreground">StudySync</h1>
              <p className="text-sm text-sidebar-foreground/70">Your study assistant</p>
            </div>
            <div className="flex-1 p-4">
              <SidebarContent />
            </div>
          </div>
        </aside>

        <main className="flex-1 min-h-screen">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
