class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function prepareResponse(res, method, allowed) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (!allowed.includes(method)) {
    res.setHeader('Allow', allowed);
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}

function bodyOf(req) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new HttpError(400, 'Invalid request body');
  }
  return req.body;
}

function text(value, name, { min = 1, max = 1024 } = {}) {
  if (typeof value !== 'string' || value.length < min || value.length > max) {
    throw new HttpError(400, `Invalid ${name}`);
  }
  return value;
}

function positiveId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new HttpError(400, 'Invalid ID');
  }
  return id;
}

function sendError(res, error) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  // Database/verification errors can contain secrets or credential material.
  console.error('Request failed:', error.name);
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { HttpError, prepareResponse, bodyOf, text, positiveId, sendError };
