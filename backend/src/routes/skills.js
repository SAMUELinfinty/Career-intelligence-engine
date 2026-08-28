'use strict';

const router = require('express').Router();
const { listSkills, getSkill } = require('../controllers/skillsController');

// GET /api/skills        — list all canonical skills
router.get('/',    listSkills);

// GET /api/skills/:id    — single skill by ID
router.get('/:id', getSkill);

module.exports = router;
