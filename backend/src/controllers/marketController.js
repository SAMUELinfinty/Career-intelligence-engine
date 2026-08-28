'use strict';

const marketService = require('../services/marketService');

async function getSkillDemand(req, res, next) {
  try {
    const demand = await marketService.getSkillDemand();
    res.json({ count: demand.length, skills: demand });
  } catch (err) {
    next(err);
  }
}

async function getRoleDemand(req, res, next) {
  try {
    const roles = await marketService.getRoleDemand();
    res.json({ count: roles.length, roles });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSkillDemand, getRoleDemand };
