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
            v-if="loaded"
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

        <p v-else-if="users.length === 0 && !searchTerm" class="empty">
          No users yet. Add the first one.
        </p>

        <p v-else-if="users.length === 0" class="empty">
          No users match "{{ searchTerm }}".
        </p>

        <template v-else>
          <ul class="user-grid" :aria-busy="String(loading)">
            <li v-for="user in users" :key="user.id">
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

          <button
            v-if="remaining > 0"
            type="button"
            class="secondary load-more"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? 'Loading...' : `Load more (${remaining} left)` }}
          </button>
        </template>
      </div>
    </div>
  </section>
</template>

<script>
import LoadingState from '../components/LoadingState.vue';
import UserAvatar from '../components/UserAvatar.vue';
import UserForm from '../components/UserForm.vue';
import { getErrorMessage, searchUsers } from '../services/api';

export const PAGE_SIZE = 24;
export const SEARCH_DELAY_MS = 300;

// Server-side search and pagination: the page never loads every user.
export default {
  name: 'UsersView',
  components: { LoadingState, UserAvatar, UserForm },
  data() {
    return {
      users: [],
      total: 0,
      query: '',
      loading: false,
      loadingMore: false,
      // After the first successful load, reloads keep the list on screen.
      loaded: false,
      error: '',
      timer: null,
      lastRequest: 0
    };
  },
  computed: {
    searchTerm() {
      return this.query.trim();
    },
    remaining() {
      return this.total - this.users.length;
    },
    countLabel() {
      return this.searchTerm ? `${this.total} found` : `${this.total}`;
    }
  },
  watch: {
    // Waits for a pause in typing before asking the backend.
    query() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.loadUsers(), SEARCH_DELAY_MS);
    }
  },
  mounted() {
    this.loadUsers();
  },
  beforeUnmount() {
    clearTimeout(this.timer);
  },
  methods: {
    // First page for the current search (also after creating a user).
    async loadUsers() {
      const request = ++this.lastRequest;
      this.loading = true;
      this.error = '';

      try {
        const { users, total } = await searchUsers({
          search: this.searchTerm,
          limit: PAGE_SIZE,
          offset: 0
        });
        // An older, slower answer must not replace a newer one.
        if (request !== this.lastRequest) {
          return;
        }
        Object.assign(this, { users, total, loaded: true });
      } catch (err) {
        if (request === this.lastRequest) {
          this.error = getErrorMessage(err);
        }
      } finally {
        if (request === this.lastRequest) {
          this.loading = false;
        }
      }
    },
    async loadMore() {
      const request = this.lastRequest;
      this.loadingMore = true;

      try {
        const { users, total } = await searchUsers({
          search: this.searchTerm,
          limit: PAGE_SIZE,
          offset: this.users.length
        });
        // The search changed meanwhile: this page belongs to the old one.
        if (request !== this.lastRequest) {
          return;
        }
        this.users = [...this.users, ...users];
        this.total = total;
      } catch (err) {
        this.error = getErrorMessage(err);
      } finally {
        this.loadingMore = false;
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

.load-more {
  justify-self: center;
}

.load-error {
  color: var(--color-error);
}

.empty {
  margin: 0;
  color: var(--color-muted);
}
</style>
