import { useState, useEffect } from 'react';
import axios from 'axios';
import RebalancingDashboard from './components/RebalancingDashboard';
import CurrentHoldings from './components/CurrentHoldings';
import RebalancingHistory from './components/RebalancingHistory';
import EditModelPortfolio from './components/EditModelPortfolio';

function App() {
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Fetch all clients for the dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get('/api/clients');
        setClients(res.data);
        if (res.data.length > 0) {
          setActiveClient(res.data[0].client_id); // Default to first client (Amit)
        }
      } catch (err) {
        console.error('Failed to load clients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  if (loading) return <div className="p-4">Loading application...</div>;

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Wealth Builder 2025: Portfolio Rebalancing</h1>
          <p className="text-muted" style={{ fontSize: '1.05rem', letterSpacing: '0.02em' }}>
            Intelligent Portfolio Drift & Rebalancing Engine
          </p>
        </div>
        
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          {/* Client Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Switch Client</span>
            <select 
              className="client-select"
              value={activeClient}
              onChange={(e) => setActiveClient(e.target.value)}
            >
              {clients.map(c => (
                <option key={c.client_id} value={c.client_id}>
                  {c.client_name} • ₹{c.total_invested.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="tabs">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Rebalancing Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'holdings' ? 'active' : ''}`}
          onClick={() => setActiveTab('holdings')}
        >
          Current Holdings
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Rebalancing History
        </button>
        <button 
          className={`tab ${activeTab === 'edit-model' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit-model')}
        >
          Edit Model Portfolio
        </button>
      </nav>

      {/* Screen Rendering based on activeTab */}
      <main>
        {activeTab === 'dashboard' && <RebalancingDashboard clientId={activeClient} />}
        {activeTab === 'holdings' && <CurrentHoldings clientId={activeClient} />}
        {activeTab === 'history' && <RebalancingHistory clientId={activeClient} />}
        
        {/* Pass an onSaved callback to redirect right back to Dashboard after editing the model */}
        {activeTab === 'edit-model' && (
          <EditModelPortfolio onSaved={() => setActiveTab('dashboard')} />
        )}
      </main>
    </div>
  );
}

export default App;
