'use strict';

const router = require('express').Router();
const { matchJob } = require('../controllers/matchController');

// POST /api/match        — compute match score for user vs. job
router.post('/', matchJob);

module.exports = router;
