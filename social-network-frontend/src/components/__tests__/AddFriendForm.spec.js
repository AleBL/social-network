import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AddFriendForm from '../AddFriendForm.vue';

const bob = { id: '2', name: 'Bob', email: 'bob@example.com' };

const mountForm = (props = {}) =>
  mount(AddFriendForm, {
    props,
    global: { stubs: { UserPicker: true } }
  });

const picker = (wrapper) => wrapper.findComponent({ name: 'UserPicker' });

describe('AddFriendForm', () => {
  it('passes the users to exclude to the picker', () => {
    const wrapper = mountForm({ excludeIds: ['1', '3'] });

    expect(picker(wrapper).props('excludeIds')).toEqual(['1', '3']);
  });

  it('keeps the button disabled until someone is chosen', async () => {
    const wrapper = mountForm();
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();

    await picker(wrapper).vm.$emit('update:modelValue', bob);

    expect(wrapper.find('button').attributes('disabled')).toBeUndefined();
  });

  it('emits the chosen user and resets the choice', async () => {
    const wrapper = mountForm();
    await picker(wrapper).vm.$emit('update:modelValue', bob);

    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('add')).toEqual([[bob]]);
    expect(picker(wrapper).props('modelValue')).toBeNull();
  });
});
