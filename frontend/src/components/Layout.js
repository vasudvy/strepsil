import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import LoadingSpinner from './LoadingSpinner';

const Layout = () => {
  const { loading, isSetupRequired } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isSetupRequired) {
      navigate('/setup');
    }
  }, [loading, isSetupRequired, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isSetupRequired) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;