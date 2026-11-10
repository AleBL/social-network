const {
  getFriendshipGraph,
  getSuggestedConnections
} = require('../services/graphService');
const { ValidationError } = require('../errors');

const DEFAULT_SUGGESTIONS = 10;
const MAX_SUGGESTIONS = 50;

// ?limit= is optional: 1 to 50, 10 by default.
function parseLimit(value) {
  if (value === undefined) {
    return DEFAULT_SUGGESTIONS;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SUGGESTIONS) {
    throw new ValidationError(
      `limit must be an integer between 1 and ${MAX_SUGGESTIONS}`
    );
  }

  return limit;
}

// Errors are forwarded with next(err) to the central errorHandler middleware.
exports.getGraph = async (req, res, next) => {
  try {
    const data = await getFriendshipGraph();
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query?.limit);
    const data = await getSuggestedConnections(limit);
    res.status(200).json({ status: 'success', data, count: data.length });
  } catch (err) {
    next(err);
  }
};
