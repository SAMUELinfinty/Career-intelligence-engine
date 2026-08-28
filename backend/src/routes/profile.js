'use strict';

const router = require('express').Router();
const { getProfile, updateProfile } = require('../controllers/profileController');

// GET /api/profile       — get user profile (skills + target roles)
router.get('/',  getProfile);

// PUT /api/profile       — update user profile
router.put('/',  updateProfile);

module.exports = router;
