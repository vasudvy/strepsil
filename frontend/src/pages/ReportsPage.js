import React, { useState } from 'react';
import { Download, Calendar, Filter, FileText } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    format: 'json',
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const generateReport = async (reportType, format = 'json') => {
    setLoading(true);
    try {
      let url = '';
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        format,
      });

      switch (reportType) {
        case 'billing':
          url = `/reports/billing?${params}`;
          break;
        case 'cost-breakdown':
          url = `/reports/cost-breakdown?${params}`;
          break;
        case 'trends':
          url = `/reports/trends?${params}`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      if (format === 'csv' || format === 'pdf') {
        // Handle file downloads
        const response = await api.get(url, { responseType: 'blob' });
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        toast.success(`${format.toUpperCase()} report downloaded successfully`);
      } else {
        // Handle JSON response
        const response = await api.get(url);
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        toast.success('JSON report downloaded successfully');
      }
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Report generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      id: 'billing',
      title: 'Billing Report',
      description: 'Comprehensive billing report with all AI calls and costs',
      icon: FileText,
    },
    {
      id: 'cost-breakdown',
      title: 'Cost Breakdown',
      description: 'Detailed cost analysis grouped by models, endpoints, or dates',
      icon: FileText,
    },
    {
      id: 'trends',
      title: 'Usage Trends',
      description: 'Historical usage and cost trends over time',
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-gray-600">
            Generate and export detailed reports of your AI usage
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Report Filters</h3>
          <p className="card-description">
            Configure the date range and format for your reports
          </p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input mt-1"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                className="input mt-1"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>

            <div>
              <label className="label">Default Format</label>
              <select
                className="input mt-1"
                value={filters.format}
                onChange={(e) => handleFilterChange('format', e.target.value)}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="card">
              <div className="card-header">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="card-title">{report.title}</h3>
                </div>
                <p className="card-description mt-2">
                  {report.description}
                </p>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  <button
                    onClick={() => generateReport(report.id, 'json')}
                    disabled={loading}
                    className="btn-outline btn-md w-full"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download JSON
                  </button>
                  
                  <button
                    onClick={() => generateReport(report.id, 'csv')}
                    disabled={loading}
                    className="btn-outline btn-md w-full"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download CSV
                  </button>
                  
                  <button
                    onClick={() => generateReport(report.id, 'pdf')}
                    disabled={loading}
                    className="btn-outline btn-md w-full"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
          <p className="card-description">
            Generate commonly requested reports
          </p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => generateReport('billing', filters.format)}
              disabled={loading}
              className="btn-primary btn-md"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Last 30 Days
            </button>
            
            <button
              onClick={() => {
                const startOfWeek = new Date();
                startOfWeek.setDate(startOfWeek.getDate() - 7);
                handleFilterChange('start_date', startOfWeek.toISOString().split('T')[0]);
                generateReport('billing', filters.format);
              }}
              disabled={loading}
              className="btn-secondary btn-md"
            >
              Last 7 Days
            </button>
            
            <button
              onClick={() => {
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                handleFilterChange('start_date', startOfMonth.toISOString().split('T')[0]);
                generateReport('billing', filters.format);
              }}
              disabled={loading}
              className="btn-secondary btn-md"
            >
              This Month
            </button>
            
            <button
              onClick={() => generateReport('cost-breakdown', filters.format)}
              disabled={loading}
              className="btn-secondary btn-md"
            >
              Cost Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Report History */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Report History</h3>
          <p className="card-description">
            Recently generated reports (coming soon)
          </p>
        </div>
        <div className="card-content">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reports generated yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Generate your first report using the options above
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;