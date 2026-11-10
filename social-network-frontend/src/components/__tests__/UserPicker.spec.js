import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import UserPicker, { RESULTS_LIMIT, SEARCH_DELAY_MS } from '../UserPicker.vue';
import { searchUsers } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  searchUsers: vi.fn()
}));

const alice = { id: '1', name: 'Alice', email: 'alice@example.com' };
const bob = { id: '2', name: 'Bob', email: 'bob@example.com' };
const carol = { id: '3', name: 'Carol', email: 'carol@example.com' };

const mountPicker = (props = {}) =>
  mount(UserPicker, { props: { label: 'Add a friend', ...props } });

async function type(wrapper, text) {
  await wrapper.find('input').setValue(text);
  await vi.advanceTimersByTimeAsync(SEARCH_DELAY_MS);
  await flushPromises();
}

const optionNames = (wrapper) =>
  wrapper.findAll('[role="option"] .person-name').map((el) => el.text());

describe('UserPicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    searchUsers.mockResolvedValue({ users: [alice, bob, carol], total: 3 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('searches the backend after a short pause, not on every key', async () => {
    const wrapper = mountPicker();

    await wrapper.find('input').setValue('a');
    await wrapper.find('input').setValue('al');
    expect(searchUsers).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(SEARCH_DELAY_MS);
    await flushPromises();

    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(searchUsers).toHaveBeenCalledWith({
      search: 'al',
      limit: RESULTS_LIMIT
    });
    expect(optionNames(wrapper)).toEqual(['Alice', 'Bob', 'Carol']);
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('true');
  });

  it('never offers excluded users and asks for extra results to make up for them', async () => {
    const wrapper = mountPicker({ excludeIds: ['1', '3'] });

    await type(wrapper, 'x');

    expect(searchUsers).toHaveBeenCalledWith({
      search: 'x',
      limit: RESULTS_LIMIT + 2
    });
    expect(optionNames(wrapper)).toEqual(['Bob']);
  });

  it('selects with the keyboard', async () => {
    const wrapper = mountPicker();
    await type(wrapper, 'a');
    const input = wrapper.find('input');

    await input.trigger('keydown', { key: 'ArrowDown' });
    expect(input.attributes('aria-activedescendant')).toBe(
      wrapper.findAll('[role="option"]')[1].attributes('id')
    );
    await input.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:modelValue')).toEqual([[bob]]);
  });

  it('selects with the mouse', async () => {
    const wrapper = mountPicker();
    await type(wrapper, 'a');

    await wrapper.findAll('[role="option"]')[2].trigger('mousedown');

    expect(wrapper.emitted('update:modelValue')).toEqual([[carol]]);
  });

  it('says when nothing matches and shows request errors', async () => {
    searchUsers.mockResolvedValueOnce({ users: [], total: 0 });
    const wrapper = mountPicker();

    await type(wrapper, 'zzz');
    expect(wrapper.find('.status').text()).toBe('No users found');

    searchUsers.mockRejectedValueOnce({
      response: { data: { error: 'Too many requests, please try again later' } }
    });
    await type(wrapper, 'zz');
    expect(wrapper.find('.status--error').text()).toBe(
      'Too many requests, please try again later'
    );
  });

  it('ignores an older answer that arrives after a newer one', async () => {
    let resolveSlow;
    searchUsers
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveSlow = resolve))
      )
      .mockResolvedValueOnce({ users: [carol], total: 1 });
    const wrapper = mountPicker();

    await type(wrapper, 'a');
    await type(wrapper, 'ca');
    resolveSlow({ users: [alice, bob], total: 2 });
    await flushPromises();

    expect(optionNames(wrapper)).toEqual(['Carol']);
  });

  it('shows the chosen user and lets it be changed', async () => {
    const wrapper = mountPicker({ modelValue: alice });

    expect(wrapper.find('.picked .person-name').text()).toBe('Alice');
    expect(wrapper.find('input').exists()).toBe(false);

    await wrapper.find('.change').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]]);
  });
});
