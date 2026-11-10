import { describe, expect, it } from 'vitest';
import { layoutGraph, nodeRadius } from '../graphLayout';

const graph = {
  nodes: [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Carol' },
    { id: '4', name: 'Dave' },
    { id: '5', name: 'Erin' },
    { id: '6', name: 'Frank' }
  ],
  links: [
    { source: '1', target: '2' },
    { source: '1', target: '3' },
    { source: '2', target: '4' },
    { source: '3', target: '4' }
  ]
};

const inside = (node, box) =>
  node.x - nodeRadius(node) >= box.x &&
  node.x + nodeRadius(node) <= box.x + box.width &&
  node.y - nodeRadius(node) >= box.y &&
  node.y + nodeRadius(node) <= box.y + box.height;

describe('layoutGraph', () => {
  it('fits the view box to every node instead of pushing nodes to a border', () => {
    const { nodes, viewBox } = layoutGraph(graph);

    expect(nodes.every((node) => inside(node, viewBox))).toBe(true);
  });

  it('lines up people without friends in a row below the network', () => {
    const { nodes, lonerRow } = layoutGraph(graph);
    const connected = nodes.filter((node) => node.degree > 0);
    const loners = nodes.filter((node) => node.degree === 0);
    const lowest = Math.max(...connected.map((node) => node.y));

    expect(loners.map((node) => node.name)).toEqual(['Erin', 'Frank']);
    expect(lonerRow.y).toBeGreaterThan(lowest);
    expect(loners[0].y).toBe(loners[1].y);
    expect(loners[1].x).toBeGreaterThan(loners[0].x);
  });

  it('counts friends per node and resolves links to nodes', () => {
    const { nodes, links } = layoutGraph(graph);

    expect(nodes.map((node) => node.degree)).toEqual([2, 2, 2, 2, 0, 0]);
    expect(links[0].source.name).toBe('Alice');
    expect(links[0].target.name).toBe('Bob');
  });

  it('keeps circles from overlapping', () => {
    const { nodes } = layoutGraph(graph);

    for (const a of nodes) {
      for (const b of nodes) {
        if (a !== b) {
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          expect(distance).toBeGreaterThan(nodeRadius(a) + nodeRadius(b));
        }
      }
    }
  });

  it('does not change the input data', () => {
    const input = structuredClone(graph);

    layoutGraph(input);

    expect(input).toEqual(graph);
  });

  it('handles an empty graph', () => {
    expect(layoutGraph({ nodes: [], links: [] })).toEqual({
      nodes: [],
      links: [],
      viewBox: { x: 0, y: 0, width: 480, height: 320 },
      lonerRow: null
    });
  });
});

describe('nodeRadius', () => {
  it.each([
    [0, 8],
    [3, 14],
    [6, 20],
    [50, 20]
  ])('gives degree %i a radius of %i', (degree, radius) => {
    expect(nodeRadius({ degree })).toBe(radius);
  });
});
