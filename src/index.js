const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bookRoutes = require('./books/book.routes');
const orderRoutes = require('./orders/order.routes');
const userRoutes = require('./users/user.routes');
const categoryRoutes = require('./categories/category.routes');
const authRoutes = require('./auth/auth.routes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  // Log available collections and their document counts
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\nAvailable Collections:');
  for (const collection of collections) {
    const count = await mongoose.connection.db.collection(collection.name).countDocuments();
    console.log(`${collection.name}: ${count} documents`);
  }
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 