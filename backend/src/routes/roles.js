'use strict';

const router = require('express').Router();
const { listRoles, getRole } = require('../controllers/rolesController');

// GET /api/roles         — list all role categories with top skills
router.get('/',    listRoles);

// GET /api/roles/:id     — single role with full skill profile
router.get('/:id', getRole);

module.exports = router;
