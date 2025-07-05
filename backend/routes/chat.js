const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const router = express.Router();

// Send chat message to AI provider
router.post('/', async (req, res) => {
  try {
    const { provider, model, messages, temperature = 1, max_tokens } = req.body;
    
    if (!provider || !model || !messages) {
      return res.status(400).json({ error: 'Provider, model, and messages are required' });
    }
    
    const db = req.app.locals.db;
    
    // Get provider configuration
    const providerConfig = await db.getProvider(provider);
    if (!providerConfig || !providerConfig.api_key) {
      return res.status(400).json({ error: `${provider} API key not configured` });
    }
    
    const startTime = Date.now();
    const callId = uuidv4();
    let response = null;
    let error = null;
    let tokens_in = 0;
    let tokens_out = 0;
    let total_cost = 0;
    
    try {
      if (provider === 'OpenAI') {
        response = await callOpenAI(providerConfig.api_key, model, messages, temperature, max_tokens);
        tokens_in = response.usage?.prompt_tokens || 0;
        tokens_out = response.usage?.completion_tokens || 0;
      } else if (provider === 'Anthropic') {
        response = await callAnthropic(providerConfig.api_key, model, messages, temperature, max_tokens);
        tokens_in = response.usage?.input_tokens || 0;
        tokens_out = response.usage?.output_tokens || 0;
      } else {
        throw new Error(`Provider ${provider} not supported yet`);
      }
      
      // Calculate cost
      const pricing = providerConfig.pricing[model];
      if (pricing) {
        total_cost = (tokens_in * pricing.input) + (tokens_out * pricing.output);
      }
      
    } catch (apiError) {
      error = apiError.message;
    }
    
    const endTime = Date.now();
    const latency_ms = endTime - startTime;
    
    // Extract prompt and response text
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const responseText = response?.choices?.[0]?.message?.content || 
                        response?.content?.[0]?.text || 
                        null;
    
    // Save to database
    await db.insertAiCall({
      id: callId,
      provider,
      model_type: model,
      endpoint: getEndpointForProvider(provider),
      prompt,
      response: responseText,
      tokens_in,
      tokens_out,
      cost_per_token_in: providerConfig.pricing[model]?.input || 0,
      cost_per_token_out: providerConfig.pricing[model]?.output || 0,
      total_cost,
      latency_ms,
      status: error ? 'failure' : 'success',
      error_message: error,
      metadata: {
        temperature,
        max_tokens,
        raw_response: response
      }
    });
    
    if (error) {
      return res.status(500).json({ 
        error: 'AI API call failed', 
        message: error,
        callId 
      });
    }
    
    res.json({
      id: callId,
      response: responseText,
      usage: {
        prompt_tokens: tokens_in,
        completion_tokens: tokens_out,
        total_tokens: tokens_in + tokens_out
      },
      cost: total_cost,
      latency_ms,
      provider,
      model
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Get available models for a provider
router.get('/models/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const db = req.app.locals.db;
    
    const providerConfig = await db.getProvider(provider);
    if (!providerConfig) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json({
      models: providerConfig.models || [],
      pricing: providerConfig.pricing || {}
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// OpenAI API call
async function callOpenAI(apiKey, model, messages, temperature, max_tokens) {
  const { OpenAI } = require('openai');
  const openai = new OpenAI({ apiKey });
  
  const params = {
    model,
    messages,
    temperature
  };
  
  if (max_tokens) {
    params.max_tokens = max_tokens;
  }
  
  const completion = await openai.chat.completions.create(params);
  return completion;
}

// Anthropic API call
async function callAnthropic(apiKey, model, messages, temperature, max_tokens) {
  // Convert OpenAI format messages to Anthropic format
  const system = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages.filter(m => m.role !== 'system');
  
  const params = {
    model,
    max_tokens: max_tokens || 1024,
    temperature,
    messages: userMessages
  };
  
  if (system) {
    params.system = system;
  }
  
  const response = await axios.post('https://api.anthropic.com/v1/messages', params, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }
  });
  
  return response.data;
}

// Get endpoint for provider
function getEndpointForProvider(provider) {
  switch (provider) {
    case 'OpenAI':
      return '/v1/chat/completions';
    case 'Anthropic':
      return '/v1/messages';
    default:
      return '/chat';
  }
}

module.exports = router;