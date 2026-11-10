<template>
  <section class="graph">
    <h1>Friendship graph</h1>
    <p class="hint">
      Each circle is a user and each line a friendship. Bigger circles have
      more friends. Click a user to open the profile.
    </p>

    <LoadingState v-if="loading" message="Loading graph..." />

    <div v-else-if="error" class="load-error" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="load">Try again</button>
    </div>

    <p v-else-if="layout.nodes.length === 0" class="empty">
      No users yet. Add some on the Users page.
    </p>

    <template v-else>
      <p class="summary">{{ summary }}</p>
      <div class="card canvas">
        <svg
          :viewBox="`0 0 ${width} ${height}`"
          role="group"
          :aria-label="summary"
        >
          <g class="links">
            <line
              v-for="link in layout.links"
              :key="`${link.source.id}-${link.target.id}`"
              :x1="link.source.x"
              :y1="link.source.y"
              :x2="link.target.x"
              :y2="link.target.y"
            />
          </g>
          <g
            v-for="node in layout.nodes"
            :key="node.id"
            class="node"
            :transform="`translate(${node.x}, ${node.y})`"
            role="link"
            tabindex="0"
            :aria-label="`${node.name}, ${node.degree} friends`"
            @click="open(node)"
            @keydown.enter="open(node)"
          >
            <circle :r="radius(node)" />
            <text :y="radius(node) + 14" text-anchor="middle">
              {{ node.name }}
            </text>
          </g>
        </svg>
      </div>
    </template>
  </section>
</template>

<script>
import LoadingState from '../components/LoadingState.vue';
import { getErrorMessage, getGraph } from '../services/api';
import { layoutGraph, nodeRadius } from '../utils/graphLayout';

const WIDTH = 800;
const HEIGHT = 500;

export default {
  name: 'GraphView',
  components: { LoadingState },
  data() {
    return {
      width: WIDTH,
      height: HEIGHT,
      layout: { nodes: [], links: [] },
      loading: false,
      error: ''
    };
  },
  computed: {
    summary() {
      const users = this.layout.nodes.length;
      const friendships = this.layout.links.length;
      return `${users} ${users === 1 ? 'user' : 'users'}, ${friendships} ${
        friendships === 1 ? 'friendship' : 'friendships'
      }`;
    }
  },
  mounted() {
    this.load();
  },
  methods: {
    radius: nodeRadius,
    async load() {
      this.loading = true;
      this.error = '';

      try {
        const graph = await getGraph();
        this.layout = layoutGraph(graph, {
          width: this.width,
          height: this.height
        });
      } catch (err) {
        this.error = getErrorMessage(err);
      } finally {
        this.loading = false;
      }
    },
    open(node) {
      this.$router.push({ name: 'user', params: { id: node.id } });
    }
  }
};
</script>

<style scoped>
.graph {
  display: grid;
  gap: 1rem;
}

h1 {
  margin: 0;
}

.hint,
.summary,
.empty {
  margin: 0;
  color: var(--color-muted);
}

.canvas {
  padding: 0.5rem;
}

svg {
  display: block;
  width: 100%;
  height: auto;
}

.links line {
  stroke: var(--color-border);
  stroke-width: 2;
}

.node {
  cursor: pointer;
  outline: none;
}

.node circle {
  fill: var(--color-primary);
  stroke: var(--color-surface);
  stroke-width: 2;
}

.node text {
  font-size: 13px;
  fill: var(--color-text);
  pointer-events: none;
}

.node:hover circle,
.node:focus-visible circle {
  fill: var(--color-text);
}

.node:focus-visible circle {
  stroke: var(--color-primary);
  stroke-width: 4;
}

.load-error {
  color: var(--color-error);
}
</style>
