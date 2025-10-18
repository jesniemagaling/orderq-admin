import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ScreenSize from '../components/ScreenSize';

export default function MainLayout() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'admin' | 'cashier' | 'kitchen' | null>(
    null
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role') as
      | 'admin'
      | 'cashier'
      | 'kitchen'
      | null;

    // Redirect to login if no token or role
    if (!token || !storedRole) {
      navigate('/');
      return;
    }

    setRole(storedRole);
  }, [navigate]);

  // Prevent rendering layout until role is verified
  if (!role) return null;

  return (
    <div className="relative flex min-h-screen bg-gray-100">
      <ScreenSize />
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
