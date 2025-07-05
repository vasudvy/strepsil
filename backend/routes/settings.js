const express = require('express');
const router = express.Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const settings = await db.getSettings();
    
    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get specific setting
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const db = req.app.locals.db;
    const value = await db.getSetting(key);
    
    if (value === null) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ key, value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Update setting
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, encrypted = false } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    const db = req.app.locals.db;
    await db.setSetting(key, value.toString(), encrypted);
    
    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Complete setup
router.post('/complete-setup', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.setSetting('setup_completed', 'true');
    
    res.json({ message: 'Setup completed successfully' });
  } catch (error) {
    console.error('Complete setup error:', error);
    res.status(500).json({ error: 'Failed to complete setup' });
  }
});

// Reset settings
router.post('/reset', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Reset key settings
    await db.setSetting('setup_completed', 'false');
    
    // Clear all provider API keys
    const providers = await db.getProviders();
    for (const provider of providers) {
      await db.updateProvider(provider.name, { 
        api_key: null, 
        active: false 
      });
    }
    
    res.json({ message: 'Settings reset successfully' });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

// Get application info
router.get('/app/info', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const appName = await db.getSetting('app_name') || 'Strepsil';
    const appVersion = await db.getSetting('app_version') || '1.0.0';
    const setupCompleted = await db.getSetting('setup_completed') === 'true';
    
    // Get total usage stats
    const analytics = await db.getAnalytics();
    
    res.json({
      app: {
        name: appName,
        version: appVersion,
        setupCompleted
      },
      stats: analytics.summary
    });
  } catch (error) {
    console.error('Get app info error:', error);
    res.status(500).json({ error: 'Failed to fetch app info' });
  }
});

module.exports = router;