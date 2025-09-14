import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import motivationRoutes from './routes/motivationRoutes.js';
import streakRoutes from './routes/streakRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// CORS configuration for frontend
app.use(
  cors({
    origin: 'https://streakmate.vercel.app', // your deployed frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, // if you use cookies or authentication
  })
);

// Handle preflight OPTIONS requests for all routes
app.options('*', cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/motivation', motivationRoutes);
app.use('/api/streak-restore', streakRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Failed:', err));

// Health check route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Start server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
