const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import database
const { getDatabase } = require('./utils/database');

// Import routes
const aiCallRoutes = require('./routes/aiCalls');
const providersRoutes = require('./routes/providers');
const settingsRoutes = require('./routes/settings');
const reportRoutes = require('./routes/reports');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
let database;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'strepsil-api',
    database: database ? 'connected' : 'disconnected'
  });
});

// Setup check endpoint
app.get('/api/setup/status', async (req, res) => {
  try {
    const setupCompleted = await database.getSetting('setup_completed');
    const providers = await database.getProviders();
    const activeProviders = providers.filter(p => p.active && p.api_key);
    
    res.json({
      setupCompleted: setupCompleted === 'true',
      providersConfigured: activeProviders.length,
      providers: providers.map(p => ({
        name: p.name,
        active: p.active,
        configured: !!p.api_key
      }))
    });
  } catch (error) {
    console.error('Setup status error:', error);
    res.status(500).json({ error: 'Failed to check setup status' });
  }
});

// API routes
app.use('/api/ai-calls', aiCallRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Strepsil API server...');
    
    // Initialize database
    database = getDatabase();
    await database.initialize();
    
    // Make database available to routes
    app.locals.db = database;
    
    app.listen(PORT, () => {
      console.log(`✅ Strepsil API server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (database) {
    await database.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (database) {
    await database.close();
  }
  process.exit(0);
});

startServer();