'use strict';

const recommendationsService = require('../services/recommendationsService');

async function getRecommendations(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const recs = await recommendationsService.getRecommendations(1, limit);
    res.json({ count: recs.length, recommendations: recs });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRecommendations };
