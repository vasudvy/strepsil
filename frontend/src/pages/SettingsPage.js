import React, { useState, useEffect } from 'react';
import { Save, Key, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const SettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    organization: user?.organization || '',
  });

  const [newApiKey, setNewApiKey] = useState({
    name: '',
    permissions: ['read', 'write'],
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await api.get('/users/api-keys');
      setApiKeys(response.data.apiKeys);
    } catch (error) {
      toast.error('Failed to fetch API keys');
      console.error('API keys fetch error:', error);
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/users/api-keys', newApiKey);
      setApiKeys(prev => [...prev, response.data.apiKey]);
      setNewApiKey({ name: '', permissions: ['read', 'write'] });
      setShowCreateApiKey(false);
      toast.success('API key created successfully');
    } catch (error) {
      toast.error('Failed to create API key');
      console.error('API key creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      await api.delete(`/users/api-keys/${keyId}`);
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      toast.success('API key deleted successfully');
    } catch (error) {
      toast.error('Failed to delete API key');
      console.error('API key deletion error:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your account settings and API keys
        </p>
      </div>

      {/* Profile Settings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Profile Information</h3>
          <p className="card-description">
            Update your personal information and organization details
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input mt-1"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input mt-1"
                  value={user?.email || ''}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="label">Organization</label>
                <input
                  type="text"
                  className="input mt-1"
                  value={profileData.organization}
                  onChange={(e) => setProfileData(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder="Enter your organization name"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-md"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* API Keys */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">API Keys</h3>
              <p className="card-description">
                Manage API keys for integrating with external services
              </p>
            </div>
            <button
              onClick={() => setShowCreateApiKey(true)}
              className="btn-primary btn-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </button>
          </div>
        </div>
        <div className="card-content">
          {apiKeysLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No API keys yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Create your first API key to start integrating
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">
                        Created: {new Date(apiKey.created_at).toLocaleDateString()}
                      </span>
                      {apiKey.last_used_at && (
                        <span className="text-sm text-gray-600">
                          Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      {apiKey.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="status-badge info"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(apiKey.key)}
                      className="btn-ghost btn-sm"
                      title="Copy API key"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="btn-ghost btn-sm text-red-600 hover:text-red-700"
                      title="Delete API key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateApiKey && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New API Key
            </h3>
            
            <form onSubmit={createApiKey} className="space-y-4">
              <div>
                <label className="label">Key Name</label>
                <input
                  type="text"
                  className="input mt-1"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter a descriptive name"
                  required
                />
              </div>

              <div>
                <label className="label">Permissions</label>
                <div className="mt-2 space-y-2">
                  {['read', 'write'].map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={newApiKey.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewApiKey(prev => ({
                              ...prev,
                              permissions: [...prev.permissions, permission]
                            }));
                          } else {
                            setNewApiKey(prev => ({
                              ...prev,
                              permissions: prev.permissions.filter(p => p !== permission)
                            }));
                          }
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {permission}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateApiKey(false)}
                  className="btn-secondary btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary btn-md"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Key'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Account Information</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Account ID</p>
              <p className="text-sm text-gray-900 mt-1">{user?.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Member Since</p>
              <p className="text-sm text-gray-900 mt-1">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;