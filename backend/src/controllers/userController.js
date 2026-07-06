const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @route GET /api/users
// @access Private (admin only)
// Returns a lightweight list of all users so an admin can filter tasks by
// owner without needing to know a raw ObjectId.
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}, 'name email role').sort({ name: 1 });

  res.status(200).json({ success: true, data: { users } });
});

module.exports = { listUsers };
