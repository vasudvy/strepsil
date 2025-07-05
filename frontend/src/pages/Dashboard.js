import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, change, changeType, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
  };

  return (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${
              changeType === 'increase' ? 'text-success-600' : 'text-error-600'
            }`}>
              {changeType === 'increase' ? '+' : '-'}{change}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const RecentActivity = ({ aiCalls, loading }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'failure':
        return <XCircle className="h-5 w-5 text-error-600" />;
      case 'retry':
        return <RefreshCw className="h-5 w-5 text-warning-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const badgeClasses = {
      success: 'status-badge success',
      failure: 'status-badge error',
      retry: 'status-badge warning',
      hallucination: 'status-badge warning',
    };
    return badgeClasses[status] || 'status-badge info';
  };

  return (
    <div className="telegram-ui">
      <div className="telegram-ui-header">
        <h3 className="text-lg font-semibold text-gray-900">Recent AI Calls</h3>
        <Link
          to="/ai-calls"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all
        </Link>
      </div>
      
      <div className="telegram-ui-content">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : aiCalls.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No AI calls yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start making API calls to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {aiCalls.map((call, index) => (
              <div key={call.id} className="timeline-item">
                <div className={`timeline-dot ${call.status}`}>
                  {getStatusIcon(call.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {call.model_type}
                      </p>
                      <span className={getStatusBadge(call.status)}>
                        {call.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        ${call.total_cost?.toFixed(4)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {call.latency_ms}ms
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {call.endpoint}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(call.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callsLoading, setCallsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentCalls();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/ai-calls/analytics/summary');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentCalls = async () => {
    try {
      const response = await api.get('/ai-calls?limit=10&sort_by=created_at&sort_order=desc');
      setRecentCalls(response.data.aiCalls);
    } catch (error) {
      toast.error('Failed to fetch recent calls');
      console.error('Recent calls fetch error:', error);
    } finally {
      setCallsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const summary = stats?.summary || {};
  const breakdowns = stats?.breakdowns || {};

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Calls"
          value={summary.totalCalls?.toLocaleString() || '0'}
          icon={Activity}
          color="primary"
        />
        <StatCard
          title="Total Cost"
          value={`$${summary.totalCost?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Avg Latency"
          value={`${summary.averageLatency || 0}ms`}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Success Rate"
          value={`${breakdowns.status?.success 
            ? Math.round((breakdowns.status.success / summary.totalCalls) * 100)
            : 0}%`}
          icon={TrendingUp}
          color="success"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Model Usage</h3>
            <p className="card-description">
              Breakdown by AI model types
            </p>
          </div>
          <div className="card-content">
            {Object.keys(breakdowns.models || {}).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(breakdowns.models).map(([model, count]) => (
                  <div key={model} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{model}</span>
                    <span className="text-sm text-gray-600">{count} calls</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Call Status</h3>
            <p className="card-description">
              Success and failure rates
            </p>
          </div>
          <div className="card-content">
            {Object.keys(breakdowns.status || {}).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(breakdowns.status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`status-badge ${status === 'success' ? 'success' : 'error'}`}>
                        {status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">{count} calls</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity aiCalls={recentCalls} loading={callsLoading} />
    </div>
  );
};

export default Dashboard;