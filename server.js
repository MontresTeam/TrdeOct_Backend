require('dotenv').config();
const express = require('express');
const connectDB = require('./config/Db');
const cors = require('cors');

const app = express();

// Routes
const ProductRoute = require('./routes/productRoutes');
const SellerRoute = require('./routes/sellerRoute');

// ----------------------
// Middleware
// ----------------------
app.use(express.json());

// ✅ Simple CORS setup
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // allowed origins
  credentials: true
}));

// ----------------------
// Connect Database
// ----------------------
connectDB();

// ----------------------
// Routes
// ----------------------
app.get('/', (req, res) => {
  res.send('Welcome To Tradeauct');
});

app.use("/api/auction", ProductRoute);
app.use("/api/auth", SellerRoute);

// ----------------------
// Error Handler
// ----------------------
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Internal Server Error' });
});

// ----------------------
// Start Server
// ----------------------
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
