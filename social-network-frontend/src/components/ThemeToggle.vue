<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="label"
    :title="label"
    @click="toggle"
  >
    <!-- Shows the theme you switch to: a sun in dark mode, a moon in light. -->
    <svg v-if="theme === 'dark'" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path
          d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        />
      </g>
    </svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z"
      />
    </svg>
  </button>
</template>

<script>
import { getCurrentTheme, setTheme } from '../utils/theme';

export default {
  name: 'ThemeToggle',
  data() {
    return { theme: getCurrentTheme() };
  },
  computed: {
    label() {
      return this.theme === 'dark'
        ? 'Switch to light theme'
        : 'Switch to dark theme';
    }
  },
  methods: {
    toggle() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      setTheme(this.theme);
    }
  }
};
</script>

<style scoped>
.theme-toggle {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border-radius: 50%;
  border-color: var(--color-border);
  background: transparent;
  color: var(--color-muted);
}

.theme-toggle:hover:not(:disabled) {
  background: var(--color-surface-2);
  color: var(--color-text);
}

svg {
  width: 1.1rem;
  height: 1.1rem;
}
</style>
