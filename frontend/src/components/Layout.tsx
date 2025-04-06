import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/' || location.pathname === '/register';

  const handleLogout = () => {
    // Here you can add any additional logout logic (clearing tokens, etc.)
    navigate('/'); // Navigate to login page
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden -ml-2 px-2 flex items-center"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link to="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">CampusFix</span>
              </Link>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Mobile Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        className="fixed inset-0 z-40 md:hidden"
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          {/* Sidebar content */}
        </div>
      </motion.div>
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};