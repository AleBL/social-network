<template>
  <section class="card suggestions" aria-labelledby="suggestions-title">
    <h2 id="suggestions-title">Suggested connections</h2>
    <p class="hint">
      People who are not friends yet but have friends in common.
    </p>

    <LoadingState v-if="loading" message="Looking for suggestions..." />

    <div v-else-if="error" class="load-error" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="secondary" @click="load">Try again</button>
    </div>

    <p v-else-if="suggestions.length === 0" class="empty">
      No suggestions right now.
    </p>

    <template v-else>
      <p v-if="actionError" class="message message--error" role="alert">
        {{ actionError }}
      </p>
      <p v-if="actionMessage" class="message message--success" role="status">
        {{ actionMessage }}
      </p>

      <ul class="pairs">
        <li
          v-for="suggestion in suggestions"
          :key="pairKey(suggestion)"
          class="pair"
        >
          <div class="pair-main">
            <span class="avatars">
              <UserAvatar
                :id="suggestion.a.id"
                :name="suggestion.a.name"
                size="sm"
              />
              <UserAvatar
                :id="suggestion.b.id"
                :name="suggestion.b.name"
                size="sm"
              />
            </span>
            <div class="pair-info">
              <span class="pair-names">
                <RouterLink
                  :to="profileLink(suggestion.a)"
                  class="person-link"
                  >{{ suggestion.a.name }}</RouterLink
                >
                and
                <RouterLink
                  :to="profileLink(suggestion.b)"
                  class="person-link"
                  >{{ suggestion.b.name }}</RouterLink
                >
              </span>
              <span class="mutual">{{
                describeMutualFriends(suggestion.mutualFriends)
              }}</span>
            </div>
          </div>
          <button
            type="button"
            class="secondary"
            :disabled="connecting !== null"
            @click="connect(suggestion)"
          >
            {{ connecting === pairKey(suggestion) ? 'Connecting...' : 'Connect' }}
          </button>
        </li>
      </ul>
    </template>
  </section>
</template>

<script>
import LoadingState from './LoadingState.vue';
import UserAvatar from './UserAvatar.vue';
import {
  createFriendship,
  getErrorMessage,
  getSuggestedConnections
} from '../services/api';
import { describeMutualFriends } from '../utils/mutualFriends';

export default {
  name: 'SuggestedConnections',
  components: { LoadingState, UserAvatar },
  props: {
    limit: {
      type: Number,
      default: 6
    }
  },
  data() {
    return {
      suggestions: [],
      loading: false,
      error: '',
      connecting: null,
      actionError: '',
      actionMessage: ''
    };
  },
  mounted() {
    this.load();
  },
  methods: {
    describeMutualFriends,
    pairKey({ a, b }) {
      return `${a.id}-${b.id}`;
    },
    profileLink(person) {
      return { name: 'user', params: { id: person.id } };
    },
    async load() {
      this.loading = true;
      this.error = '';

      try {
        this.suggestions = await getSuggestedConnections(this.limit);
      } catch (err) {
        this.error = getErrorMessage(err);
      } finally {
        this.loading = false;
      }
    },
    async connect(suggestion) {
      this.connecting = this.pairKey(suggestion);
      this.actionError = '';
      this.actionMessage = '';

      try {
        await createFriendship(suggestion.a.id, suggestion.b.id);
        // The new friendship changes the whole ranking: fetch it again.
        this.suggestions = await getSuggestedConnections(this.limit);
        this.actionMessage = `${suggestion.a.name} and ${suggestion.b.name} are now friends`;
      } catch (err) {
        this.actionError = getErrorMessage(err);
      } finally {
        this.connecting = null;
      }
    }
  }
};
</script>

<style scoped>
.suggestions {
  display: grid;
  gap: 0.75rem;
  text-align: left;
}

h2 {
  margin: 0;
  font-size: 1.1rem;
}

.hint,
.empty,
.message {
  margin: 0;
}

.hint,
.empty,
.mutual {
  color: var(--color-muted);
}

.pairs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.pair {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.pair-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

/* Two overlapping avatars, like a "connection" between them. */
.avatars {
  display: inline-flex;
  flex: none;
}

.avatars > :last-child {
  margin-left: -0.6rem;
  box-shadow: 0 0 0 2px var(--color-surface);
}

.pair-info {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.mutual {
  font-size: 0.85rem;
}

.message--error,
.load-error {
  color: var(--color-error);
}

.message--success {
  color: var(--color-success);
}
</style>
