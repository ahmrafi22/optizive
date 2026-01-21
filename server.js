const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import scraper routes
const darazRouter = require('./services/daraz');
const chaldalRouter = require('./services/chaldal');
const swapnoRouter = require('./services/swapno');
const unimartRouter = require('./services/unimart');
const pickabooRouter = require('./services/pickaboo');
const transcomRouter = require('./services/transcom');
const othobaRouter = require('./services/othoba');
const pcpartpickerRouter = require('./services/pcpartpicker');
const bestelectronicsRouter = require('./services/bestelectronics');
const cartupRouter = require('./services/cartup');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Scraper Routes
app.use('/scraper-daraz', darazRouter);
app.use('/scraper-chaldal', chaldalRouter);
app.use('/scraper-swapno', swapnoRouter);
app.use('/scraper-unimart', unimartRouter);
app.use('/scraper-pickaboo', pickabooRouter);
app.use('/scraper-transcom', transcomRouter);
app.use('/scraper-othoba', othobaRouter);
app.use('/scraper-pcpartpicker', pcpartpickerRouter);
app.use('/scraper-bestelectronics', bestelectronicsRouter);
app.use('/scraper-cartup', cartupRouter);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Optizive API',
    status: 'Server is running successfully',
    availableScrapers: [
      '/scraper-daraz?query=your search',
      '/scraper-chaldal?query=your search',
      '/scraper-swapno?query=your search',
      '/scraper-unimart?query=your search',
      '/scraper-pickaboo?query=your search',
      '/scraper-transcom?query=your search',
      '/scraper-othoba?query=your search',
      '/scraper-pcpartpicker?query=your search&limit=20',
      '/scraper-bestelectronics?query=your search',
      '/scraper-cartup?query=your search'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
