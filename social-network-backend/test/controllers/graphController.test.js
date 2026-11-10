const graphController = require('../../src/controllers/graphController');
const graphService = require('../../src/services/graphService');

jest.mock('../../src/services/graphService', () => ({
  getFriendshipGraph: jest.fn()
}));

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('graphController.getGraph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('answers the graph', async () => {
    const graph = { nodes: [{ id: '1', name: 'Alice' }], links: [] };
    graphService.getFriendshipGraph.mockResolvedValue(graph);
    const res = mockResponse();

    await graphController.getGraph({}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: graph });
  });

  it('passes service errors to next', async () => {
    const error = new Error('Service failure');
    graphService.getFriendshipGraph.mockRejectedValue(error);
    const res = mockResponse();
    const next = jest.fn();

    await graphController.getGraph({}, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
