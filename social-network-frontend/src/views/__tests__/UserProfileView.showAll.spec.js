import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import UserProfileView from '../UserProfileView.vue';
import {
  getUser,
  getUsers,
  listFriends,
  recommendFriends
} from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  getUser: vi.fn(),
  getUsers: vi.fn(),
  listFriends: vi.fn(),
  recommendFriends: vi.fn()
}));

const person = (i) => ({
  id: String(i),
  name: `Person ${String(i).padStart(2, '0')}`,
  email: `p${i}@example.com`,
  mutualFriends: [{ id: '0', name: 'Hub' }]
});

const mountView = async () => {
  const wrapper = mount(UserProfileView, {
    props: { id: '1' },
    global: { stubs: { RouterLink: RouterLinkStub } }
  });
  await flushPromises();
  return wrapper;
};

describe('UserProfileView recommendations preview', () => {
  beforeEach(() => {
    getUser.mockResolvedValue({ id: '1', name: 'Alice', email: 'a@b.co' });
    listFriends.mockResolvedValue([]);
    getUsers.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the 6 best suggestions and reveals the rest on demand', async () => {
    recommendFriends.mockResolvedValue(
      Array.from({ length: 15 }, (_, i) => person(i + 2))
    );
    const wrapper = await mountView();

    expect(wrapper.findAll('.recommendation')).toHaveLength(6);
    expect(wrapper.find('.show-all').text()).toBe('Show all 15');

    await wrapper.find('.show-all').trigger('click');

    expect(wrapper.findAll('.recommendation')).toHaveLength(15);
    expect(wrapper.find('.show-all').exists()).toBe(false);
  });

  it('hides the button when everything already fits', async () => {
    recommendFriends.mockResolvedValue([person(2), person(3)]);
    const wrapper = await mountView();

    expect(wrapper.findAll('.recommendation')).toHaveLength(2);
    expect(wrapper.find('.show-all').exists()).toBe(false);
  });
});
