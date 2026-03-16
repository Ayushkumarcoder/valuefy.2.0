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
      <header className="header">
        <h1>Wealth Builder 2025: Portfolio Rebalancing</h1>
        
        {/* Client Selector Dropdown */}
        <select 
          className="client-select"
          value={activeClient}
          onChange={(e) => setActiveClient(e.target.value)}
        >
          {clients.map(c => (
            <option key={c.client_id} value={c.client_id}>
              {c.client_name} (Total Inv: ₹{c.total_invested.toLocaleString()})
            </option>
          ))}
        </select>
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
