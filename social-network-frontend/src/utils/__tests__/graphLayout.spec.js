import { describe, expect, it } from 'vitest';
import { layoutGraph, nodeRadius } from '../graphLayout';

const graph = {
  nodes: [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Carol' },
    { id: '4', name: 'Dave' }
  ],
  links: [
    { source: '1', target: '2' },
    { source: '1', target: '3' },
    { source: '2', target: '4' },
    { source: '3', target: '4' }
  ]
};

describe('layoutGraph', () => {
  it('places every node inside the drawing area', () => {
    const { nodes } = layoutGraph(graph, { width: 400, height: 300 });

    for (const node of nodes) {
      expect(node.x).toBeGreaterThanOrEqual(30);
      expect(node.x).toBeLessThanOrEqual(370);
      expect(node.y).toBeGreaterThanOrEqual(30);
      expect(node.y).toBeLessThanOrEqual(270);
    }
  });

  it('counts friends per node and resolves links to nodes', () => {
    const { nodes, links } = layoutGraph(graph);

    expect(nodes.map((node) => node.degree)).toEqual([2, 2, 2, 2]);
    expect(links[0].source.name).toBe('Alice');
    expect(links[0].target.name).toBe('Bob');
  });

  it('spreads nodes apart instead of stacking them', () => {
    const { nodes } = layoutGraph(graph);
    const positions = new Set(
      nodes.map((node) => `${Math.round(node.x)},${Math.round(node.y)}`)
    );

    expect(positions.size).toBe(nodes.length);
  });

  it('does not change the input data', () => {
    const input = structuredClone(graph);

    layoutGraph(input);

    expect(input).toEqual(graph);
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
