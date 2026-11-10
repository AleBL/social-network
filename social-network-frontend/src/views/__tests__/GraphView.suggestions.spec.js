import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import GraphView from '../GraphView.vue';
import { getGraph, getSuggestedConnections } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  getGraph: vi.fn(),
  getSuggestedConnections: vi.fn()
}));

const alice = { id: '1', name: 'Alice' };
const bob = { id: '2', name: 'Bob' };
const carol = { id: '3', name: 'Carol' };

// Bob and Carol share Alice: one suggested pair.
const graph = {
  nodes: [alice, bob, carol],
  links: [
    { source: '1', target: '2' },
    { source: '1', target: '3' }
  ]
};

const mountView = async () => {
  const wrapper = mount(GraphView, {
    global: { mocks: { $router: { push: vi.fn() } } }
  });
  await flushPromises();
  return wrapper;
};

async function toggle(wrapper) {
  await wrapper.find('.toggle input').setValue(true);
  await flushPromises();
}

describe('GraphView suggestions', () => {
  beforeEach(() => {
    getGraph.mockResolvedValue(graph);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not load nor draw suggestions until the toggle is on', async () => {
    const wrapper = await mountView();

    expect(getSuggestedConnections).not.toHaveBeenCalled();
    expect(wrapper.find('.suggestions').exists()).toBe(false);
  });

  it('draws one dashed line per suggested pair, from node to node', async () => {
    getSuggestedConnections.mockResolvedValue([
      { a: bob, b: carol, mutualFriends: [alice] }
    ]);
    const wrapper = await mountView();

    await toggle(wrapper);

    expect(getSuggestedConnections).toHaveBeenCalledWith(20);
    const lines = wrapper.findAll('.suggestions line');
    expect(lines).toHaveLength(1);

    const [bobNode, carolNode] = wrapper.findAll('.node').slice(1);
    expect(bobNode.attributes('transform')).toContain(
      `translate(${lines[0].attributes('x1')}, ${lines[0].attributes('y1')})`
    );
    expect(carolNode.attributes('transform')).toContain(
      `translate(${lines[0].attributes('x2')}, ${lines[0].attributes('y2')})`
    );
    expect(wrapper.find('.legend').text()).toContain('1 pairs');
  });

  it('skips pairs whose users are not on the graph', async () => {
    getSuggestedConnections.mockResolvedValue([
      { a: bob, b: { id: '99', name: 'Ghost' }, mutualFriends: [alice] }
    ]);
    const wrapper = await mountView();

    await toggle(wrapper);

    expect(wrapper.findAll('.suggestions line')).toHaveLength(0);
  });

  it('loads the suggestions only once when toggled again', async () => {
    getSuggestedConnections.mockResolvedValue([]);
    const wrapper = await mountView();

    await toggle(wrapper);
    await wrapper.find('.toggle input').setValue(false);
    await toggle(wrapper);

    expect(getSuggestedConnections).toHaveBeenCalledTimes(1);
  });

  it('turns the toggle off and shows the error when loading fails', async () => {
    getSuggestedConnections.mockRejectedValue({
      response: { data: { error: 'Database unavailable, please try again later' } }
    });
    const wrapper = await mountView();

    await toggle(wrapper);

    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Database unavailable'
    );
    expect(wrapper.find('.toggle input').element.checked).toBe(false);
  });
});
