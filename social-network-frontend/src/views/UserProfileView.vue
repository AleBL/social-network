<template>
  <section class="profile">
    <RouterLink :to="{ name: 'users' }" class="back">&larr; All users</RouterLink>

    <LoadingState v-if="loading && !user" message="Loading profile..." />

    <div v-else-if="notFound" class="not-found" role="alert">
      <h1>User not found</h1>
      <p>This user does not exist or was removed.</p>
    </div>

    <div v-else-if="error && !user" class="load-error" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="load">Try again</button>
    </div>

    <template v-else-if="user">
      <header>
        <h1>{{ user.name }}</h1>
        <p class="email">{{ user.email }}</p>
        <RouterLink
          :to="{ name: 'common-friends', query: { a: user.id } }"
          class="compare"
        >
          Compare friends with someone
        </RouterLink>
      </header>

      <p v-if="actionError" class="message message--error" role="alert">
        {{ actionError }}
      </p>
      <p v-if="actionMessage" class="message message--success" role="status">
        {{ actionMessage }}
      </p>

      <section class="card" aria-labelledby="friends-title">
        <h2 id="friends-title">
          Friends <span class="count">({{ friends.length }})</span>
        </h2>
        <p v-if="friends.length === 0" class="empty">No friends yet.</p>
        <ul v-else class="people">
          <li v-for="friend in sortedFriends" :key="friend.id">
            <RouterLink :to="profileLink(friend)">{{ friend.name }}</RouterLink>
          </li>
        </ul>
        <AddFriendForm
          :candidates="candidates"
          :disabled="adding !== null"
          @add="addFriend"
        />
      </section>

      <section class="card" aria-labelledby="recommendations-title">
        <h2 id="recommendations-title">People you may know</h2>
        <p class="hint">
          Friends of your friends, most mutual friends first.
        </p>
        <p v-if="recommendations.length === 0" class="empty">
          No recommendations yet.
        </p>
        <ul v-else class="people">
          <!-- Kept in the backend order: ranked by mutual friends. -->
          <li
            v-for="person in recommendations"
            :key="person.id"
            class="recommendation"
          >
            <div class="recommendation-info">
              <RouterLink :to="profileLink(person)">{{
                person.name
              }}</RouterLink>
              <span class="mutual">{{
                describeMutualFriends(person.mutualFriends)
              }}</span>
            </div>
            <button
              type="button"
              :disabled="adding !== null"
              @click="addFriend(person.id)"
            >
              {{ adding === person.id ? 'Adding...' : 'Add' }}
            </button>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>

<script>
import AddFriendForm from '../components/AddFriendForm.vue';
import LoadingState from '../components/LoadingState.vue';
import {
  createFriendship,
  getErrorMessage,
  getUser,
  getUsers,
  listFriends,
  recommendFriends
} from '../services/api';
import { describeMutualFriends } from '../utils/mutualFriends';

const byName = (a, b) => a.name.localeCompare(b.name);

export default {
  name: 'UserProfileView',
  components: { AddFriendForm, LoadingState },
  props: {
    // From the route (/users/:id) thanks to `props: true`.
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      user: null,
      friends: [],
      recommendations: [],
      allUsers: [],
      loading: false,
      notFound: false,
      error: '',
      adding: null,
      actionError: '',
      actionMessage: ''
    };
  },
  computed: {
    sortedFriends() {
      return [...this.friends].sort(byName);
    },
    // Everyone except this user and the current friends.
    candidates() {
      const friendIds = new Set(this.friends.map((friend) => friend.id));
      return this.allUsers
        .filter((other) => other.id !== this.id && !friendIds.has(other.id))
        .sort(byName);
    }
  },
  watch: {
    // Vue reuses this component when going from one profile to another.
    id() {
      this.load();
    }
  },
  mounted() {
    this.load();
  },
  methods: {
    describeMutualFriends,
    profileLink(person) {
      return { name: 'user', params: { id: person.id } };
    },
    async load() {
      this.loading = true;
      this.notFound = false;
      this.error = '';
      this.actionError = '';
      this.actionMessage = '';
      this.user = null;

      try {
        const [user, friends, recommendations, allUsers] = await Promise.all([
          getUser(this.id),
          listFriends(this.id),
          recommendFriends(this.id),
          getUsers()
        ]);
        Object.assign(this, { user, friends, recommendations, allUsers });
      } catch (err) {
        if (err?.response?.status === 404) {
          this.notFound = true;
        } else {
          this.error = getErrorMessage(err);
        }
      } finally {
        this.loading = false;
      }
    },
    async addFriend(friendId) {
      const friend = this.allUsers.find((other) => other.id === friendId);
      this.adding = friendId;
      this.actionError = '';
      this.actionMessage = '';

      try {
        await createFriendship(this.id, friendId);
        const [friends, recommendations] = await Promise.all([
          listFriends(this.id),
          recommendFriends(this.id)
        ]);
        this.friends = friends;
        this.recommendations = recommendations;
        this.actionMessage = `${friend ? friend.name : 'The user'} is now a friend`;
      } catch (err) {
        this.actionError = getErrorMessage(err);
      } finally {
        this.adding = null;
      }
    }
  }
};
</script>

<style scoped>
.profile {
  display: grid;
  gap: 1rem;
}

.back {
  justify-self: start;
}

h1,
h2,
header p {
  margin: 0;
}

h2 {
  font-size: 1.1rem;
}

.card {
  display: grid;
  gap: 0.75rem;
}

.email,
.count,
.hint,
.empty {
  color: var(--color-muted);
}

.count {
  font-weight: normal;
}

.hint,
.empty {
  margin: 0;
}

.people {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.recommendation {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.recommendation-info {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.mutual {
  font-size: 0.85rem;
  color: var(--color-muted);
}

.message {
  margin: 0;
}

.message--error,
.load-error {
  color: var(--color-error);
}

.message--success {
  color: var(--color-success);
}
</style>
