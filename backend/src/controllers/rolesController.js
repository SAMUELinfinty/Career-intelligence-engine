'use strict';

const rolesService = require('../services/rolesService');
const { createError, isPositiveInt } = require('../utils/validation');

async function listRoles(req, res, next) {
  try {
    const roles = await rolesService.getAllRoles();
    res.json({ count: roles.length, roles });
  } catch (err) {
    next(err);
  }
}

async function getRole(req, res, next) {
  try {
    const { id } = req.params;

    if (!isPositiveInt(id)) {
      return next(createError('Invalid role ID — must be a positive integer.', 400));
    }

    const role = await rolesService.getRoleById(parseInt(id, 10));
    if (!role) {
      return next(createError('Role not found.', 404));
    }

    res.json(role);
  } catch (err) {
    next(err);
  }
}

module.exports = { listRoles, getRole };
