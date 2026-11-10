<template>
  <section class="stats" aria-label="The network at a glance">
    <LoadingState v-if="loading" message="Loading the network..." />

    <div v-else-if="error" class="card load-error" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="secondary" @click="load">Try again</button>
    </div>

    <template v-else-if="stats">
      <ul class="tiles">
        <li class="card tile">
          <span class="tile-value">{{ stats.users }}</span>
          <span class="tile-label">users</span>
        </li>
        <li class="card tile">
          <span class="tile-value">{{ stats.friendships }}</span>
          <span class="tile-label">friendships</span>
        </li>
        <li class="card tile">
          <span class="tile-value">{{ stats.averageFriends }}</span>
          <span class="tile-label">friends on average</span>
        </li>
        <li class="card tile">
          <span class="tile-value">{{ stats.withoutFriends }}</span>
          <span class="tile-label">without friends yet</span>
        </li>
      </ul>

      <section
        v-if="stats.mostConnected.length"
        class="card connected"
        aria-labelledby="most-connected-title"
      >
        <h2 id="most-connected-title">Most connected</h2>
        <ol class="ranking">
          <li v-for="person in stats.mostConnected" :key="person.id">
            <UserAvatar :id="person.id" :name="person.name" size="sm" />
            <RouterLink
              :to="{ name: 'user', params: { id: person.id } }"
              class="person-link"
            >
              {{ person.name }}
            </RouterLink>
            <span class="friends-count muted">{{ person.degree }} friends</span>
          </li>
        </ol>
      </section>
    </template>
  </section>
</template>

<script>
import LoadingState from './LoadingState.vue';
import UserAvatar from './UserAvatar.vue';
import { getErrorMessage, getGraph } from '../services/api';
import { computeNetworkStats } from '../utils/networkStats';

export default {
  name: 'NetworkStats',
  components: { LoadingState, UserAvatar },
  data() {
    return {
      stats: null,
      loading: false,
      error: ''
    };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = '';

      try {
        this.stats = computeNetworkStats(await getGraph());
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
.stats {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.tiles {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.tile {
  display: grid;
  gap: 0.1rem;
  padding: 0.9rem 1rem;
}

.tile-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-primary);
}

.tile-label {
  font-size: 0.85rem;
  color: var(--color-muted);
}

.connected h2 {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
}

.ranking {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.6rem;
}

.ranking li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.friends-count {
  margin-left: auto;
  font-size: 0.85rem;
  white-space: nowrap;
}

.load-error {
  color: var(--color-error);
}
</style>
