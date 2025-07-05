import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Send, 
  Bot, 
  User, 
  Settings, 
  Loader2,
  DollarSign,
  Clock,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';

const ChatPage = () => {
  const { configuredProviders } = useApp();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [showSettings, setShowSettings] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (configuredProviders.length > 0) {
      setSelectedProvider(configuredProviders[0].name);
    }
  }, [configuredProviders]);

  useEffect(() => {
    if (selectedProvider) {
      fetchModels();
    }
  }, [selectedProvider]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchModels = async () => {
    try {
      const response = await api.get(`/chat/models/${selectedProvider}`);
      setAvailableModels(response.data.models || []);
      if (response.data.models?.length > 0) {
        setSelectedModel(response.data.models[0].name);
      }
    } catch (error) {
      toast.error('Failed to fetch models');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedProvider || !selectedModel) {
      toast.error('Please enter a message and select a provider/model');
      return;
    }

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const requestMessages = [
        ...messages.filter(m => m.role === 'user' || m.role === 'assistant'),
        { role: 'user', content: inputMessage }
      ];

      const response = await api.post('/chat', {
        provider: selectedProvider,
        model: selectedModel,
        messages: requestMessages,
        temperature,
        max_tokens: maxTokens
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        metadata: {
          provider: response.data.provider,
          model: response.data.model,
          cost: response.data.cost,
          latency_ms: response.data.latency_ms,
          usage: response.data.usage,
          callId: response.data.id
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      setTotalCost(prev => prev + response.data.cost);
      setTotalMessages(prev => prev + 1);

      toast.success(`Message sent • $${response.data.cost.toFixed(4)} • ${response.data.latency_ms}ms`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send message');
      
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.response?.data?.message || 'Failed to get response'}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setTotalCost(0);
    setTotalMessages(0);
  };

  const copyMessage = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Message copied to clipboard');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isError = message.isError;

    return (
      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-500 text-white ml-3' 
              : isError 
              ? 'bg-red-500 text-white mr-3'
              : 'bg-gray-200 text-gray-600 mr-3'
          }`}>
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
          
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`px-4 py-2 rounded-lg ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : isError 
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.metadata && (
                <div className="mt-2 text-xs opacity-75 border-t border-gray-300 pt-2">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3" />
                      <span>${message.metadata.cost.toFixed(4)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{message.metadata.latency_ms}ms</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{message.metadata.usage.total_tokens} tokens</span>
                    </span>
                  </div>
                  <div className="mt-1">
                    {message.metadata.provider}/{message.metadata.model}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">
                {formatTimestamp(message.timestamp)}
              </span>
              <button
                onClick={() => copyMessage(message.content, index)}
                className="text-xs text-gray-400 hover:text-gray-600 p-1"
              >
                {copiedIndex === index ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (configuredProviders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No AI Providers Configured</h2>
          <p className="text-gray-600 mb-4">Configure your AI providers in settings to start chatting.</p>
          <button
            onClick={() => window.location.href = '/settings'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">AI Chat</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>${totalCost.toFixed(4)} spent</span>
              <span>•</span>
              <span>{totalMessages} messages</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={clearMessages}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {configuredProviders.map(provider => (
                    <option key={provider.name} value={provider.name}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableModels.map(model => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature ({temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="4000"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Start a conversation with AI</p>
            <p className="text-sm">Your messages will be automatically tracked for billing</p>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        
        {isLoading && (
          <div className="flex justify-start mb-6">
            <div className="flex max-w-[80%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 mr-3">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="px-4 py-2 bg-gray-100 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="1"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;