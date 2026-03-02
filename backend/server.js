const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/subscriptions', require('./src/routes/subscription.routes'));
app.use('/api/analytics', require('./src/routes/analytics.routes'));
app.use('/api/integrations', require('./src/routes/integration.routes'));
app.use('/api/notifications', require('./src/routes/notification.routes'));

io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('subscribe_user', (userId) => {
    socket.join(`user_${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});