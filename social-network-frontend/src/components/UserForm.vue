<template>
  <form class="user-form card" novalidate @submit.prevent="submit">
    <h2>Add a user</h2>

    <div class="field">
      <label for="user-name">Name</label>
      <input
        id="user-name"
        v-model="name"
        type="text"
        autocomplete="name"
        :maxlength="nameMaxLength"
        :disabled="submitting"
        required
      />
    </div>

    <div class="field">
      <label for="user-email">Email</label>
      <input
        id="user-email"
        v-model="email"
        type="email"
        autocomplete="email"
        :disabled="submitting"
        required
      />
    </div>

    <p v-if="error" class="form-message form-message--error" role="alert">
      {{ error }}
    </p>
    <p
      v-if="success"
      class="form-message form-message--success"
      role="status"
    >
      {{ success }}
    </p>

    <button type="submit" :disabled="submitting">
      {{ submitting ? 'Saving...' : 'Add user' }}
    </button>
  </form>
</template>

<script>
import { createUser, getErrorMessage } from '../services/api';

// Mirrors the backend rules for quick feedback; the backend stays the source of truth.
export const NAME_MAX_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  name: 'UserForm',
  emits: ['created'],
  data() {
    return {
      name: '',
      email: '',
      error: '',
      success: '',
      submitting: false,
      nameMaxLength: NAME_MAX_LENGTH
    };
  },
  methods: {
    validate() {
      const name = this.name.trim();
      const email = this.email.trim();

      if (!name) {
        return 'Name is required';
      }
      if (name.length > NAME_MAX_LENGTH) {
        return `Name must be at most ${NAME_MAX_LENGTH} characters`;
      }
      if (!email) {
        return 'Email is required';
      }
      if (!EMAIL_PATTERN.test(email)) {
        return 'Enter a valid email address';
      }
      return '';
    },
    async submit() {
      this.success = '';
      this.error = this.validate();

      if (this.error) {
        return;
      }

      this.submitting = true;

      try {
        const name = this.name.trim();
        await createUser({ name, email: this.email.trim() });
        this.success = `${name} was added`;
        this.name = '';
        this.email = '';
        this.$emit('created');
      } catch (err) {
        this.error = getErrorMessage(err);
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.user-form {
  display: grid;
  gap: 0.75rem;
}

.user-form h2 {
  margin: 0;
  font-size: 1.1rem;
}

.field {
  display: grid;
  gap: 0.25rem;
}

label {
  font-weight: 600;
  font-size: 0.9rem;
}

.form-message {
  margin: 0;
  font-size: 0.9rem;
}

.form-message--error {
  color: var(--color-error);
}

.form-message--success {
  color: var(--color-success);
}

button {
  justify-self: start;
}
</style>
