import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Screen 3: Rebalancing History
 * Lists all previous rebalancing sessions saved for the selected client.
 */
function RebalancingHistory({ clientId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch session history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!clientId) return;
      try {
        setLoading(true);
        const res = await axios.get(`/api/history/${clientId}`);
        setSessions(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load past recommendations.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [clientId]);

  if (loading) return <div className="p-4">Loading history...</div>;
  if (error) return <div className="p-4 error-text">{error}</div>;

  return (
    <div className="card">
      <div className="p-4">
        <h2 className="font-bold mb-4">Past Recommendations</h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th className="text-right">Portfolio Value</th>
              <th className="text-right">Total BUY</th>
              <th className="text-right">Total SELL</th>
              <th className="text-right">Cash Needed</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4">No rebalancing history found.</td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.session_id}>
                  <td>{new Date(session.created_at).toLocaleString()}</td>
                  <td className="text-right font-bold">₹{session.portfolio_value.toLocaleString()}</td>
                  <td className="text-right text-buy" style={{ color: 'var(--color-buy)' }}>
                    ₹{session.total_to_buy.toLocaleString()}
                  </td>
                  <td className="text-right text-sell" style={{ color: 'var(--color-sell)' }}>
                    ₹{session.total_to_sell.toLocaleString()}
                  </td>
                  <td className="text-right font-bold">₹{session.net_cash_needed.toLocaleString()}</td>
                  <td className="text-center">
                    <span className={`badge status-${session.status}`}>{session.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RebalancingHistory;
