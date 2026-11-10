import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY
} from 'd3';

const PADDING = 40;
// Room below the lowest circle for its name.
const LABEL_SPACE = 22;
const LONER_GAP = 110;
const LONER_ROW_OFFSET = 100;
const MIN_WIDTH = 480;
const MIN_HEIGHT = 320;

// Users with more friends get bigger circles (capped so hubs stay readable).
export function nodeRadius(node) {
  return 8 + 2 * Math.min(node.degree, 6);
}

// Approximate half width of a name at 11px, the size used on the graph.
const labelHalfWidth = (node) => ((node.name?.length ?? 0) * 6.2) / 2;

// Each node keeps clear a circle as wide as its name, so names do not overlap
// each other nor other circles (measured on the demo data: zero overlaps).
const collisionRadius = (node) =>
  Math.max(nodeRadius(node) + 16, labelHalfWidth(node) + 6);

function boundsOf(nodes) {
  if (nodes.length === 0) {
    return null;
  }
  const radius = (node) => nodeRadius(node);
  return {
    minX: Math.min(...nodes.map((node) => node.x - radius(node))),
    maxX: Math.max(...nodes.map((node) => node.x + radius(node))),
    minY: Math.min(...nodes.map((node) => node.y - radius(node))),
    maxY: Math.max(...nodes.map((node) => node.y + radius(node)))
  };
}

// Grows a box around its center up to a minimum size.
function atLeast(box) {
  const width = Math.max(box.width, MIN_WIDTH);
  const height = Math.max(box.height, MIN_HEIGHT);
  return {
    x: box.x - (width - box.width) / 2,
    y: box.y - (height - box.height) / 2,
    width,
    height
  };
}

// Static force-directed layout: the simulation runs to the end up front (no
// animation), so the result is stable and easy to test.
//  - Gentle gravity (forceX/forceY) keeps the network compact without pushing
//    nodes against a border; the view box is then fitted to the result.
//  - Collision keeps room for each name (see collisionRadius).
//  - People without friends are lined up in a row below the network.
// Returns copies: nodes gain x, y and degree; links point to node objects.
export function layoutGraph({ nodes, links }, { ticks = 400 } = {}) {
  const layoutNodes = nodes.map((node) => ({ ...node, degree: 0 }));
  const layoutLinks = links.map((link) => ({ ...link }));
  const byId = new Map(layoutNodes.map((node) => [node.id, node]));

  for (const { source, target } of layoutLinks) {
    byId.get(source).degree += 1;
    byId.get(target).degree += 1;
  }

  const connected = layoutNodes.filter((node) => node.degree > 0);
  const loners = layoutNodes.filter((node) => node.degree === 0);

  if (connected.length > 0) {
    forceSimulation(connected)
      .force(
        'link',
        forceLink(layoutLinks)
          .id((node) => node.id)
          .distance(70)
      )
      .force('charge', forceManyBody().strength(-260))
      // Pulling harder vertically gives a wide layout that suits screens.
      .force('x', forceX(0).strength(0.04))
      .force('y', forceY(0).strength(0.1))
      .force('collide', forceCollide(collisionRadius))
      .stop()
      .tick(ticks);
  }

  const network = boundsOf(connected) ?? { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  const lonerRow =
    loners.length > 0
      ? {
          x: network.minX,
          y: connected.length > 0 ? network.maxY + LONER_ROW_OFFSET : 0
        }
      : null;

  if (lonerRow) {
    // At least the minimum drawing width, so a small network still gets a row.
    const rowWidth = Math.max(
      network.maxX - network.minX,
      MIN_WIDTH - 2 * PADDING
    );
    const perRow = Math.floor(rowWidth / LONER_GAP) + 1;
    loners.forEach((node, index) => {
      node.x = lonerRow.x + 20 + (index % perRow) * LONER_GAP;
      node.y = lonerRow.y + 34 + Math.floor(index / perRow) * 70;
    });
  }

  const all = boundsOf(layoutNodes);
  const viewBox = all
    ? atLeast({
        x: all.minX - PADDING,
        y: all.minY - PADDING,
        width: all.maxX - all.minX + 2 * PADDING,
        height: all.maxY - all.minY + 2 * PADDING + LABEL_SPACE
      })
    : { x: 0, y: 0, width: MIN_WIDTH, height: MIN_HEIGHT };

  return { nodes: layoutNodes, links: layoutLinks, viewBox, lonerRow };
}
