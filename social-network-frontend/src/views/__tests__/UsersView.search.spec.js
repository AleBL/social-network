import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import UsersView, { PAGE_SIZE, SEARCH_DELAY_MS } from '../UsersView.vue';
import { searchUsers } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  searchUsers: vi.fn()
}));

const user = (i) => ({
  id: String(i),
  name: `User ${String(i).padStart(2, '0')}`,
  email: `user${i}@example.com`
});

const mountView = async () => {
  const wrapper = mount(UsersView, {
    global: { stubs: { UserForm: true, RouterLink: RouterLinkStub } }
  });
  await flushPromises();
  return wrapper;
};

const names = (wrapper) =>
  wrapper.findAll('.user-name').map((el) => el.text());

describe('UsersView search and pagination', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('searches the backend after a pause in typing', async () => {
    searchUsers.mockResolvedValue({ users: [user(1)], total: 40 });
    const wrapper = await mountView();
    searchUsers.mockResolvedValue({
      users: [{ id: '9', name: 'Júlia Fernandes', email: 'julia@x.com' }],
      total: 1
    });

    await wrapper.find('.search').setValue('jul');
    await wrapper.find('.search').setValue('julia');
    expect(searchUsers).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(SEARCH_DELAY_MS);
    await flushPromises();

    expect(searchUsers).toHaveBeenCalledTimes(2);
    expect(searchUsers).toHaveBeenLastCalledWith({
      search: 'julia',
      limit: PAGE_SIZE,
      offset: 0
    });
    expect(names(wrapper)).toEqual(['Júlia Fernandes']);
    expect(wrapper.find('.count').text()).toBe('(1 found)');
  });

  it('explains when nothing matches', async () => {
    searchUsers.mockResolvedValue({ users: [user(1)], total: 1 });
    const wrapper = await mountView();
    searchUsers.mockResolvedValue({ users: [], total: 0 });

    await wrapper.find('.search').setValue('zzz');
    await vi.advanceTimersByTimeAsync(SEARCH_DELAY_MS);
    await flushPromises();

    expect(wrapper.find('.empty').text()).toBe('No users match "zzz".');
  });

  it('loads the next page and appends it', async () => {
    const firstPage = Array.from({ length: PAGE_SIZE }, (_, i) => user(i + 1));
    searchUsers.mockResolvedValueOnce({ users: firstPage, total: 30 });
    const wrapper = await mountView();

    expect(wrapper.find('.load-more').text()).toBe('Load more (6 left)');

    searchUsers.mockResolvedValueOnce({
      users: Array.from({ length: 6 }, (_, i) => user(PAGE_SIZE + i + 1)),
      total: 30
    });
    await wrapper.find('.load-more').trigger('click');
    await flushPromises();

    expect(searchUsers).toHaveBeenLastCalledWith({
      search: '',
      limit: PAGE_SIZE,
      offset: PAGE_SIZE
    });
    expect(names(wrapper)).toHaveLength(30);
    expect(wrapper.find('.load-more').exists()).toBe(false);
  });

  it('links every card to the profile', async () => {
    searchUsers.mockResolvedValue({ users: [user(7)], total: 1 });
    const wrapper = await mountView();

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({
      name: 'user',
      params: { id: '7' }
    });
  });
});
