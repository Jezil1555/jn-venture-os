// Catches anything passed to next(err) and any synchronous throw inside a
// route handler wrapped in asyncHandler. Keeps error shape consistent so
// the frontend can rely on { error: string } everywhere.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong on our end.' : err.message;
  res.status(status).json({ error: message });
}

export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

// Wrap async route handlers so rejected promises reach errorHandler
// instead of crashing the process or hanging the request.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
