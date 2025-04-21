
import { ReactNode, useState, useEffect } from 'react';
import Navbar from './Navbar';
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarSeparator, SidebarFooter } from '@/components/ui/sidebar';
import { User, Calendar, BookOpen, Award, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [activePage, setActivePage] = useState('profile');

  // Set the active page based on the current URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard/profile')) {
      setActivePage('profile');
    } else if (path.includes('/dashboard/availability')) {
      setActivePage('availability');
    } else if (path.includes('/dashboard/goals')) {
      setActivePage('goals');
    } else if (path.includes('/dashboard/skills')) {
      setActivePage('skills');
    } else if (path === '/dashboard') {
      setActivePage('dashboard');
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: User, url: '/dashboard' },
    { id: 'profile', title: 'Profile Setup', icon: User, url: '/dashboard/profile' },
    { id: 'availability', title: 'Availability', icon: Calendar, url: '/dashboard/availability' },
    { id: 'goals', title: 'Learning Goals', icon: BookOpen, url: '/dashboard/goals' },
    { id: 'skills', title: 'Skills & Interests', icon: Award, url: '/dashboard/skills' },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <Sidebar>
          <SidebarHeader className="py-4">
            <div className="flex items-center px-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <h1 className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                StudySync
              </h1>
            </div>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activePage === item.id}
                        onClick={() => {
                          setActivePage(item.id);
                          navigate(item.url);
                        }}
                        tooltip={item.title}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
