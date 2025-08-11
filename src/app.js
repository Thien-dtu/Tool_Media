const express = require('express');
const cors = require('cors');

// Import routes
const apiRoutes = require('./routes/api');
const cursorRoutes = require('./routes/cursor');
const downloadRoutes = require('./routes/download');
const reportRoutes = require('./routes/report');
const savedRoutes = require('./routes/saved');

const app = express();

// Serve static files from the project root
app.use(express.static(process.cwd()));

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Use routes
app.use('/', apiRoutes);
app.use('/', cursorRoutes);
app.use('/', downloadRoutes);
app.use('/', reportRoutes);
app.use('/', savedRoutes);

// The existing routes for file and glob operations can be added here if needed
// For now, they are removed to avoid confusion with the main application
// const fileRoutes = require('./routes/files');
// const globRoutes = require('./routes/glob');
// app.use('/files', fileRoutes);
// app.use('/glob', globRoutes);


module.exports = app;
