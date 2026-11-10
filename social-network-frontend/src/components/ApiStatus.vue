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
/* Small status pill with a colored dot (footer). */
.api-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.api-status::before {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-muted);
}

.api-status--online::before {
  background: var(--color-success);
}

.api-status--offline {
  color: var(--color-error);
}

.api-status--offline::before {
  background: var(--color-error);
}
</style>
