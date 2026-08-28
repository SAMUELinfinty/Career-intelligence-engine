'use strict';

const skillsService = require('../services/skillsService');
const { createError, isPositiveInt } = require('../utils/validation');

async function listSkills(req, res, next) {
  try {
    const skills = await skillsService.getAllSkills();
    res.json({ count: skills.length, skills });
  } catch (err) {
    next(err);
  }
}

async function getSkill(req, res, next) {
  try {
    const { id } = req.params;

    if (!isPositiveInt(id)) {
      return next(createError('Invalid skill ID — must be a positive integer.', 400));
    }

    const skill = await skillsService.getSkillById(parseInt(id, 10));
    if (!skill) {
      return next(createError('Skill not found.', 404));
    }

    res.json(skill);
  } catch (err) {
    next(err);
  }
}

module.exports = { listSkills, getSkill };
