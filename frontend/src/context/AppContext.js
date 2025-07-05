import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [appInfo, setAppInfo] = useState(null);
  const [setupStatus, setSetupStatus] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check setup status
      const setupResponse = await api.get('/setup/status');
      setSetupStatus(setupResponse.data);

      // Get app info
      const infoResponse = await api.get('/settings/app/info');
      setAppInfo(infoResponse.data);

      // Get providers
      const providersResponse = await api.get('/providers');
      setProviders(providersResponse.data.providers);

    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProvider = async (name, data) => {
    try {
      await api.put(`/providers/${name}`, data);
      
      // Refresh providers
      const response = await api.get('/providers');
      setProviders(response.data.providers);
      
      // Refresh setup status
      const setupResponse = await api.get('/setup/status');
      setSetupStatus(setupResponse.data);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to update provider' 
      };
    }
  };

  const testProvider = async (name, apiKey) => {
    try {
      const response = await api.post(`/providers/${name}/test`, { api_key: apiKey });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to test provider'
      };
    }
  };

  const completeSetup = async () => {
    try {
      await api.post('/settings/complete-setup');
      
      // Refresh setup status
      const setupResponse = await api.get('/setup/status');
      setSetupStatus(setupResponse.data);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to complete setup' 
      };
    }
  };

  const resetSettings = async () => {
    try {
      await api.post('/settings/reset');
      
      // Refresh all data
      await initializeApp();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to reset settings' 
      };
    }
  };

  const refreshApp = async () => {
    await initializeApp();
  };

  const value = {
    appInfo,
    setupStatus,
    providers,
    loading,
    isSetupRequired: !setupStatus?.setupCompleted,
    configuredProviders: providers.filter(p => p.configured),
    updateProvider,
    testProvider,
    completeSetup,
    resetSettings,
    refreshApp,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};