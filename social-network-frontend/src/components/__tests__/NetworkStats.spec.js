import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import NetworkStats from '../NetworkStats.vue';
import { getGraph } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  getGraph: vi.fn()
}));

const mountComponent = async () => {
  const wrapper = mount(NetworkStats, {
    global: { stubs: { RouterLink: RouterLinkStub } }
  });
  await flushPromises();
  return wrapper;
};

describe('NetworkStats', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the numbers and the most connected people', async () => {
    getGraph.mockResolvedValue({
      nodes: [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Carol' }
      ],
      links: [
        { source: '1', target: '2' },
        { source: '1', target: '3' }
      ]
    });

    const wrapper = await mountComponent();

    expect(wrapper.findAll('.tile-value').map((el) => el.text())).toEqual([
      '3',
      '2',
      '1.3',
      '0'
    ]);
    expect(wrapper.find('.ranking li').text()).toContain('Alice');
    expect(wrapper.find('.ranking li').text()).toContain('2 friends');
  });

  it('shows the error and retries on demand', async () => {
    getGraph
      .mockRejectedValueOnce({
        response: { data: { error: 'Database unavailable, please try again later' } }
      })
      .mockResolvedValueOnce({ nodes: [], links: [] });

    const wrapper = await mountComponent();
    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Database unavailable'
    );

    await wrapper.find('.load-error button').trigger('click');
    await flushPromises();

    expect(wrapper.findAll('.tile')).toHaveLength(4);
    expect(wrapper.find('.connected').exists()).toBe(false);
  });
});
