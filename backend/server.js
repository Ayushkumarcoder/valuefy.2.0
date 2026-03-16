const express = require('express');
const cors = require('cors');
const path = require('path');
const rebalanceRoutes = require('./routes/rebalance');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());                  // Allow frontend (port 5173) to call this API
app.use(express.json());          // Parse JSON request bodies

// Mount all routes under /api
app.use('/api', rebalanceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
// Only serve static files if we are actually building/running the whole app together
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// For any route not caught by the API (like React Router if you add it later, or browser refreshes),
// send back the index.html from the frontend build.
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`   API available at http://localhost:${PORT}/api`);
});
