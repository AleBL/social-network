import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import CommonFriendsView from '../CommonFriendsView.vue';
import { findCommonFriends, getUser } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  findCommonFriends: vi.fn(),
  getUser: vi.fn()
}));

const alice = { id: '1', name: 'Alice', email: 'alice@example.com' };
const bob = { id: '2', name: 'Bob', email: 'bob@example.com' };
const carol = { id: '3', name: 'Carol', email: 'carol@example.com' };
const dave = { id: '4', name: 'Dave', email: 'dave@example.com' };

let router;

const mountView = async (query = {}) => {
  const wrapper = mount(CommonFriendsView, {
    global: {
      stubs: { RouterLink: RouterLinkStub, UserPicker: true },
      mocks: { $route: { query }, $router: router }
    }
  });
  await flushPromises();
  return wrapper;
};

const pickers = (wrapper) => wrapper.findAllComponents({ name: 'UserPicker' });

async function pick(wrapper, a, b) {
  const [first, second] = pickers(wrapper);
  await first.vm.$emit('update:modelValue', a);
  await second.vm.$emit('update:modelValue', b);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

describe('CommonFriendsView', () => {
  beforeEach(() => {
    router = { replace: vi.fn() };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('asks for two people before searching', async () => {
    const wrapper = await mountView();

    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('[role="alert"]').text()).toBe('Choose two people');
    expect(findCommonFriends).not.toHaveBeenCalled();
  });

  it('keeps each picker from offering the person chosen in the other', async () => {
    const wrapper = await mountView();

    await pickers(wrapper)[0].vm.$emit('update:modelValue', bob);

    expect(pickers(wrapper)[1].props('excludeIds')).toEqual(['2']);
    expect(pickers(wrapper)[0].props('excludeIds')).toEqual([]);
  });

  it('shows the common friends and keeps them in the URL', async () => {
    findCommonFriends.mockResolvedValue([dave, alice]);
    const wrapper = await mountView();

    await pick(wrapper, bob, carol);

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
    const wrapper = await mountView();

    await pick(wrapper, alice, dave);

    expect(wrapper.find('.empty').text()).toBe('No friends in common.');
  });

  it('shows the backend error', async () => {
    findCommonFriends.mockRejectedValue({
      response: { status: 404, data: { error: 'User with id 4 not found' } }
    });
    const wrapper = await mountView();

    await pick(wrapper, alice, dave);

    expect(wrapper.find('[role="alert"]').text()).toBe(
      'User with id 4 not found'
    );
    expect(wrapper.find('.results').exists()).toBe(false);
  });

  it('loads both people from the URL and searches right away', async () => {
    getUser.mockImplementation(async (id) => ({ 2: bob, 3: carol })[id]);
    findCommonFriends.mockResolvedValue([alice]);

    const wrapper = await mountView({ a: '2', b: '3' });

    expect(getUser).toHaveBeenCalledWith('2');
    expect(getUser).toHaveBeenCalledWith('3');
    expect(findCommonFriends).toHaveBeenCalledWith('2', '3');
    expect(wrapper.find('.people li').text()).toBe('Alice');
  });

  it('pre-selects only the first person from a profile link', async () => {
    getUser.mockResolvedValue(alice);

    const wrapper = await mountView({ a: '1' });

    expect(pickers(wrapper)[0].props('modelValue')).toEqual(alice);
    expect(pickers(wrapper)[1].props('modelValue')).toBeNull();
    expect(findCommonFriends).not.toHaveBeenCalled();
  });

  it('leaves a removed user from the URL empty', async () => {
    getUser.mockRejectedValue({ response: { status: 404 } });

    const wrapper = await mountView({ a: 'gone' });

    expect(pickers(wrapper)[0].props('modelValue')).toBeNull();
  });
});
