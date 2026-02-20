import dotenv from 'dotenv';
dotenv.config();
console.log("Gemini Key Loaded?:", !!process.env.GEMINI_API_KEY);
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import motivationRoutes from './routes/motivationRoutes.js';
import streakRestoreRoutes from './routes/streakRestoreRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import circleRoutes from './routes/circleRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import { startStreakMonitor } from './cron/streakMonitor.js';

const app = express();
const server = http.createServer(app);

// Setup Socket.io
export const io = new Server(server, {
  cors: {
    origin: ['https://streakmate.vercel.app', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }
});

io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});


// Middleware
app.use(express.json());

// Simplified and more robust CORS configuration
const allowedOrigins = ['https://streakmate.vercel.app', 'http://localhost:5173'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/motivation', motivationRoutes);
app.use('/api/streak-restore', streakRestoreRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/circles', circleRoutes);
app.use('/api/map', mapRoutes);

// Habit status checker - runs every minute
const checkHabitStatuses = async () => {
  try {
    const Habit = (await import('./models/habit.js')).default;
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Find all daily habits that are pending and not completed today
    const pendingDailyHabits = await Habit.find({
      status: 'pending',
      frequency: 'daily', // Only apply time-based miss to daily habits
      $nor: [{ completedDates: todayStr }]
    });

    const habitsToUpdate = pendingDailyHabits.filter(habit => {
      const timeToCompare = habit.timeTo || habit.endTime || habit.time;
      if (!timeToCompare) return false;
      const [hour, minute] = timeToCompare.split(':').map(Number);
      if (isNaN(hour) || isNaN(minute)) return false;
      const habitTimeInMinutes = hour * 60 + minute;
      return currentTimeInMinutes > habitTimeInMinutes;
    });

    if (habitsToUpdate.length > 0) {
      console.log(`Updating ${habitsToUpdate.length} habits to missed status at ${now.toLocaleTimeString()}`);

      for (const habit of habitsToUpdate) {
        // Double-check that the habit still exists and is still pending
        // This prevents issues with recently deleted habits
        const currentHabit = await Habit.findById(habit._id);
        if (currentHabit && currentHabit.status === 'pending') {
          currentHabit.status = 'missed';
          await currentHabit.save();
          console.log(`Marked habit "${currentHabit.name}" as missed (time: ${currentHabit.timeFrom || currentHabit.startTime || currentHabit.time} - ${currentHabit.timeTo || currentHabit.endTime || 'N/A'}) - not completed today`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking habit statuses:', error);
  }
};

// Health check route
app.get('/', (req, res) => res.send('API is running'));

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Start server only after successful DB connection
    const PORT = process.env.PORT || 5003;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      // Run the status checker immediately on startup
      checkHabitStatuses();
      // Then, run it every minute
      setInterval(checkHabitStatuses, 60000);

      // Start node-cron streak monitor
      startStreakMonitor();
    });
  } catch (err) {
    console.error('MongoDB Connection Failed:', err);
    process.exit(1); // Exit process with failure
  }
};

startServer();
