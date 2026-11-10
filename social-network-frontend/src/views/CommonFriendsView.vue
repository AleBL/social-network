<template>
  <section class="common">
    <header class="page-header">
      <h1>Common friends</h1>
      <p class="muted">Pick two people to see the friends they share.</p>
    </header>

    <LoadingState v-if="loadingQuery" message="Loading..." />

    <form v-else class="card picker-form" @submit.prevent="search">
      <UserPicker
        v-model="userA"
        label="First person"
        :exclude-ids="userB ? [userB.id] : []"
        :disabled="searching"
      />
      <UserPicker
        v-model="userB"
        label="Second person"
        :exclude-ids="userA ? [userA.id] : []"
        :disabled="searching"
      />

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
        {{ result.a.name }} and {{ result.b.name }}
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
import UserPicker from '../components/UserPicker.vue';
import {
  findCommonFriends,
  getErrorMessage,
  getUser
} from '../services/api';

const byName = (a, b) => a.name.localeCompare(b.name);

export default {
  name: 'CommonFriendsView',
  components: { LoadingState, UserAvatar, UserPicker },
  data() {
    return {
      userA: null,
      userB: null,
      loadingQuery: false,
      searching: false,
      formError: '',
      result: null
    };
  },
  computed: {
    sortedResult() {
      return [...this.result.friends].sort(byName);
    }
  },
  mounted() {
    this.applyQuery();
  },
  methods: {
    // ?a=<id>&b=<id> pre-selects the people (links from profiles, shared URLs)
    // and searches right away when both are there.
    async applyQuery() {
      const { a, b } = this.$route?.query ?? {};

      if (!a && !b) {
        return;
      }

      this.loadingQuery = true;
      // An unknown id (removed user) is simply left empty.
      const load = (id) => (id ? getUser(id).catch(() => null) : null);
      const [userA, userB] = await Promise.all([load(a), load(b)]);
      Object.assign(this, { userA, userB, loadingQuery: false });

      if (this.userA && this.userB) {
        await this.search();
      }
    },
    validate() {
      if (!this.userA || !this.userB) {
        return 'Choose two people';
      }
      if (this.userA.id === this.userB.id) {
        return 'Choose two different people';
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
        const friends = await findCommonFriends(a.id, b.id);
        this.result = { a, b, friends };
        this.$router?.replace({ query: { a: a.id, b: b.id } });
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

.page-header {
  display: grid;
  gap: 0.35rem;
}

h1,
h2,
.page-header p {
  margin: 0;
}

h2 {
  font-size: 1.1rem;
}

.card {
  display: grid;
  gap: 0.75rem;
}

button {
  justify-self: start;
}

.count,
.empty {
  color: var(--color-muted);
}

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

.message--error {
  margin: 0;
  color: var(--color-error);
}

/* Both pickers side by side on wide screens. */
@media (min-width: 700px) {
  .picker-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .picker-form > :not(.user-picker) {
    grid-column: 1 / -1;
  }
}
</style>
