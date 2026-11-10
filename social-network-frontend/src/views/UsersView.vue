<template>
  <section class="users">
    <header class="page-header">
      <h1>Users</h1>
      <p class="muted">
        Everyone in the network. Open a profile to see friends and suggestions.
      </p>
    </header>

    <div class="layout">
      <aside class="aside">
        <UserForm @created="loadUsers" />
      </aside>

      <div class="list">
        <div class="list-header">
          <h2>
            All users
            <span v-if="loaded && !error" class="count">({{ countLabel }})</span>
          </h2>
          <input
            v-if="loaded && users.length > 0"
            v-model="query"
            type="search"
            class="search"
            placeholder="Search by name or email"
            aria-label="Search users"
          />
        </div>

        <LoadingState v-if="loading && !loaded" message="Loading users..." />

        <div v-else-if="error" class="load-error" role="alert">
          <p>{{ error }}</p>
          <button type="button" class="secondary" @click="loadUsers">
            Try again
          </button>
        </div>

        <p v-else-if="users.length === 0" class="empty">
          No users yet. Add the first one.
        </p>

        <p v-else-if="filteredUsers.length === 0" class="empty">
          No users match "{{ query }}".
        </p>

        <ul v-else class="user-grid">
          <li v-for="user in filteredUsers" :key="user.id">
            <RouterLink
              :to="{ name: 'user', params: { id: user.id } }"
              class="card user-card"
            >
              <UserAvatar :id="user.id" :name="user.name" />
              <span class="user-text">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-email">{{ user.email }}</span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
import LoadingState from '../components/LoadingState.vue';
import UserAvatar from '../components/UserAvatar.vue';
import UserForm from '../components/UserForm.vue';
import { getErrorMessage, getUsers } from '../services/api';

// "Júlia" matches "julia": case and accents are ignored when searching.
const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export default {
  name: 'UsersView',
  components: { LoadingState, UserAvatar, UserForm },
  data() {
    return {
      users: [],
      loading: false,
      // After the first successful load, reloads keep the list on screen.
      loaded: false,
      error: '',
      query: ''
    };
  },
  computed: {
    sortedUsers() {
      return [...this.users].sort((a, b) => a.name.localeCompare(b.name));
    },
    filteredUsers() {
      const query = normalize(this.query.trim());

      if (!query) {
        return this.sortedUsers;
      }
      return this.sortedUsers.filter((user) =>
        normalize(`${user.name} ${user.email}`).includes(query)
      );
    },
    countLabel() {
      return this.query.trim()
        ? `${this.filteredUsers.length} of ${this.users.length}`
        : `${this.users.length}`;
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
  gap: 1.5rem;
}

.page-header h1,
.page-header p {
  margin: 0;
}

.page-header {
  display: grid;
  gap: 0.35rem;
}

.layout {
  display: grid;
  gap: 1.5rem;
  align-items: start;
}

@media (min-width: 900px) {
  .layout {
    grid-template-columns: 20rem minmax(0, 1fr);
  }

  .aside {
    position: sticky;
    top: 5rem;
  }
}

.list {
  display: grid;
  gap: 1rem;
}

.list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.list-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.search {
  flex: 1 1 16rem;
  max-width: 22rem;
}

.count {
  color: var(--color-muted);
  font-weight: normal;
}

.user-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 0.75rem;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: 100%;
  padding: 0.8rem 1rem;
  color: var(--color-text);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.user-card:hover {
  text-decoration: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.user-text {
  display: grid;
  min-width: 0;
}

.user-name {
  font-weight: 600;
}

.user-email {
  font-size: 0.85rem;
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.load-error {
  color: var(--color-error);
}

.empty {
  margin: 0;
  color: var(--color-muted);
}
</style>
