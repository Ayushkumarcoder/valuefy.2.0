import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Screen 4: Edit Model Portfolio
 * An editable form to change target allocations. Must sum to exactly 100%.
 */
function EditModelPortfolio({ onSaved }) {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Fetch current model
  useEffect(() => {
    const fetchModel = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/model-funds');
        setFunds(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load model portfolio.');
      } finally {
        setLoading(false);
      }
    };
    fetchModel();
  }, []);

  // Update local state when an input changes
  const handlePctChange = (index, value) => {
    const num = parseFloat(value) || 0;
    const updated = [...funds];
    updated[index].allocation_pct = num;
    setFunds(updated);
  };

  // Calculate live total
  const totalPct = funds.reduce((sum, f) => sum + (f.allocation_pct || 0), 0);
  const isValid = Math.abs(totalPct - 100) < 0.01; // Allow tiny float inaccuracies

  // Save changes to backend
  const handleSave = async () => {
    if (!isValid) return;

    try {
      setSaving(true);
      const res = await axios.put('/api/model-funds', { funds });
      
      setToast(res.data.message);
      setTimeout(() => setToast(''), 3000);
      
      // Notify parent to refresh Dashboard if we navigate back
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save model portfolio.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading model portfolio...</div>;
  if (error) return <div className="p-4 error-text">{error}</div>;

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="p-4 border-b border-[var(--border-color)] pb-2" style={{ borderBottom: '1px solid var(--border-color)'}}>
        <h2 className="font-bold">Edit Model Target Allocations</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Set the target percentages for the 5 recommended funds.</p>
      </div>

      <div className="p-4">
        {funds.map((fund, i) => (
          <div key={fund.fund_id} className="form-group flex-between">
            <label style={{ flex: 1 }}>{fund.fund_name} <span className="text-muted">({fund.asset_class})</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="input text-right"
                style={{ width: '80px' }}
                value={fund.allocation_pct}
                onChange={(e) => handlePctChange(i, e.target.value)}
              />
              <span className="text-muted">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="summary-bar" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
        <div className="flex-between" style={{ width: '100%' }}>
          <span className="font-bold">Total Allocation:</span>
          <span 
            className="font-bold" 
            style={{ 
              fontSize: '1.25rem', 
              color: isValid ? 'var(--color-buy)' : 'var(--color-sell)' 
            }}
          >
            {totalPct.toFixed(1)}%
          </span>
        </div>
        
        {!isValid && (
          <div className="error-text" style={{ marginTop: 0 }}>
            Allocations must equal exactly 100%. You are off by {(100 - totalPct).toFixed(1)}%.
          </div>
        )}

        <button 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          onClick={handleSave}
          disabled={!isValid || saving}
        >
          {saving ? 'Saving...' : 'Save Updated Plan'}
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default EditModelPortfolio;
