import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import UsersView, { PAGE_SIZE } from '../UsersView.vue';
import { searchUsers } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  searchUsers: vi.fn()
}));

const page = (users, total = users.length) => ({ users, total });

const mountView = async () => {
  const wrapper = mount(UsersView, {
    global: { stubs: { UserForm: true, RouterLink: RouterLinkStub } }
  });
  await flushPromises();
  return wrapper;
};

const names = (wrapper) =>
  wrapper.findAll('.user-name').map((el) => el.text());

describe('UsersView', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads the first page from the backend, already sorted by name', async () => {
    searchUsers.mockResolvedValue(
      page([
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' }
      ])
    );

    const wrapper = await mountView();

    expect(searchUsers).toHaveBeenCalledWith({
      search: '',
      limit: PAGE_SIZE,
      offset: 0
    });
    expect(names(wrapper)).toEqual(['Alice', 'Bob']);
    expect(wrapper.find('.count').text()).toBe('(2)');
    expect(wrapper.find('.load-more').exists()).toBe(false);
  });

  it('shows the empty state', async () => {
    searchUsers.mockResolvedValue(page([]));

    const wrapper = await mountView();

    expect(wrapper.find('.empty').text()).toBe(
      'No users yet. Add the first one.'
    );
  });

  it('shows the error and retries on demand', async () => {
    searchUsers
      .mockRejectedValueOnce({
        response: { data: { error: 'Database unavailable, please try again later' } }
      })
      .mockResolvedValueOnce(page([{ id: '1', name: 'Alice', email: 'a@b.co' }]));

    const wrapper = await mountView();
    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Database unavailable, please try again later'
    );

    await wrapper.find('.load-error button').trigger('click');
    await flushPromises();

    expect(names(wrapper)).toEqual(['Alice']);
  });

  it('reloads the first page after a user is created', async () => {
    searchUsers
      .mockResolvedValueOnce(page([]))
      .mockResolvedValueOnce(page([{ id: '1', name: 'Alice', email: 'a@b.co' }]));

    const wrapper = await mountView();
    wrapper.findComponent({ name: 'UserForm' }).vm.$emit('created');
    await flushPromises();

    expect(searchUsers).toHaveBeenCalledTimes(2);
    expect(names(wrapper)).toEqual(['Alice']);
  });
});
