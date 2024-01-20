// shadcn imports
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

// graph imports
import dagre from "@dagrejs/dagre";
import { type Node, type Edge, Position, MarkerType } from "@xyflow/svelte";
import type { BackwardInfo, Value } from "$lib/micrograd/engine";
import { v4 as uuidv4 } from "uuid";

// shadcn stuff
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
  y?: number;
  x?: number;
  start?: number;
  duration?: number;
};

export const flyAndScale = (
  node: Element,
  params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
  const style = getComputedStyle(node);
  const transform = style.transform === "none" ? "" : style.transform;

  const scaleConversion = (
    valueA: number,
    scaleA: [number, number],
    scaleB: [number, number]
  ) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
  };

  const styleToString = (
    style: Record<string, number | string | undefined>
  ): string => {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) return str;
      return str + `${key}:${style[key]};`;
    }, "");
  };

  return {
    duration: params.duration ?? 200,
    delay: 0,
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

      return styleToString({
        transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity: t,
      });
    },
    easing: cubicOut,
  };
};

// graph stuff

// automatic layout
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) {
  // init dagre obj
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  // set orientation
  const isHorizontal = direction === "LR";
  g.setGraph({ rankdir: direction });

  // init nodes
  for (const node of nodes) {
    if (node.data.op) {
      g.setNode(node.id, { width: 56, height: 48 });
    } else {
      g.setNode(node.id, { width: 250, height: 36 });
    }
  }

  // init edges
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  // arrange (autogen the x,y coords)
  dagre.layout(g);

  // update nodes with the adjusted x,y coordinates
  // Svelte Flow's centroid is top left, while dagre is center center
  for (const node of nodes) {
    const nodeWithPosition = g.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    let nodeWidth: number;
    let nodeHeight: number;

    if (node.data.op) {
      nodeWidth = 102; //56
      nodeHeight = 48;
    } else {
      nodeWidth = 250;
      nodeHeight = 36;
    }
    // do the adjustment of centroids
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  }

  return { nodes, edges };
}

// backtrack on objective to get nodes, edges
export function trace(root: Value): [Set<Value>, Set<[Value, Value]>] {
  let nodes: Set<Value> = new Set();
  let edges: Set<[Value, Value]> = new Set();

  function build(v: Value): void {
    if (!nodes.has(v)) {
      nodes.add(v);
      for (const child of v._prev) {
        edges.add([child, v]);
        build(child);
      }
    }
  }

  build(root);
  return [nodes, edges];
}

// format trace to Node[] and Edge[]
export function formatTrace(root: Value): [Node[], Edge[]] {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const position = { x: 0, y: 0 };
  const edgeType = "bezier";
  const [_nodes, _edges] = trace(root);

  for (const n of _nodes) {
    const uid = n.uid;
    nodes.push({
      id: uid,
      type: "value",
      data: { val: n.grad, grad: n.val, label: n.label },
      position,
    });

    // if node also has an `op`, create an extra OperatorNode
    if (n._op) {
      nodes.push({
        id: uid + n._op,
        type: "operator",
        data: { op: n._op },
        position,
      });

      // 2 edges from children -> op
      const _children = n._prev;
      for (const c of _children) {
        edges.push({
          id: uuidv4(),
          source: c.uid,
          target: uid + n._op,
          type: edgeType,
          markerEnd: {
            type: MarkerType.Arrow,
          },
        });
      }

      // edge from op -> computed
      edges.push({
        id: uuidv4(),
        source: uid + n._op,
        target: uid,
        type: edgeType,
        markerEnd: {
          type: MarkerType.Arrow,
        },
      });
    }
  }

  return [nodes, edges];
}

export function formatBackward(edges: BackwardInfo[]): Edge[] {
  const formattedEdges = [];
  for (const e of edges) {
    formattedEdges.push({
      id: uuidv4(),
      source: e.src,
      target: e.dst,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#FF4000",
      },
      label: e.arithmetic,
      style: "stroke: #FF4000",
    });
  }
  return formattedEdges;
}

export function updateEdge(instruction: BackwardInfo, edges: Edge[]): Edge[] {
  let edgesCopy = [...edges];
  let operandEdge: Edge | undefined = undefined;

  // find the edge that connects to the operator node
  // op(src) -> (tgt)val
  for (let i = 0; i < edgesCopy.length; i++) {
    let edge = edgesCopy[i];
    if (edge.target === instruction.src) {
      operandEdge = edge;

      // invert the edge
      const newEdge = {
        id: edge.id,
        // swap direction
        source: edge.source,
        target: edge.target,
        markerStart: {
          type: MarkerType.ArrowClosed,
          color: "#FF4000",
        },
        style: "stroke: #FF4000",
      };

      // reassign
      edgesCopy[i] = newEdge;
    }
  }

  // find the edge that connects the children to the operator node
  // [c1(val) -> (tgt)op, c2(val) -> (tgt)op] or if unary op just 1
  if (!operandEdge) throw new Error("Cannot find the operand");

  for (let i = 0; i < edgesCopy.length; i++) {
    const edge = edgesCopy[i];
    if (edge.target === operandEdge.source && edge.source === instruction.dst) {
      // invert the edge
      const newEdge = {
        id: edge.id,
        // swap direction
        source: edge.source,
        target: edge.target,
        markerStart: {
          type: MarkerType.ArrowClosed,
          color: "#FF4000",
        },
        label: instruction.arithmetic,
        style: "stroke: #FF4000",
      };

      // reassign
      edgesCopy[i] = newEdge;
    }
  }

  return edgesCopy;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
