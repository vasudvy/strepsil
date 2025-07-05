const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '..', 'data', 'strepsil.db');
    this.schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  }

  async initialize() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Initialize database
      this.db = new sqlite3.Database(this.dbPath);

      // Run schema if database is new
      await this.runSchema();

      console.log('✅ Database initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async runSchema() {
    return new Promise((resolve, reject) => {
      const schema = fs.readFileSync(this.schemaPath, 'utf8');
      this.db.exec(schema, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (error, rows) => {
        if (error) {
          reject(error);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(error) {
        if (error) {
          reject(error);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (error, row) => {
        if (error) {
          reject(error);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Settings management
  async getSetting(key) {
    const result = await this.get('SELECT value FROM settings WHERE key = ?', [key]);
    return result ? result.value : null;
  }

  async setSetting(key, value, encrypted = false) {
    const processedValue = encrypted ? this.encrypt(value) : value;
    await this.run(
      'INSERT OR REPLACE INTO settings (key, value, encrypted) VALUES (?, ?, ?)',
      [key, processedValue, encrypted]
    );
  }

  async getSettings() {
    const rows = await this.query('SELECT * FROM settings ORDER BY key');
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.encrypted ? this.decrypt(row.value) : row.value;
    }
    return settings;
  }

  // AI Provider management
  async getProviders() {
    const rows = await this.query('SELECT * FROM ai_providers ORDER BY name');
    return rows.map(row => ({
      ...row,
      models: row.models ? JSON.parse(row.models) : [],
      pricing: row.pricing ? JSON.parse(row.pricing) : {},
      api_key: row.api_key_encrypted ? this.decrypt(row.api_key_encrypted) : null
    }));
  }

  async getProvider(name) {
    const row = await this.get('SELECT * FROM ai_providers WHERE name = ?', [name]);
    if (!row) return null;
    
    return {
      ...row,
      models: row.models ? JSON.parse(row.models) : [],
      pricing: row.pricing ? JSON.parse(row.pricing) : {},
      api_key: row.api_key_encrypted ? this.decrypt(row.api_key_encrypted) : null
    };
  }

  async updateProvider(name, data) {
    const { api_key, models, pricing, active } = data;
    
    const updates = [];
    const params = [];
    
    if (api_key !== undefined) {
      updates.push('api_key_encrypted = ?');
      params.push(api_key ? this.encrypt(api_key) : null);
    }
    
    if (models !== undefined) {
      updates.push('models = ?');
      params.push(JSON.stringify(models));
    }
    
    if (pricing !== undefined) {
      updates.push('pricing = ?');
      params.push(JSON.stringify(pricing));
    }
    
    if (active !== undefined) {
      updates.push('active = ?');
      params.push(active);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(name);
      
      await this.run(
        `UPDATE ai_providers SET ${updates.join(', ')} WHERE name = ?`,
        params
      );
    }
  }

  // AI Calls management
  async insertAiCall(data) {
    const {
      id, provider, model_type, endpoint, prompt, response,
      tokens_in, tokens_out, cost_per_token_in, cost_per_token_out,
      total_cost, latency_ms, status, error_message, metadata
    } = data;

    await this.run(
      `INSERT INTO ai_calls (
        id, provider, model_type, endpoint, prompt, response,
        tokens_in, tokens_out, cost_per_token_in, cost_per_token_out,
        total_cost, latency_ms, status, error_message, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, provider, model_type, endpoint, prompt, response,
        tokens_in || 0, tokens_out || 0, cost_per_token_in || 0, cost_per_token_out || 0,
        total_cost || 0, latency_ms || 0, status || 'success', error_message,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    return this.getAiCall(id);
  }

  async getAiCall(id) {
    const row = await this.get('SELECT * FROM ai_calls WHERE id = ?', [id]);
    if (!row) return null;
    
    return {
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    };
  }

  async getAiCalls(filters = {}, limit = 50, offset = 0) {
    let sql = 'SELECT * FROM ai_calls WHERE 1=1';
    const params = [];

    if (filters.provider) {
      sql += ' AND provider = ?';
      params.push(filters.provider);
    }

    if (filters.model_type) {
      sql += ' AND model_type = ?';
      params.push(filters.model_type);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.start_date) {
      sql += ' AND created_at >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ' AND created_at <= ?';
      params.push(filters.end_date);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await this.query(sql, params);
    
    return rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  async getAiCallsCount(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM ai_calls WHERE 1=1';
    const params = [];

    if (filters.provider) {
      sql += ' AND provider = ?';
      params.push(filters.provider);
    }

    if (filters.model_type) {
      sql += ' AND model_type = ?';
      params.push(filters.model_type);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.start_date) {
      sql += ' AND created_at >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      sql += ' AND created_at <= ?';
      params.push(filters.end_date);
    }

    const result = await this.get(sql, params);
    return result.count;
  }

  async updateAiCall(id, data) {
    const { status, error_message } = data;
    
    await this.run(
      'UPDATE ai_calls SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, error_message, id]
    );

    return this.getAiCall(id);
  }

  async deleteAiCall(id) {
    await this.run('DELETE FROM ai_calls WHERE id = ?', [id]);
  }

  // Analytics
  async getAnalytics(filters = {}) {
    const aiCalls = await this.getAiCalls(filters, 10000); // Get all for analytics
    
    const totalCalls = aiCalls.length;
    const totalCost = aiCalls.reduce((sum, call) => sum + (call.total_cost || 0), 0);
    const totalTokensIn = aiCalls.reduce((sum, call) => sum + (call.tokens_in || 0), 0);
    const totalTokensOut = aiCalls.reduce((sum, call) => sum + (call.tokens_out || 0), 0);
    const averageLatency = totalCalls > 0 
      ? aiCalls.reduce((sum, call) => sum + (call.latency_ms || 0), 0) / totalCalls 
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

    // Provider breakdown
    const providerBreakdown = aiCalls.reduce((acc, call) => {
      acc[call.provider] = (acc[call.provider] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalCalls,
        totalCost,
        totalTokensIn,
        totalTokensOut,
        averageLatency: Math.round(averageLatency)
      },
      breakdowns: {
        status: statusBreakdown,
        models: modelBreakdown,
        providers: providerBreakdown
      }
    };
  }

  // Encryption utilities for API keys
  getEncryptionKey() {
    const envKey = process.env.ENCRYPTION_KEY;
    if (envKey) return envKey;
    
    // Generate a default key (not secure for production)
    return 'strepsil-default-key-change-in-production';
  }

  encrypt(text) {
    if (!text) return null;
    
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedData) {
    if (!encryptedData) return null;
    
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
      const [ivHex, encrypted] = encryptedData.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  async close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Singleton instance
let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}

module.exports = { Database, getDatabase };