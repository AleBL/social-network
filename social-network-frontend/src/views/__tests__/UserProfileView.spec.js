import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import UserProfileView from '../UserProfileView.vue';
import {
  createFriendship,
  getUser,
  listFriends,
  recommendFriends
} from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  createFriendship: vi.fn(),
  getUser: vi.fn(),
  listFriends: vi.fn(),
  recommendFriends: vi.fn()
}));

const alice = { id: '1', name: 'Alice', email: 'alice@example.com' };
const bob = { id: '2', name: 'Bob', email: 'bob@example.com' };
const carol = { id: '3', name: 'Carol', email: 'carol@example.com' };
const dave = { id: '4', name: 'Dave', email: 'dave@example.com' };

const mountView = (id = '1') =>
  mount(UserProfileView, {
    props: { id },
    global: { stubs: { RouterLink: RouterLinkStub } }
  });

const texts = (wrapper, selector) =>
  wrapper.findAll(selector).map((el) => el.text());

describe('UserProfileView', () => {
  beforeEach(() => {
    getUser.mockResolvedValue(alice);
    listFriends.mockResolvedValue([carol, bob]);
    recommendFriends.mockResolvedValue([
      { ...dave, mutualFriends: [bob, carol] }
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the user, the friends sorted by name and the recommendations', async () => {
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('h1').text()).toBe('Alice');
    expect(texts(wrapper, '[aria-labelledby="friends-title"] .person')).toEqual([
      'Bob',
      'Carol'
    ]);
    expect(wrapper.find('.recommendation').text()).toContain('Dave');
  });

  it('explains each suggestion with the mutual friends', async () => {
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('.recommendation .mutual').text()).toBe(
      '2 mutual friends: Bob and Carol'
    );
  });

  it('keeps the backend ranking instead of sorting by name', async () => {
    const erin = { id: '5', name: 'Erin', email: 'erin@example.com' };
    const zoe = { id: '6', name: 'Zoe', email: 'zoe@example.com' };
    recommendFriends.mockResolvedValue([
      { ...zoe, mutualFriends: [bob, carol] },
      { ...erin, mutualFriends: [bob] }
    ]);

    const wrapper = mountView();
    await flushPromises();

    expect(
      wrapper.findAll('.recommendation-info a').map((link) => link.text())
    ).toEqual(['Zoe', 'Erin']);
  });

  it('excludes the user and the friends from "Add a friend"', async () => {
    const wrapper = mountView();
    await flushPromises();

    expect(
      wrapper.findComponent({ name: 'AddFriendForm' }).props('excludeIds')
    ).toEqual(['1', '3', '2']);
  });

  it('adds the user picked in "Add a friend"', async () => {
    createFriendship.mockResolvedValue();
    const wrapper = mountView();
    await flushPromises();

    await wrapper
      .findComponent({ name: 'AddFriendForm' })
      .vm.$emit('add', dave);
    await flushPromises();

    expect(createFriendship).toHaveBeenCalledWith('1', '4');
    expect(wrapper.find('[role="status"]').text()).toBe('Dave is now a friend');
  });

  it('adds a recommended friend and refreshes the lists', async () => {
    createFriendship.mockResolvedValue();
    const wrapper = mountView();
    await flushPromises();

    listFriends.mockResolvedValue([bob, carol, dave]);
    recommendFriends.mockResolvedValue([]);
    await wrapper.find('.recommendation button').trigger('click');
    await flushPromises();

    expect(createFriendship).toHaveBeenCalledWith('1', '4');
    expect(wrapper.find('[role="status"]').text()).toBe('Dave is now a friend');
    expect(texts(wrapper, '[aria-labelledby="friends-title"] .person')).toEqual([
      'Bob',
      'Carol',
      'Dave'
    ]);
    expect(wrapper.text()).toContain('No recommendations yet.');
  });

  it('shows the backend error when adding fails', async () => {
    createFriendship.mockRejectedValue({
      response: {
        status: 409,
        data: { error: 'Users 1 and 4 are already friends' }
      }
    });
    const wrapper = mountView();
    await flushPromises();

    await wrapper.find('.recommendation button').trigger('click');
    await flushPromises();

    expect(wrapper.find('.message--error').text()).toBe(
      'Users 1 and 4 are already friends'
    );
  });

  it('shows "User not found" for a 404', async () => {
    getUser.mockRejectedValue({ response: { status: 404, data: {} } });

    const wrapper = mountView('missing');
    await flushPromises();

    expect(wrapper.find('h1').text()).toBe('User not found');
  });

  it('shows other errors with a retry button', async () => {
    getUser
      .mockRejectedValueOnce({
        response: { status: 503, data: { error: 'Database unavailable' } }
      })
      .mockResolvedValueOnce(alice);

    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.find('.load-error').text()).toContain(
      'Database unavailable'
    );

    await wrapper.find('.load-error button').trigger('click');
    await flushPromises();

    expect(wrapper.find('h1').text()).toBe('Alice');
  });

  it('reloads when navigating to another profile', async () => {
    const wrapper = mountView('1');
    await flushPromises();

    getUser.mockResolvedValue(bob);
    await wrapper.setProps({ id: '2' });
    await flushPromises();

    expect(getUser).toHaveBeenLastCalledWith('2');
    expect(wrapper.find('h1').text()).toBe('Bob');
  });
});
