
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function DashboardRoot() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect to the dashboard index if the path is exactly /dashboard
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      // User is at the root dashboard path, no need to redirect
    }
  }, [location.pathname, navigate]);

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
