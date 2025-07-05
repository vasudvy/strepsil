const express = require('express');
const { supabase } = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { data: aiCalls, error } = await supabase
      .from('ai_calls')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch user stats' });
    }

    const totalCalls = aiCalls.length;
    const totalCost = aiCalls.reduce((sum, call) => sum + (call.total_cost || 0), 0);
    const totalTokens = aiCalls.reduce((sum, call) => sum + (call.tokens_in || 0) + (call.tokens_out || 0), 0);

    res.json({
      stats: {
        totalCalls,
        totalCost,
        totalTokens,
        averageCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0
      }
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Get user's API keys (for integration)
router.get('/api-keys', authenticateToken, async (req, res) => {
  try {
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch API keys' });
    }

    res.json({ apiKeys });
  } catch (error) {
    console.error('API keys fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Create new API key
router.post('/api-keys', authenticateToken, async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    const apiKey = `sk-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const { data: newApiKey, error } = await supabase
      .from('api_keys')
      .insert([
        {
          user_id: req.user.id,
          name,
          key: apiKey,
          permissions: permissions || ['read', 'write'],
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create API key' });
    }

    res.status(201).json({
      message: 'API key created successfully',
      apiKey: newApiKey
    });
  } catch (error) {
    console.error('API key creation error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Delete API key
router.delete('/api-keys/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete API key' });
    }

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('API key deletion error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

module.exports = router;