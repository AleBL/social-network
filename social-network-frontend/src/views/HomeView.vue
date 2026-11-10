<template>
  <div class="home">
    <section class="intro">
      <h1>Social Network</h1>
      <p>
        Connect with friends and discover new ones through mutual connections.
      </p>
      <ApiStatus />
    </section>

    <SuggestedConnections />
  </div>
</template>

<script>
import ApiStatus from '../components/ApiStatus.vue';
import SuggestedConnections from '../components/SuggestedConnections.vue';

export default {
  name: 'HomeView',
  components: { ApiStatus, SuggestedConnections }
};
</script>

<style scoped>
.home {
  display: grid;
  gap: 1.5rem;
}

.intro {
  text-align: center;
}

.intro h1 {
  margin: 0 0 0.5rem;
}
</style>
