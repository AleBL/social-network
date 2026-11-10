<template>
  <section class="graph">
    <header class="page-header">
      <h1>Friendship graph</h1>
      <p class="muted">
        Each circle is a person and each line a friendship. Colors are groups of
        friends found automatically and bigger circles have more friends. Scroll
        or pinch to zoom, drag to move, and click a person to open the profile.
      </p>
    </header>

    <LoadingState v-if="loading" message="Loading graph..." />

    <div v-else-if="error" class="load-error" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="secondary" @click="load">Try again</button>
    </div>

    <p v-else-if="layout.nodes.length === 0" class="empty">
      No users yet. Add some on the Users page.
    </p>

    <template v-else>
      <div class="toolbar">
        <p class="summary">{{ summary }}</p>
        <div class="controls">
          <label class="toggle">
            <input
              v-model="showSuggestions"
              type="checkbox"
              @change="onToggleSuggestions"
            />
            Show suggested friendships
          </label>
          <div class="zoom-buttons" role="group" aria-label="Zoom">
            <button
              type="button"
              class="secondary"
              aria-label="Zoom in"
              @click="zoomBy(1.4)"
            >
              +
            </button>
            <button
              type="button"
              class="secondary"
              aria-label="Zoom out"
              @click="zoomBy(1 / 1.4)"
            >
              −
            </button>
            <button type="button" class="secondary" @click="resetZoom">
              Reset
            </button>
          </div>
        </div>
      </div>

      <p v-if="suggestionsError" class="load-error" role="alert">
        {{ suggestionsError }}
      </p>
      <p v-else-if="showSuggestions" class="legend">
        <span class="legend-line" aria-hidden="true"></span>
        Dashed lines: {{ suggestionLines.length }} pairs with friends in common
        who are not friends yet.
      </p>

      <div class="card canvas">
        <svg
          ref="svg"
          :viewBox="viewBoxAttr"
          role="group"
          :aria-label="summary"
        >
          <!-- Everything inside moves with zoom and pan. -->
          <g :transform="zoomTransform">
            <g class="links">
              <line
                v-for="link in layout.links"
                :key="`${link.source.id}-${link.target.id}`"
                :class="{ 'is-dim': isLinkDim(link) }"
                :x1="link.source.x"
                :y1="link.source.y"
                :x2="link.target.x"
                :y2="link.target.y"
              />
            </g>
            <g v-if="showSuggestions" class="suggestions">
              <line
                v-for="line in suggestionLines"
                :key="line.key"
                :x1="line.x1"
                :y1="line.y1"
                :x2="line.x2"
                :y2="line.y2"
              />
            </g>
            <text
              v-if="layout.lonerRow"
              class="loners-label"
              :x="layout.lonerRow.x"
              :y="layout.lonerRow.y"
            >
              No friends yet
            </text>
            <g
              v-for="node in layout.nodes"
              :key="node.id"
              class="node"
              :class="[groupClass(node), { 'is-dim': isNodeDim(node) }]"
              :transform="`translate(${node.x}, ${node.y})`"
              role="link"
              tabindex="0"
              :aria-label="`${node.name}, ${node.degree} friends`"
              @click="open(node)"
              @keydown.enter="open(node)"
              @mouseenter="focusedId = node.id"
              @mouseleave="focusedId = null"
              @focus="focusedId = node.id"
              @blur="focusedId = null"
            >
              <circle :r="radius(node)" />
              <text :y="radius(node) + 13" text-anchor="middle">
                {{ node.name }}
              </text>
            </g>
          </g>
        </svg>
      </div>
    </template>
  </section>
</template>

<script>
import { select, zoom, zoomIdentity } from 'd3';
import LoadingState from '../components/LoadingState.vue';
import {
  getErrorMessage,
  getGraph,
  getSuggestedConnections
} from '../services/api';
import { detectCommunities } from '../utils/communities';
import { layoutGraph, nodeRadius } from '../utils/graphLayout';

const SUGGESTIONS_ON_GRAPH = 20;
const GROUP_COLORS = 8;

export default {
  name: 'GraphView',
  components: { LoadingState },
  data() {
    return {
      layout: { nodes: [], links: [], viewBox: null, lonerRow: null },
      groups: new Map(),
      loading: false,
      error: '',
      showSuggestions: false,
      suggestions: null,
      suggestionsError: '',
      // Person under the mouse or keyboard focus: their friendships stand out.
      focusedId: null,
      zoomTransform: '',
      zoomBehavior: null
    };
  },
  computed: {
    summary() {
      const users = this.layout.nodes.length;
      const friendships = this.layout.links.length;
      return `${users} ${users === 1 ? 'user' : 'users'}, ${friendships} ${
        friendships === 1 ? 'friendship' : 'friendships'
      }`;
    },
    viewBoxAttr() {
      const box = this.layout.viewBox;
      return box ? `${box.x} ${box.y} ${box.width} ${box.height}` : undefined;
    },
    neighbors() {
      const map = new Map(this.layout.nodes.map((node) => [node.id, new Set()]));
      for (const { source, target } of this.layout.links) {
        map.get(source.id).add(target.id);
        map.get(target.id).add(source.id);
      }
      return map;
    },
    // Suggested pairs as dashed lines; drawn separately so they never move the layout.
    suggestionLines() {
      const byId = new Map(this.layout.nodes.map((node) => [node.id, node]));

      return (this.suggestions ?? [])
        .map(({ a, b }) => ({ from: byId.get(a.id), to: byId.get(b.id) }))
        .filter(({ from, to }) => from && to)
        .map(({ from, to }) => ({
          key: `${from.id}-${to.id}`,
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y
        }));
    }
  },
  mounted() {
    this.load();
  },
  beforeUnmount() {
    if (this.$refs.svg) {
      select(this.$refs.svg).on('.zoom', null);
    }
  },
  methods: {
    radius: nodeRadius,
    groupClass(node) {
      return node.degree === 0
        ? 'loner'
        : `group-${this.groups.get(node.id) % GROUP_COLORS}`;
    },
    isNodeDim(node) {
      return (
        this.focusedId !== null &&
        node.id !== this.focusedId &&
        !this.neighbors.get(this.focusedId)?.has(node.id)
      );
    },
    isLinkDim(link) {
      return (
        this.focusedId !== null &&
        link.source.id !== this.focusedId &&
        link.target.id !== this.focusedId
      );
    },
    async load() {
      this.loading = true;
      this.error = '';

      try {
        const graph = await getGraph();
        this.layout = layoutGraph(graph);
        this.groups = detectCommunities(graph.nodes, graph.links);
      } catch (err) {
        this.error = getErrorMessage(err);
      } finally {
        this.loading = false;
      }

      await this.$nextTick();
      this.setupZoom();
    },
    // d3-zoom handles wheel, pinch and drag; the transform is applied by Vue.
    setupZoom() {
      const svg = this.$refs.svg;
      const box = this.layout.viewBox;
      if (!svg || !box) {
        return;
      }

      this.zoomTransform = '';
      this.zoomBehavior = zoom()
        .extent([
          [box.x, box.y],
          [box.x + box.width, box.y + box.height]
        ])
        .scaleExtent([0.5, 5])
        .on('zoom', (event) => {
          this.zoomTransform = event.transform.toString();
        });

      select(svg).call(this.zoomBehavior).on('dblclick.zoom', null);
    },
    zoomBy(factor) {
      if (this.zoomBehavior) {
        select(this.$refs.svg).call(this.zoomBehavior.scaleBy, factor);
      }
    },
    resetZoom() {
      if (this.zoomBehavior) {
        select(this.$refs.svg).call(this.zoomBehavior.transform, zoomIdentity);
      }
    },
    // Loaded the first time the toggle is turned on.
    async onToggleSuggestions() {
      if (!this.showSuggestions || this.suggestions) {
        return;
      }

      this.suggestionsError = '';

      try {
        this.suggestions = await getSuggestedConnections(SUGGESTIONS_ON_GRAPH);
      } catch (err) {
        this.showSuggestions = false;
        this.suggestionsError = getErrorMessage(err);
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

.page-header {
  display: grid;
  gap: 0.35rem;
}

.page-header h1,
.page-header p {
  margin: 0;
}

.summary,
.empty {
  margin: 0;
  color: var(--color-muted);
}

.toolbar,
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
}

.toolbar {
  justify-content: space-between;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.zoom-buttons {
  display: inline-flex;
  gap: 0.25rem;
}

.zoom-buttons button {
  min-width: 2.25rem;
  padding: 0.3rem 0.6rem;
}

.legend {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.legend-line {
  display: inline-block;
  width: 2rem;
  border-top: 2px dashed var(--color-success);
}

.canvas {
  padding: 0;
  overflow: hidden;
}

svg {
  display: block;
  width: 100%;
  height: clamp(420px, 70vh, 760px);
  cursor: grab;
  touch-action: none;
}

svg:active {
  cursor: grabbing;
}

.links line {
  stroke: var(--color-border);
  stroke-width: 1.5;
  transition: opacity 0.15s ease;
}

.suggestions line {
  stroke: var(--color-success);
  stroke-width: 2;
  stroke-dasharray: 6 5;
  opacity: 0.8;
  pointer-events: none;
}

.loners-label {
  font-size: 12px;
  font-weight: 600;
  fill: var(--color-muted);
}

.node {
  cursor: pointer;
  outline: none;
  transition: opacity 0.15s ease;
}

.node circle {
  stroke: var(--color-surface);
  stroke-width: 2;
}

/* The name gets an outline in the background color so it stays readable
   on top of lines and other circles. */
.node text {
  font-size: 11px;
  font-weight: 500;
  fill: var(--color-text);
  paint-order: stroke;
  stroke: var(--color-surface);
  stroke-width: 3px;
  stroke-linejoin: round;
  pointer-events: none;
}

.is-dim {
  opacity: 0.2;
}

.node:focus-visible circle {
  stroke: var(--color-text);
  stroke-width: 3;
}

/* Group colors (light, dark). */
.group-0 circle {
  fill: light-dark(#5b5bd6, #8e90ff);
}

.group-1 circle {
  fill: light-dark(#0c8599, #3bc9db);
}

.group-2 circle {
  fill: light-dark(#e8590c, #ff922b);
}

.group-3 circle {
  fill: light-dark(#c2255c, #f783ac);
}

.group-4 circle {
  fill: light-dark(#2b8a3e, #69db7c);
}

.group-5 circle {
  fill: light-dark(#1971c2, #74c0fc);
}

.group-6 circle {
  fill: light-dark(#a86700, #fcc419);
}

.group-7 circle {
  fill: light-dark(#862e9c, #da77f2);
}

.loner circle {
  fill: var(--color-muted);
  opacity: 0.6;
}

.load-error {
  color: var(--color-error);
}
</style>
