const db = require('./db');

/**
 * Core rebalancing logic — compares a client's actual holdings against
 * the model portfolio and returns BUY/SELL/REVIEW recommendations.
 *
 * @param {string} clientId — e.g. "C001"
 * @returns {object} — { clientId, clientName, portfolioValue, items[], totalBuy, totalSell, netCashNeeded }
 */
function calculateRebalancing(clientId) {
  // Step 1: Get all holdings for this client
  const holdings = db.prepare(
    'SELECT fund_id, fund_name, current_value FROM client_holdings WHERE client_id = ?'
  ).all(clientId);

  console.log(`\n📊 Calculating rebalancing for client: ${clientId}`);
  console.log('Holdings:', holdings);

  // Step 2: Calculate total portfolio value (sum of ALL current values)
  const portfolioValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
  console.log('Total portfolio value:', portfolioValue);

  // Step 3: Get the model portfolio (target allocations)
  const modelFunds = db.prepare('SELECT * FROM model_funds').all();
  console.log('Model funds:', modelFunds);

  // Step 4: Build a lookup map of client holdings by fund_id for quick access
  const holdingsMap = {};
  holdings.forEach(h => {
    holdingsMap[h.fund_id] = h;
  });

  const items = [];
  let totalBuy = 0;
  let totalSell = 0;

  // Step 5: For each fund in the model, calculate drift and action
  modelFunds.forEach(model => {
    const currentValue = holdingsMap[model.fund_id]
      ? holdingsMap[model.fund_id].current_value
      : 0;

    // Current percentage of portfolio this fund represents
    const currentPct = portfolioValue > 0
      ? parseFloat(((currentValue / portfolioValue) * 100).toFixed(1))
      : 0;

    const targetPct = model.allocation_pct;

    // Target value in rupees = target_pct% of total portfolio
    const targetValue = (targetPct / 100) * portfolioValue;

    // Difference = how much to buy (positive) or sell (negative)
    const diff = targetValue - currentValue;

    // Round to nearest rupee for clean display
    const amount = Math.round(Math.abs(diff));
    const action = diff >= 0 ? 'BUY' : 'SELL';

    // What percentage this fund will be after rebalancing
    const postRebalancePct = targetPct;

    console.log(
      `  ${model.fund_name}: current=${currentPct}%, target=${targetPct}%, ` +
      `drift=${(targetPct - currentPct).toFixed(1)}%, action=${action}, amount=₹${amount}`
    );

    if (action === 'BUY') totalBuy += amount;
    if (action === 'SELL') totalSell += amount;

    items.push({
      fund_id: model.fund_id,
      fund_name: model.fund_name,
      action,
      amount,
      current_pct: currentPct,
      target_pct: targetPct,
      post_rebalance_pct: postRebalancePct,
      is_model_fund: 1,
      drift: parseFloat((targetPct - currentPct).toFixed(1))
    });

    // Remove from holdingsMap so we can find non-model funds later
    delete holdingsMap[model.fund_id];
  });

  // Step 6: Any remaining funds in holdingsMap are NOT in the model → REVIEW
  Object.values(holdingsMap).forEach(holding => {
    const currentPct = portfolioValue > 0
      ? parseFloat(((holding.current_value / portfolioValue) * 100).toFixed(1))
      : 0;

    console.log(
      `  ⚠ ${holding.fund_name}: NOT IN PLAN, current=${currentPct}%, value=₹${holding.current_value} → REVIEW`
    );

    items.push({
      fund_id: holding.fund_id,
      fund_name: holding.fund_name,
      action: 'REVIEW',
      amount: holding.current_value,
      current_pct: currentPct,
      target_pct: null,
      post_rebalance_pct: null,
      is_model_fund: 0,
      drift: null
    });
  });

  const netCashNeeded = totalBuy - totalSell;

  console.log(`\n💰 Summary: BUY=₹${totalBuy}, SELL=₹${totalSell}, Fresh Cash=₹${netCashNeeded}`);

  // Get client name for display
  const client = db.prepare('SELECT client_name FROM clients WHERE client_id = ?').get(clientId);

  return {
    clientId,
    clientName: client ? client.client_name : clientId,
    portfolioValue,
    items,
    totalBuy,
    totalSell,
    netCashNeeded
  };
}

module.exports = calculateRebalancing;
