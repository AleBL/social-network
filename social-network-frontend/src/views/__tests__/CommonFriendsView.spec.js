import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import CommonFriendsView from '../CommonFriendsView.vue';
import { findCommonFriends, getUsers } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  findCommonFriends: vi.fn(),
  getUsers: vi.fn()
}));

const alice = { id: '1', name: 'Alice', email: 'alice@example.com' };
const bob = { id: '2', name: 'Bob', email: 'bob@example.com' };
const carol = { id: '3', name: 'Carol', email: 'carol@example.com' };
const dave = { id: '4', name: 'Dave', email: 'dave@example.com' };

let router;

const mountView = (query = {}) =>
  mount(CommonFriendsView, {
    global: {
      stubs: { RouterLink: RouterLinkStub },
      mocks: { $route: { query }, $router: router }
    }
  });

async function pick(wrapper, a, b) {
  await wrapper.find('#common-user-a').setValue(a);
  await wrapper.find('#common-user-b').setValue(b);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

describe('CommonFriendsView', () => {
  beforeEach(() => {
    router = { replace: vi.fn() };
    getUsers.mockResolvedValue([bob, alice, carol, dave]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('offers every user, sorted by name, in both selects', async () => {
    const wrapper = mountView();
    await flushPromises();

    const options = wrapper
      .findAll('#common-user-a option:not([disabled])')
      .map((option) => option.text());
    expect(options).toEqual([
      'Alice (alice@example.com)',
      'Bob (bob@example.com)',
      'Carol (carol@example.com)',
      'Dave (dave@example.com)'
    ]);
  });

  it.each([
    ['', '', 'Choose two users'],
    ['1', '1', 'Choose two different users']
  ])('validates (%j, %j) with "%s"', async (a, b, message) => {
    const wrapper = mountView();
    await flushPromises();

    if (a) {
      await wrapper.find('#common-user-a').setValue(a);
      await wrapper.find('#common-user-b').setValue(b);
    }
    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('[role="alert"]').text()).toBe(message);
    expect(findCommonFriends).not.toHaveBeenCalled();
  });

  it('shows the common friends and keeps them in the URL', async () => {
    findCommonFriends.mockResolvedValue([dave, alice]);
    const wrapper = mountView();
    await flushPromises();

    await pick(wrapper, '2', '3');

    expect(findCommonFriends).toHaveBeenCalledWith('2', '3');
    expect(wrapper.find('#common-results-title').text()).toBe(
      'Bob and Carol (2)'
    );
    expect(wrapper.findAll('.people li').map((li) => li.text())).toEqual([
      'Alice',
      'Dave'
    ]);
    expect(router.replace).toHaveBeenCalledWith({ query: { a: '2', b: '3' } });
  });

  it('says when there are no friends in common', async () => {
    findCommonFriends.mockResolvedValue([]);
    const wrapper = mountView();
    await flushPromises();

    await pick(wrapper, '1', '4');

    expect(wrapper.find('.empty').text()).toBe('No friends in common.');
  });

  it('shows the backend error', async () => {
    findCommonFriends.mockRejectedValue({
      response: { status: 404, data: { error: 'User with id 4 not found' } }
    });
    const wrapper = mountView();
    await flushPromises();

    await pick(wrapper, '1', '4');

    expect(wrapper.find('[role="alert"]').text()).toBe(
      'User with id 4 not found'
    );
    expect(wrapper.find('.results').exists()).toBe(false);
  });

  it('searches right away when both users come in the URL', async () => {
    findCommonFriends.mockResolvedValue([alice]);

    const wrapper = mountView({ a: '2', b: '3' });
    await flushPromises();

    expect(findCommonFriends).toHaveBeenCalledWith('2', '3');
    expect(wrapper.find('.people li').text()).toBe('Alice');
  });

  it('pre-selects only the first user from a profile link', async () => {
    const wrapper = mountView({ a: '1' });
    await flushPromises();

    expect(wrapper.find('#common-user-a').element.value).toBe('1');
    expect(wrapper.find('#common-user-b').element.value).toBe('');
    expect(findCommonFriends).not.toHaveBeenCalled();
  });
});
