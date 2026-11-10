<template>
  <p class="loading-state" role="status">
    {{ slow ? wakeUpMessage : message }}
  </p>
</template>

<script>
// After this delay the backend is probably waking up from the free-tier sleep.
export const SLOW_THRESHOLD_MS = 3000;

export default {
  name: 'LoadingState',
  props: {
    message: {
      type: String,
      default: 'Loading...'
    }
  },
  data() {
    return {
      slow: false,
      timer: null,
      wakeUpMessage:
        'Waking up the server (free tier), this can take up to a minute...'
    };
  },
  mounted() {
    this.timer = setTimeout(() => {
      this.slow = true;
    }, SLOW_THRESHOLD_MS);
  },
  beforeUnmount() {
    clearTimeout(this.timer);
  }
};
</script>

<style scoped>
.loading-state {
  color: var(--color-muted);
}
</style>
