'use strict';

const router = require('express').Router();
const { getSkillDemand, getRoleDemand } = require('../controllers/marketController');

// GET /api/market/skills — overall skill demand stats
router.get('/skills', getSkillDemand);

// GET /api/market/roles  — skill demand per role category
router.get('/roles',  getRoleDemand);

module.exports = router;
