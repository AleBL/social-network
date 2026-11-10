import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils';
import UsersView from '../UsersView.vue';
import { getUsers } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  getUsers: vi.fn()
}));

const mountView = async () => {
  const wrapper = mount(UsersView, {
    global: { stubs: { UserForm: true, RouterLink: RouterLinkStub } }
  });
  await flushPromises();
  return wrapper;
};

const names = (wrapper) =>
  wrapper.findAll('.user-name').map((el) => el.text());

describe('UsersView search', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('filters by name or email ignoring case and accents', async () => {
    getUsers.mockResolvedValue([
      { id: '1', name: 'Júlia Fernandes', email: 'julia@seed.example.com' },
      { id: '2', name: 'Bruno Cardoso', email: 'bruno@seed.example.com' },
      { id: '3', name: 'André Machado', email: 'andre@seed.example.com' }
    ]);
    const wrapper = await mountView();

    await wrapper.find('.search').setValue('JULIA');
    expect(names(wrapper)).toEqual(['Júlia Fernandes']);
    expect(wrapper.find('.count').text()).toBe('(1 of 3)');

    await wrapper.find('.search').setValue('andré');
    expect(names(wrapper)).toEqual(['André Machado']);

    await wrapper.find('.search').setValue('seed.example');
    expect(names(wrapper)).toHaveLength(3);
    expect(wrapper.find('.count').text()).toBe('(3 of 3)');
  });

  it('explains when nothing matches', async () => {
    getUsers.mockResolvedValue([
      { id: '1', name: 'Alice', email: 'alice@example.com' }
    ]);
    const wrapper = await mountView();

    await wrapper.find('.search').setValue('zzz');

    expect(wrapper.find('.empty').text()).toBe('No users match "zzz".');
  });

  it('links every card to the profile', async () => {
    getUsers.mockResolvedValue([
      { id: '7', name: 'Alice', email: 'alice@example.com' }
    ]);
    const wrapper = await mountView();

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({
      name: 'user',
      params: { id: '7' }
    });
  });
});
