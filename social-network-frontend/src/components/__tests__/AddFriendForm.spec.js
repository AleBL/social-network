import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AddFriendForm from '../AddFriendForm.vue';

const candidates = [
  { id: '2', name: 'Bob', email: 'bob@example.com' },
  { id: '3', name: 'Carol', email: 'carol@example.com' }
];

describe('AddFriendForm', () => {
  it('lists the candidates and keeps the button disabled until one is chosen', () => {
    const wrapper = mount(AddFriendForm, { props: { candidates } });

    const options = wrapper.findAll('option:not([disabled])');
    expect(options.map((option) => option.text())).toEqual([
      'Bob (bob@example.com)',
      'Carol (carol@example.com)'
    ]);
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('emits the chosen user id and resets the choice', async () => {
    const wrapper = mount(AddFriendForm, { props: { candidates } });

    await wrapper.find('select').setValue('3');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('add')).toEqual([['3']]);
    expect(wrapper.find('select').element.value).toBe('');
  });

  it('explains when there is nobody left to add', () => {
    const wrapper = mount(AddFriendForm, { props: { candidates: [] } });

    expect(wrapper.text()).toBe('Everyone is already a friend.');
    expect(wrapper.find('select').exists()).toBe(false);
  });
});
