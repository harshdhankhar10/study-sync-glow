
import React, { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset
} from '@/components/ui/sidebar';
import { 
  LucideIcon, 
  User, 
  Calendar, 
  Home, 
  LogOut, 
  Settings,
  Target,
  Clock,
  Book,
  BarChart3,
  BookOpen,
  Users,
  Lightbulb
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';

interface SidebarLink {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const mainLinks: SidebarLink[] = [
    { title: 'Dashboard', href: '/dashboard', icon: Home },
    { title: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
    { title: 'Availability', href: '/dashboard/availability', icon: Clock },
    { title: 'Goals', href: '/dashboard/goals', icon: Target },
    { title: 'Skills', href: '/dashboard/skills', icon: BookOpen },
    { title: 'Notes', href: '/dashboard/notes', icon: Book },
    { title: 'Progress', href: '/dashboard/progress', icon: BarChart3 },
    { title: 'Study Groups', href: '/dashboard/study-groups', icon: Users },
    { title: 'AI Insights', href: '/dashboard/ai-insights', icon: Lightbulb },
  ];

  const accountLinks: SidebarLink[] = [
    { title: 'Profile', href: '/dashboard/profile', icon: User },
    { title: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader className="p-3">
            <div className="flex gap-2 items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="font-semibold text-lg">StudySync</div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainLinks.map((link) => (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        tooltip={link.title}
                        isActive={location.pathname === link.href || (link.href !== '/dashboard' && location.pathname.startsWith(link.href))}
                      >
                        <NavLink to={link.href}>
                          <link.icon />
                          <span>{link.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {accountLinks.map((link) => (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        tooltip={link.title}
                        isActive={location.pathname === link.href}
                      >
                        <NavLink to={link.href}>
                          <link.icon />
                          <span>{link.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleLogout}
                      tooltip="Logout"
                    >
                      <LogOut />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.photoURL || undefined} />
                <AvatarFallback>
                  {currentUser?.displayName
                    ? currentUser.displayName.substring(0, 2).toUpperCase()
                    : currentUser?.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {currentUser?.displayName || currentUser?.email || 'User'}
                </p>
                {currentUser?.displayName && (
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser.email}
                  </p>
                )}
              </div>
            </div>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        {/* Main Content */}
        <SidebarInset>
          <Navbar />
          <div className="flex-1 container py-6">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
