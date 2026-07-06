const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

const STATUS_VALUES = ['pending', 'in-progress', 'completed'];

router.use(protect);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().isString(),
    body('status').optional().isIn(STATUS_VALUES).withMessage('Invalid status'),
    body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
  ],
  validate,
  createTask
);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(STATUS_VALUES).withMessage('Invalid status filter'),
    query('owner').optional().isMongoId().withMessage('Invalid owner id'),
  ],
  validate,
  getTasks
);

router.get('/:id', [param('id').isMongoId().withMessage('Invalid task id')], validate, getTaskById);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid task id'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().isString(),
    body('status').optional().isIn(STATUS_VALUES).withMessage('Invalid status'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  ],
  validate,
  updateTask
);

router.delete('/:id', [param('id').isMongoId().withMessage('Invalid task id')], validate, deleteTask);

module.exports = router;
