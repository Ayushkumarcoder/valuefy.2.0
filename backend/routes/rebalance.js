const express = require('express');
const router = express.Router();
const db = require('../db');
const calculateRebalancing = require('../calculateRebalancing');

// GET /api/clients — fetch all clients for the dropdown
router.get('/clients', (req, res) => {
  try {
    const clients = db.prepare('SELECT client_id, client_name, total_invested FROM clients').all();
    res.json(clients);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/model-funds — fetch the model portfolio (target allocations)
router.get('/model-funds', (req, res) => {
  try {
    const funds = db.prepare('SELECT fund_id, fund_name, asset_class, allocation_pct FROM model_funds').all();
    res.json(funds);
  } catch (err) {
    console.error('Error fetching model funds:', err);
    res.status(500).json({ error: 'Failed to fetch model funds' });
  }
});

// GET /api/holdings/:clientId — fetch a client's current holdings
router.get('/holdings/:clientId', (req, res) => {
  try {
    const holdings = db.prepare(
      'SELECT fund_id, fund_name, current_value FROM client_holdings WHERE client_id = ?'
    ).all(req.params.clientId);

    // Calculate total portfolio value for percentage display
    const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);

    // Add percentage to each holding
    const holdingsWithPct = holdings.map(h => ({
      ...h,
      pct: totalValue > 0 ? parseFloat(((h.current_value / totalValue) * 100).toFixed(1)) : 0
    }));

    res.json({ holdings: holdingsWithPct, totalValue });
  } catch (err) {
    console.error('Error fetching holdings:', err);
    res.status(500).json({ error: 'Failed to fetch holdings' });
  }
});

// GET /api/rebalance/:clientId — calculate rebalancing (does NOT save)
router.get('/rebalance/:clientId', (req, res) => {
  try {
    const result = calculateRebalancing(req.params.clientId);
    res.json(result);
  } catch (err) {
    console.error('Error calculating rebalancing:', err);
    res.status(500).json({ error: 'Failed to calculate rebalancing' });
  }
});

// POST /api/rebalance/save — save a rebalancing recommendation to the database
router.post('/rebalance/save', (req, res) => {
  try {
    const { clientId } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' });
    }

    // Recalculate to get fresh numbers
    const result = calculateRebalancing(clientId);

    // Insert into rebalance_sessions
    const insertSession = db.prepare(`
      INSERT INTO rebalance_sessions (client_id, created_at, portfolio_value, total_to_buy, total_to_sell, net_cash_needed, status)
      VALUES (?, datetime('now'), ?, ?, ?, ?, 'PENDING')
    `);

    const sessionResult = insertSession.run(
      clientId,
      result.portfolioValue,
      result.totalBuy,
      result.totalSell,
      result.netCashNeeded
    );

    const sessionId = sessionResult.lastInsertRowid;
    console.log(`✅ Saved rebalance session #${sessionId} for ${clientId}`);

    // Insert each item into rebalance_items
    const insertItem = db.prepare(`
      INSERT INTO rebalance_items (session_id, fund_id, fund_name, action, amount, current_pct, target_pct, post_rebalance_pct, is_model_fund)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Use a transaction for atomicity — all items succeed or none do
    const insertAllItems = db.transaction((items) => {
      items.forEach(item => {
        insertItem.run(
          sessionId,
          item.fund_id,
          item.fund_name,
          item.action,
          item.amount,
          item.current_pct,
          item.target_pct,
          item.post_rebalance_pct,
          item.is_model_fund
        );
      });
    });

    insertAllItems(result.items);
    console.log(`✅ Saved ${result.items.length} rebalance items for session #${sessionId}`);

    res.json({ success: true, sessionId, message: `Recommendation saved (Session #${sessionId})` });
  } catch (err) {
    console.error('Error saving rebalancing:', err);
    res.status(500).json({ error: 'Failed to save recommendation' });
  }
});

// GET /api/history/:clientId — fetch all past rebalancing sessions for a client
router.get('/history/:clientId', (req, res) => {
  try {
    const sessions = db.prepare(
      'SELECT session_id, client_id, created_at, portfolio_value, total_to_buy, total_to_sell, net_cash_needed, status FROM rebalance_sessions WHERE client_id = ? ORDER BY created_at DESC'
    ).all(req.params.clientId);
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch rebalancing history' });
  }
});

// GET /api/history/session/:sessionId/items — fetch items for a specific session
router.get('/history/session/:sessionId/items', (req, res) => {
  try {
    const items = db.prepare(
      'SELECT item_id, fund_id, fund_name, action, amount, current_pct, target_pct, post_rebalance_pct, is_model_fund FROM rebalance_items WHERE session_id = ?'
    ).all(req.params.sessionId);
    res.json(items);
  } catch (err) {
    console.error('Error fetching session items:', err);
    res.status(500).json({ error: 'Failed to fetch session items' });
  }
});

// PUT /api/model-funds — update model portfolio allocations
router.put('/model-funds', (req, res) => {
  try {
    const { funds } = req.body;
    if (!funds || !Array.isArray(funds)) {
      return res.status(400).json({ error: 'funds array is required' });
    }

    // Validate: total must equal exactly 100%
    const total = funds.reduce((sum, f) => sum + f.allocation_pct, 0);
    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({ error: `Allocations must total 100%. Current total: ${total}%` });
    }

    // Update each fund's allocation in a transaction
    const updateFund = db.prepare(
      'UPDATE model_funds SET allocation_pct = ? WHERE fund_id = ?'
    );

    const updateAll = db.transaction((fundsToUpdate) => {
      fundsToUpdate.forEach(f => {
        updateFund.run(f.allocation_pct, f.fund_id);
      });
    });

    updateAll(funds);
    console.log('✅ Model portfolio updated:', funds);

    res.json({ success: true, message: 'Model portfolio updated successfully' });
  } catch (err) {
    console.error('Error updating model funds:', err);
    res.status(500).json({ error: 'Failed to update model portfolio' });
  }
});

module.exports = router;
