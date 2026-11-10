<template>
  <section class="common">
    <h1>Common friends</h1>
    <p class="hint">Pick two users to see the friends they share.</p>

    <LoadingState v-if="loadingUsers" message="Loading users..." />

    <div v-else-if="usersError" class="load-error" role="alert">
      <p>{{ usersError }}</p>
      <button type="button" class="secondary" @click="loadUsers">
        Try again
      </button>
    </div>

    <form v-else class="card picker" @submit.prevent="search">
      <div class="field">
        <label for="common-user-a">First user</label>
        <select id="common-user-a" v-model="userA" :disabled="searching">
          <option value="" disabled>Choose a user</option>
          <option v-for="user in sortedUsers" :key="user.id" :value="user.id">
            {{ user.name }} ({{ user.email }})
          </option>
        </select>
      </div>

      <div class="field">
        <label for="common-user-b">Second user</label>
        <select id="common-user-b" v-model="userB" :disabled="searching">
          <option value="" disabled>Choose a user</option>
          <option v-for="user in sortedUsers" :key="user.id" :value="user.id">
            {{ user.name }} ({{ user.email }})
          </option>
        </select>
      </div>

      <p v-if="formError" class="message--error" role="alert">
        {{ formError }}
      </p>

      <button type="submit" :disabled="searching">
        {{ searching ? 'Searching...' : 'Find common friends' }}
      </button>
    </form>

    <section
      v-if="result"
      class="card results"
      aria-labelledby="common-results-title"
      aria-live="polite"
    >
      <h2 id="common-results-title">
        {{ nameOf(result.a) }} and {{ nameOf(result.b) }}
        <span class="count">({{ result.friends.length }})</span>
      </h2>
      <p v-if="result.friends.length === 0" class="empty">
        No friends in common.
      </p>
      <ul v-else class="people">
        <li v-for="friend in sortedResult" :key="friend.id" class="person">
          <UserAvatar :id="friend.id" :name="friend.name" size="sm" />
          <RouterLink
            :to="{ name: 'user', params: { id: friend.id } }"
            class="person-link"
          >
            {{ friend.name }}
          </RouterLink>
        </li>
      </ul>
    </section>
  </section>
</template>

<script>
import LoadingState from '../components/LoadingState.vue';
import UserAvatar from '../components/UserAvatar.vue';
import {
  findCommonFriends,
  getErrorMessage,
  getUsers
} from '../services/api';

const byName = (a, b) => a.name.localeCompare(b.name);

export default {
  name: 'CommonFriendsView',
  components: { LoadingState, UserAvatar },
  data() {
    return {
      users: [],
      loadingUsers: false,
      usersError: '',
      userA: '',
      userB: '',
      searching: false,
      formError: '',
      result: null
    };
  },
  computed: {
    sortedUsers() {
      return [...this.users].sort(byName);
    },
    sortedResult() {
      return [...this.result.friends].sort(byName);
    }
  },
  mounted() {
    this.loadUsers();
  },
  methods: {
    nameOf(id) {
      return this.users.find((user) => user.id === id)?.name ?? 'Unknown user';
    },
    // ?a=<id>&b=<id> pre-selects the users (links from profiles, shared URLs).
    applyQuery() {
      const { a, b } = this.$route?.query ?? {};
      const exists = (id) => this.users.some((user) => user.id === id);

      if (exists(a)) {
        this.userA = a;
      }
      if (exists(b)) {
        this.userB = b;
      }
    },
    async loadUsers() {
      this.loadingUsers = true;
      this.usersError = '';

      try {
        this.users = await getUsers();
        this.applyQuery();
      } catch (err) {
        this.usersError = getErrorMessage(err);
      } finally {
        this.loadingUsers = false;
      }

      if (this.userA && this.userB) {
        await this.search();
      }
    },
    validate() {
      if (!this.userA || !this.userB) {
        return 'Choose two users';
      }
      if (this.userA === this.userB) {
        return 'Choose two different users';
      }
      return '';
    },
    async search() {
      this.formError = this.validate();

      if (this.formError) {
        return;
      }

      const a = this.userA;
      const b = this.userB;
      this.searching = true;

      try {
        const friends = await findCommonFriends(a, b);
        this.result = { a, b, friends };
        this.$router?.replace({ query: { a, b } });
      } catch (err) {
        this.result = null;
        this.formError = getErrorMessage(err);
      } finally {
        this.searching = false;
      }
    }
  }
};
</script>

<style scoped>
.common {
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

.card {
  display: grid;
  gap: 0.75rem;
}

.field {
  display: grid;
  gap: 0.25rem;
}

label {
  font-weight: 600;
  font-size: 0.9rem;
}

select {
  font: inherit;
  min-width: 0;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
}

button {
  justify-self: start;
}

.hint,
.count,
.empty {
  color: var(--color-muted);
}

.hint,
.empty {
  margin: 0;
}

.count {
  font-weight: normal;
}

.people {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.6rem;
}

.person {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

/* Both selects side by side on wide screens. */
@media (min-width: 700px) {
  .picker {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .picker > :not(.field) {
    grid-column: 1 / -1;
  }
}

.message--error,
.load-error {
  color: var(--color-error);
}

.message--error {
  margin: 0;
}
</style>
