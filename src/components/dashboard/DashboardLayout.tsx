
import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
  Book,
  CalendarRange,
  Clock,
  FileText,
  Flame,
  Settings,
  User,
  Users,
  Star,
  Brain,
  type LucideProps,
  LineChart,
} from 'lucide-react';

// Define the LucideIcon type as a React component that takes LucideProps
type LucideIcon = React.ComponentType<LucideProps>;

interface SideNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
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
    title: "Motivation",
    href: "/dashboard/motivation",
    icon: Flame,
  },
  {
    title: "Study Buddy",
    href: "/dashboard/study-buddy",
    icon: Book,
  },
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden absolute left-4 top-4 text-gray-700 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-72 p-0 bg-sidebar border-r border-sidebar-border">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-4 text-left border-b border-sidebar-border">
              <SheetTitle className="text-sidebar-foreground font-bold text-xl">StudySync</SheetTitle>
              <SheetDescription className="text-sidebar-foreground/70">
                Your personal study assistant
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 py-2 overflow-y-auto">
              <div className="space-y-1 px-3">
                {sidebarNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={`w-full justify-start rounded-lg text-sm font-medium transition-colors h-11 px-3 ${
                      isActiveRoute(item.href)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                    onClick={() => {
                      navigate(item.href);
                      setIsMenuOpen(false);
                    }}
                  >
                    <item.icon className="w-4 h-4 mr-3 shrink-0" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge className="ml-auto" variant="secondary">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 border border-sidebar-border/50">
                  <AvatarImage src={currentUser?.photoURL || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary-foreground">
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
                className="w-full"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Sidebar for desktop */}
        <aside className="hidden md:block w-72 h-screen sticky top-0 border-r border-sidebar-border bg-sidebar">
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-sidebar-border">
              <h1 className="text-xl font-bold text-sidebar-foreground">StudySync</h1>
              <p className="text-sm text-sidebar-foreground/70">Your personal study assistant</p>
            </div>
            
            <div className="flex-1 py-6 overflow-y-auto">
              <div className="px-3 space-y-6">
                <div className="space-y-1">
                  {sidebarNavItems.slice(0, 9).map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className={`w-full justify-start rounded-lg text-sm font-medium transition-colors h-11 px-3 ${
                        isActiveRoute(item.href)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`}
                      onClick={() => navigate(item.href)}
                    >
                      <item.icon className="w-4 h-4 mr-3 shrink-0" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge className="ml-auto text-xs py-0 h-5" variant="secondary">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
                
                <Separator className="my-1 bg-sidebar-border/50" />
                
                <div className="space-y-1">
                  {sidebarNavItems.slice(9).map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className={`w-full justify-start rounded-lg text-sm font-medium transition-colors h-11 px-3 ${
                        isActiveRoute(item.href)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`}
                      onClick={() => navigate(item.href)}
                    >
                      <item.icon className="w-4 h-4 mr-3 shrink-0" />
                      <span>{item.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 border border-sidebar-border/50">
                  <AvatarImage src={currentUser?.photoURL || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary-foreground">
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
                className="w-full"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
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
