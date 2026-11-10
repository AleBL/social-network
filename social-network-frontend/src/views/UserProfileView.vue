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
      <button type="button" class="secondary" @click="load">Try again</button>
    </div>

    <template v-else-if="user">
      <header class="card profile-header">
        <UserAvatar :id="user.id" :name="user.name" size="lg" />
        <div class="profile-text">
          <h1>{{ user.name }}</h1>
          <p class="email">{{ user.email }}</p>
          <p class="profile-stats">
            {{ friends.length }} friends · {{ recommendations.length }}
            suggestions
          </p>
        </div>
        <RouterLink
          :to="{ name: 'common-friends', query: { a: user.id } }"
          class="button-link secondary compare"
        >
          Compare friends
        </RouterLink>
      </header>

      <p v-if="actionError" class="message message--error" role="alert">
        {{ actionError }}
      </p>
      <p v-if="actionMessage" class="message message--success" role="status">
        {{ actionMessage }}
      </p>

      <div class="profile-grid">
      <section class="card" aria-labelledby="friends-title">
        <h2 id="friends-title">
          Friends <span class="count">({{ friends.length }})</span>
        </h2>
        <p v-if="friends.length === 0" class="empty">No friends yet.</p>
        <ul v-else class="people">
          <li v-for="friend in sortedFriends" :key="friend.id" class="person">
            <UserAvatar :id="friend.id" :name="friend.name" size="sm" />
            <RouterLink :to="profileLink(friend)" class="person-link">{{
              friend.name
            }}</RouterLink>
          </li>
        </ul>
        <AddFriendForm
          :exclude-ids="excludeIds"
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
            v-for="person in visibleRecommendations"
            :key="person.id"
            class="recommendation"
          >
            <UserAvatar :id="person.id" :name="person.name" size="sm" />
            <div class="recommendation-info">
              <RouterLink :to="profileLink(person)" class="person-link">{{
                person.name
              }}</RouterLink>
              <span class="mutual">{{
                describeMutualFriends(person.mutualFriends)
              }}</span>
            </div>
            <button
              type="button"
              class="secondary"
              :disabled="adding !== null"
              @click="addFriend(person)"
            >
              {{ adding === person.id ? 'Adding...' : 'Add' }}
            </button>
          </li>
        </ul>
        <button
          v-if="hiddenRecommendations > 0"
          type="button"
          class="secondary show-all"
          @click="showAllRecommendations = true"
        >
          Show all {{ recommendations.length }}
        </button>
      </section>
      </div>
    </template>
  </section>
</template>

<script>
import AddFriendForm from '../components/AddFriendForm.vue';
import LoadingState from '../components/LoadingState.vue';
import UserAvatar from '../components/UserAvatar.vue';
import {
  createFriendship,
  getErrorMessage,
  getUser,
  listFriends,
  recommendFriends
} from '../services/api';
import { describeMutualFriends } from '../utils/mutualFriends';

const byName = (a, b) => a.name.localeCompare(b.name);

const RECOMMENDATIONS_PREVIEW = 6;

export default {
  name: 'UserProfileView',
  components: { AddFriendForm, LoadingState, UserAvatar },
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
      loading: false,
      notFound: false,
      error: '',
      adding: null,
      actionError: '',
      actionMessage: '',
      showAllRecommendations: false
    };
  },
  computed: {
    // The best matches first; the long tail stays behind "Show all".
    visibleRecommendations() {
      return this.showAllRecommendations
        ? this.recommendations
        : this.recommendations.slice(0, RECOMMENDATIONS_PREVIEW);
    },
    hiddenRecommendations() {
      return this.recommendations.length - this.visibleRecommendations.length;
    },
    sortedFriends() {
      return [...this.friends].sort(byName);
    },
    // Never offered in "Add a friend": this user and the current friends.
    excludeIds() {
      return [this.id, ...this.friends.map((friend) => friend.id)];
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
      this.showAllRecommendations = false;

      try {
        const [user, friends, recommendations] = await Promise.all([
          getUser(this.id),
          listFriends(this.id),
          recommendFriends(this.id)
        ]);
        Object.assign(this, { user, friends, recommendations });
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
    // friend: a recommendation or the user picked in "Add a friend".
    async addFriend(friend) {
      this.adding = friend.id;
      this.actionError = '';
      this.actionMessage = '';

      try {
        await createFriendship(this.id, friend.id);
        const [friends, recommendations] = await Promise.all([
          listFriends(this.id),
          recommendFriends(this.id)
        ]);
        this.friends = friends;
        this.recommendations = recommendations;
        this.actionMessage = `${friend.name} is now a friend`;
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

/* ".card." raises the specificity above the generic ".card { display: grid }"
   below, which was stacking the avatar, the text and a full-width button. */
.card.profile-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.25rem;
  padding: 1.25rem 1.5rem;
}

.profile-text {
  display: grid;
  gap: 0.2rem;
  flex: 1 1 14rem;
  min-width: 0;
}

.profile-stats {
  font-size: 0.9rem;
  font-weight: 500;
}

.profile-grid {
  display: grid;
  gap: 1rem;
  align-items: start;
}

@media (min-width: 900px) {
  .profile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.person {
  display: flex;
  align-items: center;
  gap: 0.6rem;
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
  flex: 1 1 10rem;
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
