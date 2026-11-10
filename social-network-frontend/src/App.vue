<template>
  <div class="app">
    <header class="app-header">
      <RouterLink to="/" class="brand">Social Network</RouterLink>
      <nav aria-label="Main">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/users">Users</RouterLink>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
/* Global styles: shared by every view. */
:root {
  --color-text: #1f2328;
  --color-muted: #59636e;
  --color-bg: #f6f8fa;
  --color-surface: #ffffff;
  --color-border: #d1d9e0;
  --color-primary: #0969da;
  --color-error: #c62828;
  --color-success: #2e7d32;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: var(--color-text);
  background: var(--color-bg);
}

body {
  margin: 0;
}

a {
  color: var(--color-primary);
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

input {
  font: inherit;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

button {
  font: inherit;
  padding: 0.45rem 0.9rem;
  border: 0;
  border-radius: 6px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: progress;
}
</style>

<style scoped>
.app-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.brand {
  font-weight: 700;
  color: var(--color-text);
  text-decoration: none;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  text-decoration: none;
}

nav a.router-link-exact-active {
  font-weight: 700;
  text-decoration: underline;
}

.app-main {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}
</style>
