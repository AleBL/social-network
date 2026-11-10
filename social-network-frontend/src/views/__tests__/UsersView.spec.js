import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import UsersView from '../UsersView.vue';
import { getUsers } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  getUsers: vi.fn()
}));

const mountView = () =>
  mount(UsersView, {
    global: { stubs: { UserForm: true, RouterLink: RouterLinkStub } }
  });

describe('UsersView', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists users sorted by name with the count', async () => {
    getUsers.mockResolvedValue([
      { id: '2', name: 'Bob', email: 'bob@example.com' },
      { id: '1', name: 'Alice', email: 'alice@example.com' }
    ]);

    const wrapper = mountView();
    await flushPromises();

    const names = wrapper.findAll('.user-name').map((el) => el.text());
    expect(names).toEqual(['Alice', 'Bob']);
    expect(wrapper.find('.count').text()).toBe('(2)');
  });

  it('shows the empty state', async () => {
    getUsers.mockResolvedValue([]);

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('.empty').exists()).toBe(true);
  });

  it('shows the error and retries on demand', async () => {
    getUsers
      .mockRejectedValueOnce({
        response: { data: { error: 'Database unavailable, please try again later' } }
      })
      .mockResolvedValueOnce([{ id: '1', name: 'Alice', email: 'a@b.co' }]);

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Database unavailable, please try again later'
    );

    await wrapper.find('.load-error button').trigger('click');
    await flushPromises();

    expect(getUsers).toHaveBeenCalledTimes(2);
    expect(wrapper.find('.user-name').text()).toBe('Alice');
  });

  it('reloads the list after a user is created', async () => {
    getUsers
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: '1', name: 'Alice', email: 'a@b.co' }]);

    const wrapper = mountView();
    await flushPromises();

    wrapper.findComponent({ name: 'UserForm' }).vm.$emit('created');
    await flushPromises();

    expect(getUsers).toHaveBeenCalledTimes(2);
    expect(wrapper.find('.user-name').text()).toBe('Alice');
  });
});
