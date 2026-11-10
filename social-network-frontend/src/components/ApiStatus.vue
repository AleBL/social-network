<template>
  <p class="api-status" :class="`api-status--${status}`" role="status">
    {{ message }}
  </p>
</template>

<script>
import { ping } from '../services/api';

// After this delay the backend is probably waking up from the free-tier sleep.
export const SLOW_THRESHOLD_MS = 3000;

export default {
  name: 'ApiStatus',
  data() {
    return {
      status: 'checking',
      slow: false
    };
  },
  computed: {
    message() {
      if (this.status === 'online') {
        return 'API online';
      }
      if (this.status === 'offline') {
        return 'API unavailable, please try again later';
      }
      return this.slow
        ? 'Waking up the server (free tier), this can take up to a minute...'
        : 'Checking API...';
    }
  },
  async mounted() {
    const timer = setTimeout(() => {
      this.slow = true;
    }, SLOW_THRESHOLD_MS);

    try {
      await ping();
      this.status = 'online';
    } catch {
      this.status = 'offline';
    } finally {
      clearTimeout(timer);
    }
  }
};
</script>

<style scoped>
.api-status {
  font-size: 0.9rem;
  color: #666;
}

.api-status--online {
  color: #2e7d32;
}

.api-status--offline {
  color: #c62828;
}
</style>
