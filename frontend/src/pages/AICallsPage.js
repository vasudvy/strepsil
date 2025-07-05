import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  Download,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AICallsPage = () => {
  const [aiCalls, setAiCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    model_type: '',
    status: '',
    start_date: '',
    end_date: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchAiCalls();
  }, [filters, pagination.page]);

  const fetchAiCalls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      const response = await api.get(`/ai-calls?${params}`);
      setAiCalls(response.data.aiCalls);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      toast.error('Failed to fetch AI calls');
      console.error('AI calls fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">AI Calls</h1>
          <p className="text-gray-600">
            {pagination.total > 0 
              ? `${pagination.total} total calls`
              : 'No calls found'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-outline btn-md">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search AI calls..."
                className="input pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="input"
            value={filters.model_type}
            onChange={(e) => handleFilterChange('model_type', e.target.value)}
          >
            <option value="">All Models</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="claude-3">Claude 3</option>
            <option value="gemini-pro">Gemini Pro</option>
          </select>

          <select
            className="input"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="retry">Retry</option>
            <option value="hallucination">Hallucination</option>
          </select>

          <input
            type="date"
            className="input"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
          />
          
          <input
            type="date"
            className="input"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
          />
        </div>
      </div>

      {/* AI Calls Timeline */}
      <div className="telegram-ui">
        <div className="telegram-ui-header">
          <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </span>
          </div>
        </div>
        
        <div className="telegram-ui-content">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : aiCalls.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No AI calls found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your filters or make some API calls
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {aiCalls.map((call) => (
                <div key={call.id} className="timeline-item">
                  <div className={`timeline-dot ${call.status}`}>
                    {getStatusIcon(call.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          {call.model_type}
                        </h4>
                        <span className={getStatusBadge(call.status)}>
                          {call.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ${call.total_cost?.toFixed(4)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {call.latency_ms}ms
                          </p>
                        </div>
                        <Link
                          to={`/ai-calls/${call.id}`}
                          className="btn-ghost btn-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                    
                    <div className="mt-1">
                      <p className="text-sm text-gray-600">{call.endpoint}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {call.tokens_in} tokens in, {call.tokens_out} tokens out
                      </p>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {new Date(call.created_at).toLocaleString()}
                      </p>
                      {call.error_message && (
                        <p className="text-xs text-error-600 max-w-xs truncate">
                          {call.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="btn-outline btn-sm"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.pages}
          </span>
          
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages}
            className="btn-outline btn-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AICallsPage;