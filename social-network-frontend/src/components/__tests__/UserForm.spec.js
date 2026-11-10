import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import UserForm from '../UserForm.vue';
import { createUser } from '../../services/api';

// Keeps the real getErrorMessage, mocks only the request.
vi.mock('../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  createUser: vi.fn()
}));

async function fillAndSubmit(wrapper, { name, email }) {
  await wrapper.find('#user-name').setValue(name);
  await wrapper.find('#user-email').setValue(email);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

describe('UserForm', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [{ name: '', email: 'a@b.co' }, 'Name is required'],
    [{ name: 'Alice', email: '' }, 'Email is required'],
    [{ name: 'Alice', email: 'not-an-email' }, 'Enter a valid email address']
  ])('blocks %j with "%s" before calling the API', async (input, message) => {
    const wrapper = mount(UserForm);

    await fillAndSubmit(wrapper, input);

    expect(wrapper.find('[role="alert"]').text()).toBe(message);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('creates the user, clears the form and emits created', async () => {
    createUser.mockResolvedValue();
    const wrapper = mount(UserForm);

    await fillAndSubmit(wrapper, { name: ' Alice ', email: ' a@b.co ' });

    expect(createUser).toHaveBeenCalledWith({ name: 'Alice', email: 'a@b.co' });
    expect(wrapper.emitted('created')).toHaveLength(1);
    expect(wrapper.find('[role="status"]').text()).toBe('Alice was added');
    expect(wrapper.find('#user-name').element.value).toBe('');
    expect(wrapper.find('#user-email').element.value).toBe('');
  });

  it('shows the backend error, e.g. a duplicate email (409)', async () => {
    createUser.mockRejectedValue({
      response: {
        status: 409,
        data: { status: 'error', error: 'User with email a@b.co already exists' }
      }
    });
    const wrapper = mount(UserForm);

    await fillAndSubmit(wrapper, { name: 'Alice', email: 'a@b.co' });

    expect(wrapper.find('[role="alert"]').text()).toBe(
      'User with email a@b.co already exists'
    );
    expect(wrapper.emitted('created')).toBeUndefined();
    // Keeps what the user typed so it can be fixed.
    expect(wrapper.find('#user-email').element.value).toBe('a@b.co');
  });

  it('disables the form while saving', async () => {
    createUser.mockReturnValue(new Promise(() => {}));
    const wrapper = mount(UserForm);

    await wrapper.find('#user-name').setValue('Alice');
    await wrapper.find('#user-email').setValue('a@b.co');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    expect(wrapper.find('button').text()).toBe('Saving...');
  });
});
