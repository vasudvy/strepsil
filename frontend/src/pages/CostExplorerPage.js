import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Users } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const CostExplorerPage = () => {
  const [costData, setCostData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [groupBy, setGroupBy] = useState('model');

  useEffect(() => {
    fetchCostData();
    fetchTrends();
  }, [dateRange, groupBy]);

  const fetchCostData = async () => {
    try {
      const response = await api.get('/reports/cost-breakdown', {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
          group_by: groupBy,
        },
      });
      setCostData(response.data);
    } catch (error) {
      toast.error('Failed to fetch cost data');
      console.error('Cost data fetch error:', error);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await api.get('/reports/trends', {
        params: {
          period: 'daily',
          days: 30,
        },
      });
      setTrends(response.data);
    } catch (error) {
      toast.error('Failed to fetch trends');
      console.error('Trends fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cost Explorer</h1>
          <p className="text-gray-600">
            Analyze your AI usage costs and trends
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input mt-1"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              className="input mt-1"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Group By</label>
            <select
              className="input mt-1"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="model">Model</option>
              <option value="endpoint">Endpoint</option>
              <option value="date">Date</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${costData?.total_cost?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-success-50 text-success-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-semibold text-gray-900">
                {costData?.total_calls?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-warning-50 text-warning-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg per Day</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${((costData?.total_cost || 0) / 30).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-error-50 text-error-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg per Call</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${costData?.total_calls ? (costData.total_cost / costData.total_calls).toFixed(4) : '0.0000'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Cost Breakdown</h3>
            <p className="card-description">
              Costs grouped by {groupBy}
            </p>
          </div>
          <div className="card-content">
            {!costData?.breakdown || Object.keys(costData.breakdown).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(costData.breakdown)
                  .sort((a, b) => b[1].cost - a[1].cost)
                  .map(([key, data]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{key}</p>
                        <p className="text-sm text-gray-600">{data.calls} calls</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${data.cost.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{data.tokens} tokens</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Daily Trends</h3>
            <p className="card-description">
              Cost and usage over time
            </p>
          </div>
          <div className="card-content">
            {!trends?.trends || Object.keys(trends.trends).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No trend data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(trends.trends)
                  .slice(-7) // Show last 7 days
                  .map(([date, data]) => (
                    <div key={date} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{date}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          ${data.cost.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {data.calls} calls
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Detailed Breakdown</h3>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {groupBy}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg per Call
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {costData?.breakdown && Object.entries(costData.breakdown).map(([key, data]) => (
                  <tr key={key}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.calls}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${data.cost.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${(data.cost / data.calls).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostExplorerPage;