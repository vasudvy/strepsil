const express = require('express');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const router = express.Router();

// Create new AI call record (for external logging)
router.post('/', async (req, res) => {
  try {
    const {
      provider,
      model_type,
      endpoint,
      prompt,
      response,
      tokens_in,
      tokens_out,
      cost_per_token_in,
      cost_per_token_out,
      latency_ms,
      status = 'success',
      error_message,
      metadata
    } = req.body;

    if (!provider || !model_type || !endpoint || !prompt) {
      return res.status(400).json({ error: 'provider, model_type, endpoint, and prompt are required' });
    }

    const total_cost = (tokens_in * cost_per_token_in) + (tokens_out * cost_per_token_out);
    const callId = uuidv4();

    const db = req.app.locals.db;
    const aiCall = await db.insertAiCall({
      id: callId,
      provider,
      model_type,
      endpoint,
      prompt,
      response,
      tokens_in: tokens_in || 0,
      tokens_out: tokens_out || 0,
      cost_per_token_in: cost_per_token_in || 0,
      cost_per_token_out: cost_per_token_out || 0,
      total_cost,
      latency_ms: latency_ms || 0,
      status,
      error_message,
      metadata
    });

    res.status(201).json({
      message: 'AI call recorded successfully',
      aiCall
    });
  } catch (error) {
    console.error('AI call recording error:', error);
    res.status(500).json({ error: 'Failed to record AI call' });
  }
});

// Get AI calls with filters and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      provider,
      model_type,
      status,
      start_date,
      end_date,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const db = req.app.locals.db;

    const filters = {};
    if (provider) filters.provider = provider;
    if (model_type) filters.model_type = model_type;
    if (status) filters.status = status;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const aiCalls = await db.getAiCalls(filters, parseInt(limit), offset);
    const total = await db.getAiCallsCount(filters);

    res.json({
      aiCalls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('AI calls fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch AI calls' });
  }
});

// Get specific AI call by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    const aiCall = await db.getAiCall(id);

    if (!aiCall) {
      return res.status(404).json({ error: 'AI call not found' });
    }

    res.json({ aiCall });
  } catch (error) {
    console.error('AI call fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch AI call' });
  }
});

// Get AI call analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { start_date, end_date, provider, model_type } = req.query;
    const db = req.app.locals.db;

    const filters = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (provider) filters.provider = provider;
    if (model_type) filters.model_type = model_type;

    const analytics = await db.getAnalytics(filters);

    // Add daily usage for the last 30 days
    const calls = await db.getAiCalls(filters, 10000);
    const dailyUsage = {};
    
    calls.forEach(call => {
      const date = moment(call.created_at).format('YYYY-MM-DD');
      if (!dailyUsage[date]) {
        dailyUsage[date] = { calls: 0, cost: 0 };
      }
      dailyUsage[date].calls += 1;
      dailyUsage[date].cost += call.total_cost || 0;
    });

    res.json({
      ...analytics,
      dailyUsage
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Update AI call status (for retry/failure tracking)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, error_message } = req.body;

    if (!['success', 'failure', 'retry', 'hallucination'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = req.app.locals.db;
    const aiCall = await db.updateAiCall(id, { status, error_message });

    if (!aiCall) {
      return res.status(404).json({ error: 'AI call not found' });
    }

    res.json({
      message: 'AI call status updated successfully',
      aiCall
    });
  } catch (error) {
    console.error('AI call update error:', error);
    res.status(500).json({ error: 'Failed to update AI call status' });
  }
});

// Delete AI call
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    await db.deleteAiCall(id);

    res.json({ message: 'AI call deleted successfully' });
  } catch (error) {
    console.error('AI call deletion error:', error);
    res.status(500).json({ error: 'Failed to delete AI call' });
  }
});

// Bulk operations
router.post('/bulk/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Valid array of IDs is required' });
    }

    const db = req.app.locals.db;
    
    for (const id of ids) {
      await db.deleteAiCall(id);
    }

    res.json({ 
      message: `${ids.length} AI calls deleted successfully`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete AI calls' });
  }
});

module.exports = router;