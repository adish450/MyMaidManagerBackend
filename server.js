// Import required modules
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

// Initialize the Express app
const app = express();

// Middleware
// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());
// Parse incoming JSON requests
app.use(express.json());

// A simple test route to check if the server is running
app.get('/', (req, res) => {
  res.send('My Maid Manager API is running...');
});

// Import and use API routes
const maidRoutes = require('./routes/maidRoutes');
app.use('/api/maids', maidRoutes);

// Define the port for the server
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});