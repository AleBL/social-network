import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation
} from 'd3';

const PADDING = 30;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Computes a static force-directed layout: the simulation runs to the end
// up front (no animation), so the result is stable and easy to test.
// Returns copies: nodes gain x, y and degree; links point to node objects.
export function layoutGraph(
  { nodes, links },
  { width = 800, height = 500, ticks = 300 } = {}
) {
  const layoutNodes = nodes.map((node) => ({ ...node, degree: 0 }));
  const layoutLinks = links.map((link) => ({ ...link }));
  const byId = new Map(layoutNodes.map((node) => [node.id, node]));

  for (const { source, target } of layoutLinks) {
    byId.get(source).degree += 1;
    byId.get(target).degree += 1;
  }

  forceSimulation(layoutNodes)
    .force(
      'link',
      forceLink(layoutLinks)
        .id((node) => node.id)
        .distance(90)
    )
    .force('charge', forceManyBody().strength(-300))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide(32))
    .stop()
    .tick(ticks);

  // Keeps every circle (and its label) inside the drawing area.
  for (const node of layoutNodes) {
    node.x = clamp(node.x, PADDING, width - PADDING);
    node.y = clamp(node.y, PADDING, height - PADDING);
  }

  return { nodes: layoutNodes, links: layoutLinks };
}

// Users with more friends get bigger circles (capped so hubs stay readable).
export function nodeRadius(node) {
  return 8 + 2 * Math.min(node.degree, 6);
}
