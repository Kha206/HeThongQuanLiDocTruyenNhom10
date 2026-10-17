const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadAvatar } = require('../middlewares/uploadMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authController.logout);

// Sprint 5: Password management
router.post('/change-password', authMiddleware, authController.changePassword);
router.put('/change-password', authMiddleware, authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Sprint 5: Profile & Avatar
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), authController.uploadAvatar);

module.exports = router;

