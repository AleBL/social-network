import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import GraphView from '../GraphView.vue';
import { getGraph } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  getGraph: vi.fn()
}));

const graph = {
  nodes: [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Carol' }
  ],
  links: [
    { source: '1', target: '2' },
    { source: '1', target: '3' }
  ]
};

let router;

const mountView = () =>
  mount(GraphView, { global: { mocks: { $router: router } } });

describe('GraphView', () => {
  beforeEach(() => {
    router = { push: vi.fn() };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('draws one circle per user and one line per friendship', async () => {
    getGraph.mockResolvedValue(graph);

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.findAll('.node')).toHaveLength(3);
    expect(wrapper.findAll('.links line')).toHaveLength(2);
    expect(wrapper.find('.summary').text()).toBe('3 users, 2 friendships');
    expect(wrapper.findAll('.node text').map((t) => t.text())).toEqual([
      'Alice',
      'Bob',
      'Carol'
    ]);
  });

  it('gives each node an accessible name with its friend count', async () => {
    getGraph.mockResolvedValue(graph);

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('.node').attributes('aria-label')).toBe(
      'Alice, 2 friends'
    );
  });

  it('opens the profile on click and on Enter', async () => {
    getGraph.mockResolvedValue(graph);
    const wrapper = mountView();
    await flushPromises();

    const nodes = wrapper.findAll('.node');
    await nodes[1].trigger('click');
    await nodes[2].trigger('keydown', { key: 'Enter' });

    expect(router.push).toHaveBeenNthCalledWith(1, {
      name: 'user',
      params: { id: '2' }
    });
    expect(router.push).toHaveBeenNthCalledWith(2, {
      name: 'user',
      params: { id: '3' }
    });
  });

  it('uses singular words for a single user', async () => {
    getGraph.mockResolvedValue({ nodes: [{ id: '1', name: 'Alice' }], links: [] });

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('.summary').text()).toBe('1 user, 0 friendships');
  });

  it('shows the empty state', async () => {
    getGraph.mockResolvedValue({ nodes: [], links: [] });

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('.empty').exists()).toBe(true);
    expect(wrapper.find('svg').exists()).toBe(false);
  });

  it('shows the error and retries on demand', async () => {
    getGraph
      .mockRejectedValueOnce({
        response: { data: { error: 'Database unavailable, please try again later' } }
      })
      .mockResolvedValueOnce(graph);

    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Database unavailable'
    );

    await wrapper.find('.load-error button').trigger('click');
    await flushPromises();

    expect(wrapper.findAll('.node')).toHaveLength(3);
  });
});
