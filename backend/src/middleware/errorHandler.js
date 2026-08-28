'use strict';

/**
 * Global Express error handler.
 * Returns consistent JSON error responses.
 * Never exposes internal stack traces or DB credentials.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development';

  // Log the full error server-side
  console.error(`[Error] ${req.method} ${req.path} —`, err.message);
  if (isDev && err.stack) {
    console.error(err.stack);
  }

  // Determine status code
  const status = err.status || err.statusCode || 500;

  // Build safe response — never expose stack traces or DB details
  const response = { error: err.message || 'An unexpected error occurred.' };

  res.status(status).json(response);
}

module.exports = errorHandler;
