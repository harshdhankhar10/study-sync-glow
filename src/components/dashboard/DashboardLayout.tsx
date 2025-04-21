
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Globe, Brain, Calendar, FileText, Star, Users, Settings, User, Book, LineChart, LogOut, Sparkles, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarSection } from "./sidebar/SidebarSection";
import { SidebarItem, SidebarSection as SidebarSectionType } from "@/types/sidebar";

const mainNavItems: SidebarSectionType = {
  title: "Navigation",
  items: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Calendar,
    },
    {
      title: "Schedule",
      href: "/dashboard/schedule",
      icon: Calendar,
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
  ],
};

const toolsNavItems: SidebarSectionType = {
  title: "Tools",
  items: [
    {
      title: "AI Insights",
      href: "/dashboard/ai-insights",
      icon: Brain,
    },
    {
      title: "AI Learning Hub",
      href: "/dashboard/ai-learning-hub",
      icon: Brain,
      badge: "New",
      isFeatured: true,
    },
    {
      title: "Study Buddy",
      href: "/dashboard/study-buddy",
      icon: Book,
    },
    {
      title: "SkillMatch Grid",
      href: "/dashboard/skillmatch-grid",
      icon: Globe,
      isGlobal: true,
    },
  ],
};

const settingsNavItems: SidebarSectionType = {
  title: "Settings",
  items: [
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
  ],
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1 px-2">
        <SidebarSection
          section={mainNavItems}
          currentPath={location.pathname}
          onItemClick={() => setIsMenuOpen(false)}
        />
      </div>

      <div className="flex flex-col gap-1 px-2">
        <SidebarSection
          section={toolsNavItems}
          currentPath={location.pathname}
          onItemClick={() => setIsMenuOpen(false)}
        />
      </div>

      <Separator className="opacity-50" />

      <div className="flex flex-col gap-1 px-2">
        <SidebarSection
          section={settingsNavItems}
          currentPath={location.pathname}
          onItemClick={() => setIsMenuOpen(false)}
        />
      </div>

      <div className="mt-auto">
        <Separator className="opacity-50 my-2" />
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9 border-2 border-indigo-100">
              <AvatarImage src={currentUser?.photoURL || ""} />
              <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm">
                {currentUser?.displayName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser?.displayName || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 border-gray-200"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
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
        <SheetContent side="left" className="w-72 p-6 bg-white/95 backdrop-blur-sm">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              StudySync
            </SheetTitle>
            <SheetDescription>
              Your personal study assistant
            </SheetDescription>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex">
        <aside className="hidden md:flex flex-col w-72 shrink-0 h-screen sticky top-0 border-r border-gray-100 bg-white/95 backdrop-blur-sm overflow-y-auto py-6">
          <div className="mb-6 px-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              StudySync
            </h1>
            <p className="text-sm text-gray-500">Your personal study assistant</p>
          </div>
          <SidebarContent />
        </aside>

        <main className="flex-1 min-h-screen p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
