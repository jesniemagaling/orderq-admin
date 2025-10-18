import { Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Sidebar from '../components/Sidebar';
import ScreenSize from '../components/ScreenSize';

export default function MainLayout() {
  const { role } = useAuth(); // read from localStorage

  return (
    <div className="relative flex min-h-screen bg-gray-100">
      <ScreenSize />

      <Sidebar role={role as 'admin' | 'cashier' | 'kitchen'} />

      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
