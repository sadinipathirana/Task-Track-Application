const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Builds the base query scoping non-admins to their own tasks
function scopeToOwner(req, filter) {
  if (req.user.role !== 'admin') {
    filter.owner = req.user._id;
  }
  return filter;
}

// @route POST /api/tasks
// @access Private (user, admin)
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, dueDate } = req.body;

  const task = await Task.create({
    title,
    description,
    status,
    dueDate,
    owner: req.user._id,
  });

  const populated = await task.populate('owner', 'name email');

  req.io.to(roomFor(req.user._id)).emit('task:created', populated);
  req.io.to('admins').emit('task:created', populated);

  res.status(201).json({ success: true, data: { task: populated } });
});

// @route GET /api/tasks
// @access Private (user: own tasks, admin: all tasks)
const getTasks = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  scopeToOwner(req, filter);

  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Only admins may filter by an arbitrary owner; regular users are
  // already scoped to themselves above.
  if (req.query.owner && req.user.role === 'admin') {
    filter.owner = req.query.owner;
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// @route GET /api/tasks/:id
// @access Private (owner or admin)
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('owner', 'name email');
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  assertCanAccess(req, task);

  res.status(200).json({ success: true, data: { task } });
});

// @route PUT /api/tasks/:id
// @access Private (owner or admin)
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  assertCanAccess(req, task);

  const allowedFields = ['title', 'description', 'status', 'dueDate'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      task[field] = req.body[field];
    }
  });

  await task.save();
  const populated = await task.populate('owner', 'name email');

  req.io.to(roomFor(task.owner._id || task.owner)).emit('task:updated', populated);
  req.io.to('admins').emit('task:updated', populated);

  res.status(200).json({ success: true, data: { task: populated } });
});

// @route DELETE /api/tasks/:id
// @access Private (owner or admin)
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  assertCanAccess(req, task);

  const ownerId = task.owner;
  await task.deleteOne();

  req.io.to(roomFor(ownerId)).emit('task:deleted', { id: req.params.id });
  req.io.to('admins').emit('task:deleted', { id: req.params.id });

  res.status(200).json({ success: true, data: { id: req.params.id } });
});

// Throws 403 if a non-admin is trying to access someone else's task
function assertCanAccess(req, task) {
  const isOwner = task.owner.toString() === req.user._id.toString() ||
    (task.owner._id && task.owner._id.toString() === req.user._id.toString());
  if (req.user.role !== 'admin' && !isOwner) {
    throw new ApiError(403, 'Forbidden: you do not have access to this task');
  }
}

function roomFor(userId) {
  return `user:${userId.toString()}`;
}

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
