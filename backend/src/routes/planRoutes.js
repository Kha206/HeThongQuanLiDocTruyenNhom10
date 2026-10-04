const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Public routes for readers
router.get('/', planController.getAllPlans);
router.get('/:id', planController.getPlanById);

// Admin-only management routes
router.post('/', authMiddleware, roleMiddleware('admin'), planController.createPlan);
router.put('/:id', authMiddleware, roleMiddleware('admin'), planController.updatePlan);
router.patch('/:id/toggle', authMiddleware, roleMiddleware('admin'), planController.togglePlanStatus);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), planController.deletePlan);

module.exports = router;
