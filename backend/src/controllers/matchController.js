'use strict';

const matchService = require('../services/matchService');
const { createError } = require('../utils/validation');

async function matchJob(req, res, next) {
  try {
    const { jobId } = req.body;

    // Validate jobId
    if (jobId === undefined || jobId === null) {
      return next(createError('jobId is required.', 400));
    }

    const numericId = Number(jobId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return next(createError('jobId must be a positive integer.', 400));
    }

    const result = await matchService.computeMatch(numericId);

    if (!result) {
      return next(createError('Job not found.', 404));
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { matchJob };
