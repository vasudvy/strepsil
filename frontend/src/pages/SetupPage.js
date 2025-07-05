import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';
import { Key, CheckCircle, AlertCircle, ArrowRight, Bot, Settings } from 'lucide-react';

const SetupPage = () => {
  const navigate = useNavigate();
  const { providers, updateProvider, testProvider, completeSetup, setupStatus } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [providerConfigs, setProviderConfigs] = useState({});
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    // If already setup, redirect to dashboard
    if (setupStatus?.setupCompleted) {
      navigate('/dashboard');
    }
  }, [setupStatus, navigate]);

  useEffect(() => {
    // Initialize provider configs
    const configs = {};
    providers.forEach(provider => {
      configs[provider.name] = {
        api_key: '',
        active: false
      };
    });
    setProviderConfigs(configs);
  }, [providers]);

  const handleApiKeyChange = (providerName, apiKey) => {
    setProviderConfigs(prev => ({
      ...prev,
      [providerName]: {
        ...prev[providerName],
        api_key: apiKey
      }
    }));
  };

  const handleToggleProvider = (providerName) => {
    setProviderConfigs(prev => ({
      ...prev,
      [providerName]: {
        ...prev[providerName],
        active: !prev[providerName].active
      }
    }));
  };

  const handleTestProvider = async (providerName) => {
    const apiKey = providerConfigs[providerName]?.api_key;
    
    if (!apiKey) {
      toast.error('Please enter an API key first');
      return;
    }

    setTesting(prev => ({ ...prev, [providerName]: true }));
    
    const result = await testProvider(providerName, apiKey);
    setTestResults(prev => ({ ...prev, [providerName]: result }));
    
    if (result.success) {
      toast.success(`${providerName} API key is valid!`);
    } else {
      toast.error(`${providerName} test failed: ${result.error}`);
    }
    
    setTesting(prev => ({ ...prev, [providerName]: false }));
  };

  const handleSaveProvider = async (providerName) => {
    const config = providerConfigs[providerName];
    
    if (!config.api_key) {
      toast.error('Please enter an API key');
      return;
    }

    const result = await updateProvider(providerName, config);
    
    if (result.success) {
      toast.success(`${providerName} configuration saved!`);
    } else {
      toast.error(`Failed to save ${providerName}: ${result.error}`);
    }
  };

  const handleCompleteSetup = async () => {
    const activeProviders = Object.entries(providerConfigs)
      .filter(([_, config]) => config.active && config.api_key)
      .map(([name, _]) => name);

    if (activeProviders.length === 0) {
      toast.error('Please configure at least one AI provider');
      return;
    }

    // Save all active providers
    for (const [providerName, config] of Object.entries(providerConfigs)) {
      if (config.active && config.api_key) {
        await updateProvider(providerName, config);
      }
    }

    // Complete setup
    const result = await completeSetup();
    
    if (result.success) {
      toast.success('Setup completed successfully!');
      navigate('/dashboard');
    } else {
      toast.error(`Setup failed: ${result.error}`);
    }
  };

  const steps = [
    {
      title: 'Welcome to Strepsil',
      description: 'Configure your AI providers to start tracking usage and costs',
      icon: <Bot className="w-8 h-8" />
    },
    {
      title: 'API Configuration',
      description: 'Add your AI provider API keys',
      icon: <Key className="w-8 h-8" />
    },
    {
      title: 'Ready to Go',
      description: 'Your dashboard is ready for AI usage tracking',
      icon: <CheckCircle className="w-8 h-8" />
    }
  ];

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <Bot className="w-8 h-8 text-blue-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Strepsil</h2>
        <p className="text-gray-600">
          The open-source AI usage tracking and receipt dashboard. Let's get you set up to start
          monitoring your AI costs and usage patterns.
        </p>
      </div>
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">What you'll be able to do:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Track AI API calls and costs in real-time</li>
          <li>• Generate detailed usage reports</li>
          <li>• Chat with AI models directly in the dashboard</li>
          <li>• Export billing data as CSV, JSON, or PDF</li>
        </ul>
      </div>
      <button
        onClick={() => setCurrentStep(1)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
      >
        <span>Get Started</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderConfigurationStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure AI Providers</h2>
        <p className="text-gray-600">
          Add your API keys for the AI providers you want to track. You can add more later.
        </p>
      </div>

      <div className="space-y-6">
        {providers.map(provider => (
          <div key={provider.name} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium">{provider.name[0]}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                  <p className="text-sm text-gray-500">{provider.base_url}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={providerConfigs[provider.name]?.active || false}
                  onChange={() => handleToggleProvider(provider.name)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {providerConfigs[provider.name]?.active && (
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <input
                    type="password"
                    placeholder={`Enter your ${provider.name} API key`}
                    value={providerConfigs[provider.name]?.api_key || ''}
                    onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleTestProvider(provider.name)}
                    disabled={testing[provider.name] || !providerConfigs[provider.name]?.api_key}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testing[provider.name] ? 'Testing...' : 'Test'}
                  </button>
                </div>

                {testResults[provider.name] && (
                  <div className={`flex items-center space-x-2 text-sm ${
                    testResults[provider.name].success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResults[provider.name].success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>{testResults[provider.name].message}</span>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <p>Available models: {provider.models?.map(m => m.name).join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(0)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(2)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderCompletionStep = () => {
    const activeProviders = Object.entries(providerConfigs)
      .filter(([_, config]) => config.active && config.api_key)
      .map(([name, _]) => name);

    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
          <p className="text-gray-600">
            Your Strepsil dashboard is ready to start tracking AI usage.
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Configured Providers:</h3>
          <div className="space-y-1">
            {activeProviders.length > 0 ? (
              activeProviders.map(name => (
                <div key={name} className="flex items-center justify-center space-x-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span>{name}</span>
                </div>
              ))
            ) : (
              <p className="text-red-600">No providers configured</p>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(1)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
          <button
            onClick={handleCompleteSetup}
            disabled={activeProviders.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Complete Setup</span>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === currentStep 
                      ? 'bg-blue-600 text-white' 
                      : index < currentStep 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-20 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <h1 className="text-sm font-medium text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </h1>
              <p className="text-lg font-semibold text-gray-900">
                {steps[currentStep].title}
              </p>
            </div>
          </div>

          {/* Step content */}
          <div className="min-h-[400px]">
            {currentStep === 0 && renderWelcomeStep()}
            {currentStep === 1 && renderConfigurationStep()}
            {currentStep === 2 && renderCompletionStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;