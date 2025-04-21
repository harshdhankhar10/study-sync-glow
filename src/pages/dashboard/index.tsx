
import { Outlet } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function DashboardRoot() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
