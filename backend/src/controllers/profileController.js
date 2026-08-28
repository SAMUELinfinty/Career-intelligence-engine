'use strict';

const profileService = require('../services/profileService');
const { createError, validateSkillsList, validateTargetRoles } = require('../utils/validation');

async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfile();
    if (!profile) {
      return next(createError('User profile not found.', 404));
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, skills, targetRoles } = req.body;

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return next(createError('name must be a non-empty string.', 400));
    }

    // Validate skills if provided
    if (skills !== undefined) {
      const { valid, errors } = validateSkillsList(skills);
      if (!valid) {
        return next(createError(`Invalid skills: ${errors.join('; ')}`, 400));
      }
    }

    // Validate targetRoles if provided
    if (targetRoles !== undefined) {
      const { valid, errors } = validateTargetRoles(targetRoles);
      if (!valid) {
        return next(createError(`Invalid targetRoles: ${errors.join('; ')}`, 400));
      }
    }

    const updated = await profileService.updateProfile({ name, skills, targetRoles });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };
