const { getFriendshipGraph } = require('../services/graphService');

// Errors are forwarded with next(err) to the central errorHandler middleware.
exports.getGraph = async (req, res, next) => {
  try {
    const data = await getFriendshipGraph();
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};
