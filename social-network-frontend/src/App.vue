<template>
  <div class="app">
    <header class="app-header">
      <div class="header-inner">
        <RouterLink to="/" class="brand">
          <svg class="logo" viewBox="0 0 24 24" aria-hidden="true">
            <g stroke="currentColor" stroke-width="1.8" fill="none">
              <path d="M7 7l10 3M7 7l4 10M17 10l-6 7" />
            </g>
            <g fill="currentColor">
              <circle cx="7" cy="7" r="3" />
              <circle cx="17" cy="10" r="3" />
              <circle cx="11" cy="17" r="3" />
            </g>
          </svg>
          Social Network
        </RouterLink>
        <nav aria-label="Main">
          <RouterLink to="/" class="nav-link nav-link--exact">Home</RouterLink>
          <!-- Stays highlighted on profiles (/users/:id). -->
          <RouterLink to="/users" class="nav-link">Users</RouterLink>
          <RouterLink to="/common-friends" class="nav-link">
            Common friends
          </RouterLink>
          <RouterLink to="/graph" class="nav-link">Graph</RouterLink>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer">
      <div class="footer-inner">
        <ApiStatus />
        <span class="muted">Vue · Express · Neo4j</span>
        <a href="https://github.com/AleBL/social-network" rel="noopener">
          Source on GitHub
        </a>
      </div>
    </footer>
  </div>
</template>

<script>
import ApiStatus from './components/ApiStatus.vue';

export default {
  name: 'App',
  components: { ApiStatus }
};
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--color-surface) 85%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}

.header-inner,
.footer-inner,
.app-main {
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding-inline: 1rem;
}

.header-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  padding-block: 0.6rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-text);
}

.brand:hover {
  text-decoration: none;
}

.logo {
  width: 1.6rem;
  height: 1.6rem;
  color: var(--color-primary);
}

nav {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
}

.nav-link {
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  color: var(--color-muted);
  font-weight: 500;
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--color-text);
  background: var(--color-surface-2);
  text-decoration: none;
}

.nav-link.router-link-active:not(.nav-link--exact),
.nav-link--exact.router-link-exact-active {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.app-main {
  padding-block: 2rem 3rem;
}

.app-footer {
  border-top: 1px solid var(--color-border);
  font-size: 0.85rem;
}

.footer-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.5rem;
  padding-block: 1rem;
}

.footer-inner > :first-child {
  margin: 0;
}
</style>
