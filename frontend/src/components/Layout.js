import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Activity, 
  PieChart, 
  FileText, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Bell,
  User
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'AI Calls', href: '/ai-calls', icon: Activity },
    { name: 'Cost Explorer', href: '/cost-explorer', icon: PieChart },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white shadow-lg">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">
                Strepsil
              </span>
            </div>
          </div>
          
          <div className="mt-8 flex-1 flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            <div className="flex-shrink-0 px-2 pb-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span className="ml-3 text-xl font-semibold text-gray-900">
                    Strepsil
                  </span>
                </div>
              </div>
              
              <nav className="mt-5 flex-1 px-2 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex-shrink-0 p-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="flex-1 relative overflow-y-auto focus:outline-none">
          {/* Top header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <button
                    className="md:hidden -ml-2 mr-2 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                  
                  <div className="flex items-center">
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                    </h1>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                    <Bell className="h-5 w-5" />
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.organization}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 relative pb-8 bg-gray-50">
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;