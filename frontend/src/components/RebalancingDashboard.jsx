import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Screen 1: Rebalancing Dashboard
 * Shows the drift table, actions (BUY/SELL/REVIEW), and allows saving the recommendation.
 */
function RebalancingDashboard({ clientId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Fetch rebalancing calculation from backend
  const fetchRebalancing = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`/api/rebalance/${clientId}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load rebalancing data.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when client changes
  useEffect(() => {
    if (clientId) fetchRebalancing();
  }, [clientId]);

  // Save the recommendation to the database
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await axios.post('/api/rebalance/save', { clientId });
      
      // Show success toast
      setToast(res.data.message);
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to save recommendation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Calculating drift...</div>;
  if (error) return <div className="p-4 error-text">{error}</div>;
  if (!data) return null;

  return (
    <div className="card">
      <div className="p-4 flex-between">
        <h2 className="font-bold">Model Portfolio Drift</h2>
        <span className="text-muted">Total Portfolio: ₹{data.portfolioValue.toLocaleString()}</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Fund Name</th>
              <th className="text-right">Target %</th>
              <th className="text-right">Current %</th>
              <th className="text-right">Drift</th>
              <th className="text-center">Action</th>
              <th className="text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.fund_id} className={item.action === 'REVIEW' ? 'warning-row' : ''}>
                <td>
                  {item.fund_name}
                  {item.action === 'REVIEW' && (
                    <span className="badge action-REVIEW mt-4" style={{ display: 'block', width: 'fit-content' }}>
                      ⚠ Not in Plan
                    </span>
                  )}
                </td>
                <td className="text-right">{item.target_pct !== null ? `${item.target_pct}%` : '—'}</td>
                <td className="text-right">{item.current_pct}%</td>
                <td className="text-right">
                  {item.drift !== null ? (
                    <span style={{ color: item.drift > 0 ? 'var(--color-buy)' : item.drift < 0 ? 'var(--color-sell)' : 'inherit' }}>
                      {item.drift > 0 ? '+' : ''}{item.drift}%
                    </span>
                  ) : '—'}
                </td>
                <td className="text-center">
                  <span className={`badge action-${item.action}`}>{item.action}</span>
                </td>
                <td className="text-right font-bold">
                  {item.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="summary-bar">
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Total to BUY</span>
            <span className="stat-value buy">₹{data.totalBuy.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Total to SELL</span>
            <span className="stat-value sell">₹{data.totalSell.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Fresh Cash Needed</span>
            <span className="stat-value font-bold">₹{data.netCashNeeded.toLocaleString()}</span>
          </div>
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Recommendation'}
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default RebalancingDashboard;
