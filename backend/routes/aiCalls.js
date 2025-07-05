const express = require('express');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { supabase } = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create new AI call record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      model_type,
      endpoint,
      prompt,
      response,
      tokens_in,
      tokens_out,
      cost_per_token_in,
      cost_per_token_out,
      latency_ms,
      status, // 'success', 'failure', 'retry', 'hallucination'
      error_message,
      metadata
    } = req.body;

    if (!model_type || !endpoint || !prompt) {
      return res.status(400).json({ error: 'model_type, endpoint, and prompt are required' });
    }

    const total_cost = (tokens_in * cost_per_token_in) + (tokens_out * cost_per_token_out);
    const callId = uuidv4();

    const { data: aiCall, error } = await supabase
      .from('ai_calls')
      .insert([
        {
          id: callId,
          user_id: req.user.id,
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
          status: status || 'success',
          error_message,
          metadata,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('AI call creation error:', error);
      return res.status(500).json({ error: 'Failed to create AI call record' });
    }

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
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      model_type,
      endpoint,
      status,
      start_date,
      end_date,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('ai_calls')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id);

    // Apply filters
    if (model_type) query = query.eq('model_type', model_type);
    if (endpoint) query = query.eq('endpoint', endpoint);
    if (status) query = query.eq('status', status);
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);

    // Apply sorting and pagination
    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: aiCalls, error, count } = await query;

    if (error) {
      console.error('AI calls fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch AI calls' });
    }

    res.json({
      aiCalls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('AI calls fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch AI calls' });
  }
});

// Get specific AI call by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: aiCall, error } = await supabase
      .from('ai_calls')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'AI call not found' });
      }
      return res.status(500).json({ error: 'Failed to fetch AI call' });
    }

    res.json({ aiCall });
  } catch (error) {
    console.error('AI call fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch AI call' });
  }
});

// Get AI call analytics
router.get('/analytics/summary', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('ai_calls')
      .select('*')
      .eq('user_id', req.user.id);

    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);

    const { data: aiCalls, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    // Calculate analytics
    const totalCalls = aiCalls.length;
    const totalCost = aiCalls.reduce((sum, call) => sum + (call.total_cost || 0), 0);
    const totalTokensIn = aiCalls.reduce((sum, call) => sum + (call.tokens_in || 0), 0);
    const totalTokensOut = aiCalls.reduce((sum, call) => sum + (call.tokens_out || 0), 0);
    const averageLatency = aiCalls.length > 0 
      ? aiCalls.reduce((sum, call) => sum + (call.latency_ms || 0), 0) / aiCalls.length 
      : 0;

    // Status breakdown
    const statusBreakdown = aiCalls.reduce((acc, call) => {
      acc[call.status] = (acc[call.status] || 0) + 1;
      return acc;
    }, {});

    // Model breakdown
    const modelBreakdown = aiCalls.reduce((acc, call) => {
      acc[call.model_type] = (acc[call.model_type] || 0) + 1;
      return acc;
    }, {});

    // Daily usage (last 30 days)
    const dailyUsage = {};
    aiCalls.forEach(call => {
      const date = moment(call.created_at).format('YYYY-MM-DD');
      if (!dailyUsage[date]) {
        dailyUsage[date] = { calls: 0, cost: 0 };
      }
      dailyUsage[date].calls += 1;
      dailyUsage[date].cost += call.total_cost || 0;
    });

    res.json({
      summary: {
        totalCalls,
        totalCost,
        totalTokensIn,
        totalTokensOut,
        averageLatency: Math.round(averageLatency)
      },
      breakdowns: {
        status: statusBreakdown,
        models: modelBreakdown
      },
      dailyUsage
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Update AI call status (for retry/failure tracking)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, error_message } = req.body;

    if (!['success', 'failure', 'retry', 'hallucination'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: aiCall, error } = await supabase
      .from('ai_calls')
      .update({
        status,
        error_message,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'AI call not found' });
      }
      return res.status(500).json({ error: 'Failed to update AI call' });
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
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('ai_calls')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete AI call' });
    }

    res.json({ message: 'AI call deleted successfully' });
  } catch (error) {
    console.error('AI call deletion error:', error);
    res.status(500).json({ error: 'Failed to delete AI call' });
  }
});

module.exports = router;