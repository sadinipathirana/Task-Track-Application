const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { listUsers } = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), listUsers);

module.exports = router;
