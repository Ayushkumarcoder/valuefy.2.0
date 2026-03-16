const express = require('express');
const cors = require('cors');
const rebalanceRoutes = require('./routes/rebalance');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());                  // Allow frontend (port 5173) to call this API
app.use(express.json());          // Parse JSON request bodies

// Mount all routes under /api
app.use('/api', rebalanceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`   API available at http://localhost:${PORT}/api`);
});
