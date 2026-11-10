const graphController = require('../../src/controllers/graphController');
const graphService = require('../../src/services/graphService');

jest.mock('../../src/services/graphService', () => ({
  getFriendshipGraph: jest.fn(),
  getSuggestedConnections: jest.fn()
}));

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('graphController.getSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('answers the suggestions with their count, 10 by default', async () => {
    const suggestions = [{ a: {}, b: {}, mutualFriends: [] }];
    graphService.getSuggestedConnections.mockResolvedValue(suggestions);
    const res = mockResponse();

    await graphController.getSuggestions({ query: {} }, res, jest.fn());

    expect(graphService.getSuggestedConnections).toHaveBeenCalledWith(10);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: suggestions,
      count: 1
    });
  });

  it('uses a valid ?limit', async () => {
    graphService.getSuggestedConnections.mockResolvedValue([]);

    await graphController.getSuggestions(
      { query: { limit: '25' } },
      mockResponse(),
      jest.fn()
    );

    expect(graphService.getSuggestedConnections).toHaveBeenCalledWith(25);
  });

  it.each(['0', '51', '2.5', 'abc', ''])(
    'rejects ?limit=%j with a 400 error',
    async (limit) => {
      const next = jest.fn();

      await graphController.getSuggestions(
        { query: { limit } },
        mockResponse(),
        next
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'limit must be an integer between 1 and 50'
        })
      );
      expect(graphService.getSuggestedConnections).not.toHaveBeenCalled();
    }
  );

  it('passes service errors to next', async () => {
    const error = new Error('Service failure');
    graphService.getSuggestedConnections.mockRejectedValue(error);
    const next = jest.fn();

    await graphController.getSuggestions({ query: {} }, mockResponse(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
