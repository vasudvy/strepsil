import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Download, Edit } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const ReceiptDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aiCall, setAiCall] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAiCall();
  }, [id]);

  const fetchAiCall = async () => {
    try {
      const response = await api.get(`/ai-calls/${id}`);
      setAiCall(response.data.aiCall);
    } catch (error) {
      toast.error('Failed to fetch AI call details');
      console.error('AI call fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!aiCall) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">AI call not found</p>
        <button
          onClick={() => navigate('/ai-calls')}
          className="btn-primary btn-md mt-4"
        >
          Back to AI Calls
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/ai-calls')}
            className="btn-ghost btn-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Receipt Details
            </h1>
            <p className="text-gray-600">
              {aiCall.model_type} • {new Date(aiCall.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-outline btn-md">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Receipt Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Call Summary</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Model:</span>
                  <span className="text-sm font-medium">{aiCall.model_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Endpoint:</span>
                  <span className="text-sm font-medium">{aiCall.endpoint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`status-badge ${aiCall.status === 'success' ? 'success' : 'error'}`}>
                    {aiCall.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">
                    {new Date(aiCall.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Usage & Cost</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tokens In:</span>
                  <span className="text-sm font-medium">{aiCall.tokens_in}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tokens Out:</span>
                  <span className="text-sm font-medium">{aiCall.tokens_out}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Cost:</span>
                  <span className="text-sm font-medium">${aiCall.total_cost?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Latency:</span>
                  <span className="text-sm font-medium">{aiCall.latency_ms}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title">Input</h3>
              <button
                onClick={() => copyToClipboard(aiCall.prompt)}
                className="btn-ghost btn-sm"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                {aiCall.prompt}
              </pre>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title">Output</h3>
              <button
                onClick={() => copyToClipboard(aiCall.response)}
                className="btn-ghost btn-sm"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                {aiCall.response || 'No response available'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      {aiCall.metadata && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Metadata</h3>
          </div>
          <div className="card-content">
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-900">
                {JSON.stringify(aiCall.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {aiCall.error_message && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title text-error-600">Error Details</h3>
          </div>
          <div className="card-content">
            <div className="bg-error-50 p-4 rounded-lg">
              <p className="text-sm text-error-700">{aiCall.error_message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptDetailPage;