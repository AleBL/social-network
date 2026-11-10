<template>
  <main class="home">
    <h1>Social Network</h1>
    <p>Connect with friends and discover new ones through mutual connections.</p>
    <ApiStatus />
  </main>
</template>

<script>
import ApiStatus from '../components/ApiStatus.vue';

export default {
  name: 'HomeView',
  components: { ApiStatus }
};
</script>

<style scoped>
.home {
  max-width: 40rem;
  margin: 4rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
  text-align: center;
}
</style>
