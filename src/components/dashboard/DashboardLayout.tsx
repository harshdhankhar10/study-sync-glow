import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Menu, Brain, Calendar, FileText, Star, Users, Settings, 
  User, Book, BarChart2, LogOut, Target, Globe, Home, Award,
  Clock, MessageSquare, HelpCircle, ChevronDown, Plus, Search,
  Bell, ChevronRight, PieChart, BookOpen, Clipboard, CheckCircle, Layout, LineChart, 
  LightbulbIcon, CheckSquare
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarSection } from "./sidebar/SidebarSection";
import { SidebarItem, SidebarSection as SidebarSectionType } from "@/types/sidebar";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const navigationItems: SidebarSectionType[] = [
  {
    title: "Main Navigation",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: Layout,
        isFeatured: true,
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
        title: "Tasks",
        href: "/dashboard/tasks",
        icon: CheckSquare,
        badge: "New",
      },
    ],
  },
  {
    title: "Goals & Progress",
    items: [
      {
        title: "Goals",
        href: "/dashboard/goals",
        icon: Target,
        isFeatured: true,
      },
      {
        title: "Skills",
        href: "/dashboard/skills",
        icon: Star,
      },
      {
        title: "Progress",
        href: "/dashboard/progress",
        icon: LineChart,
      },
    ],
  },
  {
    title: "Learning Tools",
    items: [
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
        title: "Study Prompt Generator",
        href: "/dashboard/study-prompt-generator",
        icon: BookOpen,
        badge: "New",
        isFeatured: true,
      },
      {
        title: "SkillMatch Grid",
        href: "/dashboard/skillmatch-grid",
        icon: Globe,
        isGlobal: true,
      },
      {
        title: "Flashcards & Quizzes",
        href: "/dashboard/flashcards-quizzes",
        icon: Book,
        badge: "New",
      },
      {
        title: "Study Statistics",
        href: "/dashboard/study-statistics",
        icon: BarChart2,
        badge: "New",
      },
    ],
  },
  {
    title: "Community",
    items: [
      {
        title: "Study Groups",
        href: "/dashboard/study-groups",
        icon: Users,
        isGlobal: true,
      },
    ],
  },
  {
    title: "Account",
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
  },
];

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    navigationItems.reduce((acc, item) => ({ ...acc, [item.title]: true }), {})
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    if (!path) return "Dashboard";
    return path.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 px-3 py-4">
          {navigationItems.map((section) => (
            <div key={section.title} className="mb-2">
              <button 
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
              >
                <span className="font-semibold text-gray-500 uppercase tracking-wider text-xs">
                  {section.title}
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform text-gray-400",
                  expandedSections[section.title] ? "rotate-0" : "-rotate-90"
                )} />
              </button>
              
              {expandedSections[section.title] && (
                <div className="mt-1 space-y-1">
                  {section.items.map((item) => (
                    <Link
                      to={item.href}
                      key={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                        location.pathname === item.href
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-gray-200">
            <AvatarImage src={currentUser?.photoURL || ""} />
            <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
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
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed left-4 top-4 z-50 bg-white shadow-sm rounded-lg w-10 h-10"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-white border-r border-gray-200">
          <SheetHeader className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
                <Book className="w-4 h-4 text-white" />
              </div>
              <SheetTitle className="text-lg font-bold text-gray-900">
                StudySync Pro
              </SheetTitle>
            </div>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
                  <Book className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-900">
                  StudySync Pro
                </h1>
              </div>
            </div>
            <SidebarContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="md:pl-64 flex flex-col flex-1">
          {/* Top Navigation */}
          <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {getPageTitle()}
                  </h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                  </Button>
                  
                  <Button className="hidden sm:flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    <span>New Task</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1">
            <div className="px-6 py-6">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
