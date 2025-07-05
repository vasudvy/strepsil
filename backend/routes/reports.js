const express = require('express');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const router = express.Router();

// Get billing report data
router.get('/billing', async (req, res) => {
  try {
    const { start_date, end_date, format = 'json' } = req.query;
    const db = req.app.locals.db;

    const filters = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const aiCalls = await db.getAiCalls(filters, 10000); // Get all for report

    // Process data for report
    const reportData = aiCalls.map(call => ({
      id: call.id,
      date: moment(call.created_at).format('YYYY-MM-DD HH:mm:ss'),
      provider: call.provider,
      model: call.model_type,
      endpoint: call.endpoint,
      tokens_in: call.tokens_in,
      tokens_out: call.tokens_out,
      total_tokens: call.tokens_in + call.tokens_out,
      cost: call.total_cost,
      latency: call.latency_ms,
      status: call.status
    }));

    const summary = {
      total_calls: aiCalls.length,
      total_cost: aiCalls.reduce((sum, call) => sum + (call.total_cost || 0), 0),
      total_tokens: aiCalls.reduce((sum, call) => sum + (call.tokens_in || 0) + (call.tokens_out || 0), 0),
      average_latency: aiCalls.length > 0 
        ? aiCalls.reduce((sum, call) => sum + (call.latency_ms || 0), 0) / aiCalls.length 
        : 0,
      date_range: {
        start: start_date || 'All time',
        end: end_date || 'All time'
      }
    };

    switch (format) {
      case 'csv':
        const csv = new Parser().parse(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="billing-report-${moment().format('YYYY-MM-DD')}.csv"`);
        return res.send(csv);

      case 'pdf':
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="billing-report-${moment().format('YYYY-MM-DD')}.pdf"`);
        
        doc.pipe(res);
        
        // PDF Header
        doc.fontSize(20).text('Strepsil AI Usage Report', { align: 'center' });
        doc.fontSize(12).text(`Generated on: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, { align: 'center' });
        doc.moveDown();
        
        // Summary
        doc.fontSize(16).text('Summary', { underline: true });
        doc.fontSize(12)
          .text(`Total Calls: ${summary.total_calls}`)
          .text(`Total Cost: $${summary.total_cost.toFixed(4)}`)
          .text(`Total Tokens: ${summary.total_tokens}`)
          .text(`Average Latency: ${Math.round(summary.average_latency)}ms`)
          .text(`Date Range: ${summary.date_range.start} to ${summary.date_range.end}`);
        
        doc.moveDown();
        
        // Detailed calls
        doc.fontSize(16).text('Detailed Calls', { underline: true });
        doc.fontSize(10);
        
        reportData.forEach((call, index) => {
          if (index > 0 && index % 20 === 0) {
            doc.addPage();
          }
          doc.text(`${call.date} | ${call.provider}/${call.model} | ${call.endpoint} | $${call.cost.toFixed(4)} | ${call.status}`);
        });
        
        doc.end();
        break;

      default:
        res.json({
          summary,
          calls: reportData
        });
    }
  } catch (error) {
    console.error('Billing report error:', error);
    res.status(500).json({ error: 'Failed to generate billing report' });
  }
});

// Get cost breakdown report
router.get('/cost-breakdown', async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'model' } = req.query;
    const db = req.app.locals.db;

    const filters = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const aiCalls = await db.getAiCalls(filters, 10000);

    let breakdown = {};

    switch (group_by) {
      case 'model':
        breakdown = aiCalls.reduce((acc, call) => {
          const key = call.model_type;
          if (!acc[key]) acc[key] = { calls: 0, cost: 0, tokens: 0 };
          acc[key].calls += 1;
          acc[key].cost += call.total_cost || 0;
          acc[key].tokens += (call.tokens_in || 0) + (call.tokens_out || 0);
          return acc;
        }, {});
        break;

      case 'provider':
        breakdown = aiCalls.reduce((acc, call) => {
          const key = call.provider;
          if (!acc[key]) acc[key] = { calls: 0, cost: 0, tokens: 0 };
          acc[key].calls += 1;
          acc[key].cost += call.total_cost || 0;
          acc[key].tokens += (call.tokens_in || 0) + (call.tokens_out || 0);
          return acc;
        }, {});
        break;

      case 'endpoint':
        breakdown = aiCalls.reduce((acc, call) => {
          const key = call.endpoint;
          if (!acc[key]) acc[key] = { calls: 0, cost: 0, tokens: 0 };
          acc[key].calls += 1;
          acc[key].cost += call.total_cost || 0;
          acc[key].tokens += (call.tokens_in || 0) + (call.tokens_out || 0);
          return acc;
        }, {});
        break;

      case 'date':
        breakdown = aiCalls.reduce((acc, call) => {
          const key = moment(call.created_at).format('YYYY-MM-DD');
          if (!acc[key]) acc[key] = { calls: 0, cost: 0, tokens: 0 };
          acc[key].calls += 1;
          acc[key].cost += call.total_cost || 0;
          acc[key].tokens += (call.tokens_in || 0) + (call.tokens_out || 0);
          return acc;
        }, {});
        break;

      case 'status':
        breakdown = aiCalls.reduce((acc, call) => {
          const key = call.status;
          if (!acc[key]) acc[key] = { calls: 0, cost: 0, tokens: 0 };
          acc[key].calls += 1;
          acc[key].cost += call.total_cost || 0;
          acc[key].tokens += (call.tokens_in || 0) + (call.tokens_out || 0);
          return acc;
        }, {});
        break;

      default:
        return res.status(400).json({ error: 'Invalid group_by parameter' });
    }

    res.json({
      group_by,
      breakdown,
      total_calls: aiCalls.length,
      total_cost: aiCalls.reduce((sum, call) => sum + (call.total_cost || 0), 0)
    });
  } catch (error) {
    console.error('Cost breakdown error:', error);
    res.status(500).json({ error: 'Failed to generate cost breakdown' });
  }
});

// Get usage trends
router.get('/trends', async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    const db = req.app.locals.db;

    const startDate = moment().subtract(days, 'days').startOf('day');
    
    const filters = {
      start_date: startDate.toISOString()
    };

    const aiCalls = await db.getAiCalls(filters, 10000);

    const trends = {};
    const format = period === 'daily' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:00';

    aiCalls.forEach(call => {
      const key = moment(call.created_at).format(format);
      if (!trends[key]) {
        trends[key] = {
          calls: 0,
          cost: 0,
          tokens: 0,
          latency: 0,
          errors: 0
        };
      }
      trends[key].calls += 1;
      trends[key].cost += call.total_cost || 0;
      trends[key].tokens += (call.tokens_in || 0) + (call.tokens_out || 0);
      trends[key].latency += call.latency_ms || 0;
      if (call.status === 'failure') trends[key].errors += 1;
    });

    // Calculate averages
    Object.keys(trends).forEach(key => {
      if (trends[key].calls > 0) {
        trends[key].averageLatency = trends[key].latency / trends[key].calls;
      }
    });

    res.json({
      period,
      days,
      trends
    });
  } catch (error) {
    console.error('Usage trends error:', error);
    res.status(500).json({ error: 'Failed to generate usage trends' });
  }
});

module.exports = router;