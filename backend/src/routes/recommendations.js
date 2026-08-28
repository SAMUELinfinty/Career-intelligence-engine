'use strict';

const router = require('express').Router();
const { getRecommendations } = require('../controllers/recommendationsController');

// GET /api/recommendations — learning priority recommendations for user
router.get('/', getRecommendations);

module.exports = router;
