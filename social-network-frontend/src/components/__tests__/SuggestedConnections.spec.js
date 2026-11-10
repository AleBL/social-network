import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import SuggestedConnections from '../SuggestedConnections.vue';
import {
  createFriendship,
  getSuggestedConnections
} from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  createFriendship: vi.fn(),
  getSuggestedConnections: vi.fn()
}));

const bob = { id: '2', name: 'Bob' };
const carol = { id: '3', name: 'Carol' };
const alice = { id: '1', name: 'Alice' };
const dave = { id: '4', name: 'Dave' };

const suggestions = [
  { a: bob, b: carol, mutualFriends: [alice, dave] },
  { a: alice, b: dave, mutualFriends: [bob] }
];

const mountComponent = () =>
  mount(SuggestedConnections, {
    global: { stubs: { RouterLink: RouterLinkStub } }
  });

describe('SuggestedConnections', () => {
  beforeEach(() => {
    getSuggestedConnections.mockResolvedValue(suggestions);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists the pairs in the ranking order with their mutual friends', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    expect(getSuggestedConnections).toHaveBeenCalledWith(6);
    const pairs = wrapper.findAll('.pair');
    expect(pairs.map((pair) => pair.find('.pair-names').text())).toEqual([
      'Bob and Carol',
      'Alice and Dave'
    ]);
    expect(pairs[0].find('.mutual').text()).toBe(
      '2 mutual friends: Alice and Dave'
    );
  });

  it('links both people to their profiles', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    const links = wrapper.findAllComponents(RouterLinkStub);
    expect(links[0].props('to')).toEqual({
      name: 'user',
      params: { id: '2' }
    });
    expect(links[1].props('to')).toEqual({
      name: 'user',
      params: { id: '3' }
    });
  });

  it('connects a pair and refreshes the ranking', async () => {
    createFriendship.mockResolvedValue();
    const wrapper = mountComponent();
    await flushPromises();

    getSuggestedConnections.mockResolvedValue([suggestions[1]]);
    await wrapper.find('.pair button').trigger('click');
    await flushPromises();

    expect(createFriendship).toHaveBeenCalledWith('2', '3');
    expect(wrapper.find('[role="status"]').text()).toBe(
      'Bob and Carol are now friends'
    );
    expect(wrapper.findAll('.pair')).toHaveLength(1);
  });

  it('shows the backend error when connecting fails', async () => {
    createFriendship.mockRejectedValue({
      response: { status: 409, data: { error: 'Users 2 and 3 are already friends' } }
    });
    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.find('.pair button').trigger('click');
    await flushPromises();

    expect(wrapper.find('.message--error').text()).toBe(
      'Users 2 and 3 are already friends'
    );
  });

  it('shows the empty state', async () => {
    getSuggestedConnections.mockResolvedValue([]);

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('.empty').text()).toBe('No suggestions right now.');
  });

  it('shows the error and retries on demand', async () => {
    getSuggestedConnections
      .mockRejectedValueOnce({
        response: { data: { error: 'Database unavailable, please try again later' } }
      })
      .mockResolvedValueOnce(suggestions);

    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.find('.load-error').text()).toContain('Database unavailable');

    await wrapper.find('.load-error button').trigger('click');
    await flushPromises();

    expect(wrapper.findAll('.pair')).toHaveLength(2);
  });
});
