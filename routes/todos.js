const express = require('express');
const { body, query } = require('express-validator');
const Todo = require('../models/Todo');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const todoValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Each tag cannot exceed 20 characters')
];

const updateTodoValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Each tag cannot exceed 20 characters'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean value')
];

// @route   GET /api/todos
// @desc    Get all todos for authenticated user
// @access  Private
router.get('/',
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('completed')
      .optional()
      .isBoolean()
      .withMessage('Completed must be a boolean'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      completed,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      completed: completed !== undefined ? completed === 'true' : undefined,
      priority,
      sortBy,
      sortOrder
    };

    const todos = await Todo.getTodosByUser(req.user._id, options);
    
    // Get total count for pagination
    const totalCount = await Todo.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      status: 'success',
      data: {
        todos,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/todos/stats
// @desc    Get todo statistics for authenticated user
// @access  Private
router.get('/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const stats = await Todo.getUserStats(req.user._id);
    
    const result = stats.length > 0 ? stats[0] : {
      total: 0,
      completed: 0,
      pending: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats: result
      }
    });
  })
);

// @route   GET /api/todos/:id
// @desc    Get single todo by ID
// @access  Private
router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email');

    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        todo
      }
    });
  })
);

// @route   POST /api/todos
// @desc    Create a new todo
// @access  Private
router.post('/',
  authenticate,
  todoValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { title, description, priority, dueDate, tags } = req.body;

    const todo = await Todo.create({
      title,
      description: description || '',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
      user: req.user._id
    });

    await todo.populate('user', 'name email');

    res.status(201).json({
      status: 'success',
      message: 'Todo created successfully',
      data: {
        todo
      }
    });
  })
);

// @route   PUT /api/todos/:id
// @desc    Update a todo
// @access  Private
router.put('/:id',
  authenticate,
  updateTodoValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { title, description, priority, dueDate, tags, completed } = req.body;

    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found'
      });
    }

    // Update fields
    if (title !== undefined) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (priority !== undefined) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate;
    if (tags !== undefined) todo.tags = tags;
    if (completed !== undefined) todo.completed = completed;

    await todo.save();
    await todo.populate('user', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Todo updated successfully',
      data: {
        todo
      }
    });
  })
);

// @route   PATCH /api/todos/:id/toggle
// @desc    Toggle todo completion status
// @access  Private
router.patch('/:id/toggle',
  authenticate,
  asyncHandler(async (req, res) => {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found'
      });
    }

    await todo.toggleCompletion();
    await todo.populate('user', 'name email');

    res.status(200).json({
      status: 'success',
      message: `Todo marked as ${todo.completed ? 'completed' : 'pending'}`,
      data: {
        todo
      }
    });
  })
);

// @route   DELETE /api/todos/:id
// @desc    Delete a todo
// @access  Private
router.delete('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Todo deleted successfully'
    });
  })
);

// @route   DELETE /api/todos
// @desc    Delete all completed todos for authenticated user
// @access  Private
router.delete('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await Todo.deleteMany({
      user: req.user._id,
      completed: true
    });

    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} completed todos deleted successfully`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  })
);

module.exports = router;
