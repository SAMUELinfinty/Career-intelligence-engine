'use strict';

const jobsService = require('../services/jobsService');
const { createError, isPositiveInt } = require('../utils/validation');

async function listJobs(req, res, next) {
  try {
    const { role, location, skill, experience, remote, limit, offset } = req.query;
    const jobs = await jobsService.getJobs({ role, location, skill, experience, remote, limit, offset });
    res.json({ count: jobs.length, jobs });
  } catch (err) {
    next(err);
  }
}

async function getJob(req, res, next) {
  try {
    const { id } = req.params;

    if (!isPositiveInt(id)) {
      return next(createError('Invalid job ID — must be a positive integer.', 400));
    }

    const job = await jobsService.getJobById(parseInt(id, 10));
    if (!job) {
      return next(createError('Job not found.', 404));
    }

    res.json(job);
  } catch (err) {
    next(err);
  }
}

module.exports = { listJobs, getJob };
