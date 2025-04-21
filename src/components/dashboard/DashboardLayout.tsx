
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
  type LucideProps
} from 'lucide-react';

// Define the LucideIcon type as a React component that takes LucideProps
type LucideIcon = React.ComponentType<LucideProps>;

interface SideNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
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
    icon: LucideIcon,
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden absolute left-4 top-4 text-gray-700 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-64">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Navigate your study dashboard.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {sidebarNavItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate(item.href);
                  setIsMenuOpen(false);
                }}
              >
                <item.icon className="w-4 h-4 mr-2" />
                <span>{item.title}</span>
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </SheetContent>
      </Sheet>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3 mb-6">
              <Avatar>
                <AvatarImage src={currentUser?.photoURL || ""} />
                <AvatarFallback>
                  {currentUser?.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">
                  {currentUser?.displayName || "User"}
                </div>
                <div className="text-sm text-gray-500">{currentUser?.email}</div>
              </div>
            </div>
            <nav>
              {sidebarNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  <span>{item.title}</span>
                </Button>
              ))}
            </nav>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="col-span-1 md:col-span-4 bg-white rounded-lg shadow-md p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
