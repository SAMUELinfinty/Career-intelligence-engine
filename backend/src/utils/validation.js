'use strict';

/**
 * Creates a standardised HTTP error.
 *
 * @param {string} message  - Human-readable error message
 * @param {number} status   - HTTP status code
 * @returns {Error}
 */
function createError(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Validates that a value is a positive integer.
 *
 * @param {*} value
 * @returns {boolean}
 */
function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

/**
 * Validates that a proficiency value is in range [0, 4].
 *
 * @param {*} value
 * @returns {boolean}
 */
function isValidProficiency(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 4;
}

/**
 * Validates a list of skills for profile update.
 * Each element must have { name: string, proficiency: 0-4 }.
 *
 * @param {Array} skills
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSkillsList(skills) {
  const errors = [];

  if (!Array.isArray(skills)) {
    return { valid: false, errors: ['skills must be an array'] };
  }

  skills.forEach((s, i) => {
    if (!s || typeof s !== 'object') {
      errors.push(`skills[${i}]: must be an object`);
      return;
    }
    if (typeof s.name !== 'string' || s.name.trim() === '') {
      errors.push(`skills[${i}].name: must be a non-empty string`);
    }
    if (!isValidProficiency(s.proficiency)) {
      errors.push(`skills[${i}].proficiency: must be an integer between 0 and 4`);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a list of target roles for profile update.
 * Each element must be a non-empty string.
 *
 * @param {Array} roles
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTargetRoles(roles) {
  const errors = [];

  if (!Array.isArray(roles)) {
    return { valid: false, errors: ['targetRoles must be an array'] };
  }

  const validRoles = [
    'Software Engineering',
    'Data & AI',
    'Web Development',
    'Cloud & DevOps',
    'Cybersecurity & GRC',
    'Other CS/Tech',
  ];

  roles.forEach((r, i) => {
    if (typeof r !== 'string' || r.trim() === '') {
      errors.push(`targetRoles[${i}]: must be a non-empty string`);
    }
  });

  return { valid: errors.length === 0, errors };
}

module.exports = {
  createError,
  isPositiveInt,
  isValidProficiency,
  validateSkillsList,
  validateTargetRoles,
};
