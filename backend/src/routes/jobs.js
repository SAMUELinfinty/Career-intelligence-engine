'use strict';

const router = require('express').Router();
const { listJobs, getJob } = require('../controllers/jobsController');

// GET /api/jobs          — list/search jobs (with optional filters)
router.get('/',    listJobs);

// GET /api/jobs/:id      — single job details
router.get('/:id', getJob);

module.exports = router;
