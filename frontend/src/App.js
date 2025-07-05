import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import SetupPage from './pages/SetupPage';
import Dashboard from './pages/Dashboard';
import AICallsPage from './pages/AICallsPage';
import ReceiptDetailPage from './pages/ReceiptDetailPage';
import CostExplorerPage from './pages/CostExplorerPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
            
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="ai-calls" element={<AICallsPage />} />
              <Route path="ai-calls/:id" element={<ReceiptDetailPage />} />
              <Route path="cost-explorer" element={<CostExplorerPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;