const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const storyRoutes = require('./routes/storyRoutes');
const genreRoutes = require('./routes/genreRoutes');
const adminRoutes = require('./routes/adminRoutes');
const planRoutes = require('./routes/planRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const commentRoutes = require('./routes/commentRoutes');
const commentActionRoutes = require('./routes/commentActionRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files (e.g. chapter cover images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Marvel Comic Platform API'
  });
});

const { checkReadAccess } = require('./middlewares/checkReadAccess');

// API Routes
app.use('/api/auth', authRoutes);
app.get('/api/image-proxy', require('./controllers/storyController').proxyImage);
app.use('/api/stories', storyRoutes);
app.get('/api/chapters/:chapterId', checkReadAccess, require('./controllers/storyController').getChapterDetail);
app.use('/api/chapters/:chapterId/comments', commentRoutes);
app.use('/api/comments', commentActionRoutes);
app.use('/api/reading-progress', progressRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy tài nguyên: ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
