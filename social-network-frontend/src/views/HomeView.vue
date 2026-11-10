<template>
  <div class="home">
    <section class="hero">
      <h1>Find friends through the people you already know</h1>
      <p class="lead">
        A social graph powered by Neo4j: explore who knows whom, compare common
        friends and get suggestions based on mutual connections.
      </p>
      <div class="hero-actions">
        <RouterLink to="/graph" class="button-link">Explore the graph</RouterLink>
        <RouterLink to="/users" class="button-link secondary">
          Browse people
        </RouterLink>
      </div>
    </section>

    <div class="home-grid">
      <SuggestedConnections />
      <NetworkStats />
    </div>
  </div>
</template>

<script>
import NetworkStats from '../components/NetworkStats.vue';
import SuggestedConnections from '../components/SuggestedConnections.vue';

export default {
  name: 'HomeView',
  components: { NetworkStats, SuggestedConnections }
};
</script>

<style scoped>
.home {
  display: grid;
  gap: 2rem;
}

.hero {
  display: grid;
  gap: 0.75rem;
  max-width: 44rem;
}

.hero h1 {
  margin: 0;
}

.lead {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-muted);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.home-grid {
  display: grid;
  gap: 1.5rem;
  align-items: start;
}

@media (min-width: 900px) {
  .home-grid {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
}
</style>
