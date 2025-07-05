const express = require('express');
const router = express.Router();

// Get all providers
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const providers = await db.getProviders();
    
    // Don't send API keys in the response for security
    const sanitizedProviders = providers.map(provider => ({
      ...provider,
      api_key: undefined,
      configured: !!provider.api_key
    }));
    
    res.json({ providers: sanitizedProviders });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Get specific provider
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const db = req.app.locals.db;
    const provider = await db.getProvider(name);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Don't send API key
    res.json({
      provider: {
        ...provider,
        api_key: undefined,
        configured: !!provider.api_key
      }
    });
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// Update provider configuration
router.put('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { api_key, active, models, pricing } = req.body;
    
    const db = req.app.locals.db;
    
    // Check if provider exists
    const existingProvider = await db.getProvider(name);
    if (!existingProvider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Update provider
    await db.updateProvider(name, {
      api_key,
      active,
      models,
      pricing
    });
    
    res.json({ message: 'Provider updated successfully' });
  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({ error: 'Failed to update provider' });
  }
});

// Test provider API key
router.post('/:name/test', async (req, res) => {
  try {
    const { name } = req.params;
    const { api_key } = req.body;
    
    const db = req.app.locals.db;
    const provider = await db.getProvider(name);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const testKey = api_key || provider.api_key;
    if (!testKey) {
      return res.status(400).json({ error: 'No API key provided' });
    }
    
    let testResult = false;
    let errorMessage = null;
    
    try {
      if (name === 'OpenAI') {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: testKey });
        await openai.models.list();
        testResult = true;
      } else if (name === 'Anthropic') {
        const axios = require('axios');
        await axios.get('https://api.anthropic.com/v1/messages', {
          headers: {
            'Authorization': `Bearer ${testKey}`,
            'anthropic-version': '2023-06-01'
          }
        });
        testResult = true;
      } else {
        // Generic test - just check if key is not empty
        testResult = !!testKey;
      }
    } catch (error) {
      errorMessage = error.response?.data?.error?.message || error.message;
    }
    
    res.json({
      success: testResult,
      message: testResult ? 'API key is valid' : 'API key test failed',
      error: errorMessage
    });
  } catch (error) {
    console.error('Test provider error:', error);
    res.status(500).json({ error: 'Failed to test provider' });
  }
});

// Get provider models and pricing
router.get('/:name/models', async (req, res) => {
  try {
    const { name } = req.params;
    const db = req.app.locals.db;
    const provider = await db.getProvider(name);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json({
      models: provider.models || [],
      pricing: provider.pricing || {}
    });
  } catch (error) {
    console.error('Get provider models error:', error);
    res.status(500).json({ error: 'Failed to fetch provider models' });
  }
});

module.exports = router;