require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Setup Socket.IO for real-time notifications & chapter comments
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const { initSocket } = require('./services/socketService');
initSocket(io);

// Attach io instance to app
app.set('io', io);

// Start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[Database] MySQL connected successfully.');

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`   MARVEL COMIC PLATFORM BACKEND API RUNNING        `);
      console.log(`   Port        : ${PORT}                            `);
      console.log(`   URL         : http://localhost:${PORT}           `);
      console.log(`   Environment : ${process.env.NODE_ENV || 'dev'}   `);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('[FATAL] Failed to connect to MySQL database:', error);
    process.exit(1);
  }
}

startServer();
