import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Screen 2: Current Holdings
 * Simple table displaying what the client actually owns right now.
 */
function CurrentHoldings({ clientId }) {
  const [data, setData] = useState({ holdings: [], totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHoldings = async () => {
      if (!clientId) return;
      try {
        setLoading(true);
        const res = await axios.get(`/api/holdings/${clientId}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load current holdings.');
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, [clientId]);

  if (loading) return <div className="p-4">Loading holdings...</div>;
  if (error) return <div className="p-4 error-text">{error}</div>;

  return (
    <div className="card">
      <div className="p-4">
        <h2 className="font-bold mb-4">Current Investments</h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Fund Name</th>
              <th className="text-right">Current Value (₹)</th>
              <th className="text-right">% of Portfolio</th>
            </tr>
          </thead>
          <tbody>
            {data.holdings.length === 0 ? (
              <tr><td colSpan="3" className="text-center p-4">No holdings found.</td></tr>
            ) : (
              data.holdings.map((h) => (
                <tr key={h.fund_id}>
                  <td>{h.fund_name}</td>
                  <td className="text-right font-bold">{h.current_value.toLocaleString()}</td>
                  <td className="text-right text-muted">{h.pct}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 text-right" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <span className="text-muted">Total Portfolio Value: </span>
        <span className="font-bold text-main" style={{ fontSize: '1.25rem', marginLeft: '0.5rem' }}>
          ₹{data.totalValue.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default CurrentHoldings;
