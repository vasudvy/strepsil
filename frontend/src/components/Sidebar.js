import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  Activity, 
  PieChart, 
  FileText, 
  Settings, 
  Menu,
  X,
  MessageSquare,
  Bot,
  DollarSign,
  Clock
} from 'lucide-react';

const Sidebar = () => {
  const { appInfo } = useApp();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'AI Calls', href: '/ai-calls', icon: Activity },
    { name: 'Cost Explorer', href: '/cost-explorer', icon: PieChart },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white shadow-lg">
      <div className="flex items-center flex-shrink-0 px-4 py-5">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 text-xl font-semibold text-gray-900">
            {appInfo?.app?.name || 'Strepsil'}
          </span>
        </div>
      </div>
      
      <nav className="flex-1 px-2 pb-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className={`w-5 h-5 mr-3 ${
                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Stats footer */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Total Usage</span>
            <span>Today</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center text-green-600 mb-1">
                <DollarSign className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">
                  ${appInfo?.stats?.totalCost?.toFixed(4) || '0.0000'}
                </span>
              </div>
              <div className="text-xs text-gray-500">Cost</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-blue-600 mb-1">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">
                  {appInfo?.stats?.totalCalls || 0}
                </span>
              </div>
              <div className="text-xs text-gray-500">Calls</div>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          v{appInfo?.app?.version || '1.0.0'}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div className={`md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 flex z-40">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setSidebarOpen(false)} 
          />
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <SidebarContent />
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          className="p-2 bg-white rounded-lg shadow-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </>
  );
};

export default Sidebar;