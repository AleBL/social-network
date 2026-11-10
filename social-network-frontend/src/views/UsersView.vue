<template>
  <section class="users">
    <h1>Users</h1>

    <UserForm @created="loadUsers" />

    <h2>
      All users
      <span v-if="loaded && !error" class="count">({{ users.length }})</span>
    </h2>

    <LoadingState v-if="loading && !loaded" message="Loading users..." />

    <div v-else-if="error" class="load-error" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="loadUsers">Try again</button>
    </div>

    <p v-else-if="users.length === 0" class="empty">
      No users yet. Add the first one above.
    </p>

    <ul v-else class="user-list">
      <li v-for="user in sortedUsers" :key="user.id" class="card">
        <span class="user-name">{{ user.name }}</span>
        <span class="user-email">{{ user.email }}</span>
      </li>
    </ul>
  </section>
</template>

<script>
import LoadingState from '../components/LoadingState.vue';
import UserForm from '../components/UserForm.vue';
import { getErrorMessage, getUsers } from '../services/api';

export default {
  name: 'UsersView',
  components: { LoadingState, UserForm },
  data() {
    return {
      users: [],
      loading: false,
      // After the first successful load, reloads keep the list on screen.
      loaded: false,
      error: ''
    };
  },
  computed: {
    sortedUsers() {
      return [...this.users].sort((a, b) => a.name.localeCompare(b.name));
    }
  },
  mounted() {
    this.loadUsers();
  },
  methods: {
    async loadUsers() {
      this.loading = true;
      this.error = '';

      try {
        this.users = await getUsers();
        this.loaded = true;
      } catch (err) {
        this.error = getErrorMessage(err);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.users {
  display: grid;
  gap: 1rem;
}

h1,
h2 {
  margin: 0;
}

h2 {
  font-size: 1.1rem;
}

.count {
  color: var(--color-muted);
  font-weight: normal;
}

.user-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.user-list li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
}

.user-name {
  font-weight: 600;
}

.user-email {
  color: var(--color-muted);
  overflow-wrap: anywhere;
}

.load-error {
  color: var(--color-error);
}

.empty {
  color: var(--color-muted);
}
</style>
