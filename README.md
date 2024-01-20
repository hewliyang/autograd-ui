# autograd-ui

A simple tool for visualizing & understanding automatic differentiation & backpropagation using compute graphs and the chain rule. [at single-variable, ie: **scalar** level]

```bash
pnpm i
pnpm run dev
```

### Stack

- `@xyflow/svelte`
- `@dagrejs/dagre`
- `shadcn-svelte`
- `tailwindcss`

### References

The simple scalar differentiation engine is modelled after **Karparthy**'s `micrograd` Python package, rewritten in Typescript.  
It implements basic **UnaryOps** ($\text{tanh}$, $\text{ReLU}$, and $\text{exp}$) and **BinaryOps** ($+$, $*$, etc).

```
├── src/lib/micrograd
    ├── engine.ts
    └── nn.ts
```

Also check: [micrograd-ts](https://github.com/trekhleb/micrograd-ts) ❤️

**Neuron**

![Neuron architecture reference](https://i.stack.imgur.com/7mTvt.jpg)
![]

**Multi Layer Perceptron**

![MLP reference](https://cs231n.github.io/assets/nn1/neural_net2.jpeg)

### Todo

- [x] Directed Edge
- [x] Figure out how to layout nicely (diff fixed node sizes for `ValueNode` and `OperatorNode`)
- [x] Recurse on the objective to get `Nodes` and `Edges`.

```ts
// shape for ValueNode
{
id: "1",
type: "value",
data: { val: -3.0, grad: -4.0, label: "b" },
position,
}

// shape for OperatorNode
{
id: "3",
type: "operator",
data: { op: "*" },
position,
}

// shape for Edges
{
id: "e1",
source: "1",
target: "3",
type: edgeType,
markerEnd: {
    type: MarkerType.Arrow,
},
}
```

- [x] Figure out a nice way to animate / display the backpropagation process

**Idea**:
Backpropgation happens in reverse topological order, ie: `Loss` -> `leaf`

1. Lazy backprop or pre-compute steps and store in a queue (FIFO) struct
2. Allow controls for user to iterate through the queue.
3. Display the arithmetic that occurs within each `_backward()`

**Edge input format**

```ts
[
  {
    id: "5353c267-7364-4e4d-907f-bc871700a51e",
    source: "1",
    target: "0*",
    type: "bezier",
    markerEnd: { type: "arrow" },
  },
  {
    id: "810e5e6a-6b1e-48c0-b18a-17c8407eba92",
    source: "2",
    target: "0*",
    type: "bezier",
    markerEnd: { type: "arrow" },
  },
  {
    id: "c219da6b-b7f4-43c7-9770-1fb76b44b6ec",
    source: "0*",
    target: "0",
    type: "bezier",
    markerEnd: { type: "arrow" },
  },
  {
    id: "8f364259-a1bb-4448-b9f4-0bb014af9906",
    source: "3",
    target: "1+",
    type: "bezier",
    markerEnd: { type: "arrow" },
  },
  {
    id: "718e2b7e-afab-4dda-b357-2fd5571bdfe5",
    source: "4",
    target: "1+",
    type: "bezier",
    markerEnd: { type: "arrow" },
  },
  {
    id: "aecb8124-4fab-4c9e-ae48-62f699fd4c50",
    source: "1+",
    target: "1",
    type: "bezier",
    markerEnd: { type: "arrow" },
  },
  {
    id: "75f904c1-279e-438e-b565-46f92f6799bc",
    source: "5",
    target: "3*",
    type: "bezier",
    markerEnd: { type: "arrow" },
  },
  {
    id: "7bd84f8a-99d5-4f25-917d-87005f4215cd",
    source: "6",
    target: "3*",
    type: "bezier",
    markerEnd: { type: "arrow" },
  },
  {
    id: "ccbc623a-3177-4dd5-97ca-383800a74ee2",
    source: "3*",
    target: "3",
    type: "bezier",
    markerEnd: { type: "arrow" },
  },
];
```

**Node input format**

```ts
[
  {
    id: "0",
    type: "value",
    data: { val: 1, grad: -8, label: "L" },
    position: { x: 1218, y: 129 },
    targetPosition: "left",
    sourcePosition: "right",
  },
  {
    id: "0*",
    type: "operator",
    data: { op: "*" },
    position: { x: 1112, y: 123 },
    targetPosition: "left",
    sourcePosition: "right",
  },
  {
    id: "1",
    type: "value",
    data: { val: -2, grad: 4, label: "d" },
    position: { x: 812, y: 86 },
    targetPosition: "left",
    sourcePosition: "right",
  },
  {
    id: "1+",
    type: "operator",
    data: { op: "+" },
    position: { x: 706, y: 80 },
    targetPosition: "left",
    sourcePosition: "right",
  },
  {
    id: "3",
    type: "value",
    data: { val: -2, grad: -6, label: "e" },
    position: { x: 406, y: 43 },
    targetPosition: "left",
    sourcePosition: "right",
  },
  {
    id: "3*",
    type: "operator",
    data: { op: "*" },
    position: { x: 300, y: 37 },
    targetPosition: "left",
    sourcePosition: "right",
  },
  {
    id: "5",
    type: "value",
    data: { val: 6, grad: 2, label: "a" },
    position: { x: 0, y: 0 },
    targetPosition: "left",
    sourcePosition: "right",
  },
  {
    id: "6",
    type: "value",
    data: { val: -4, grad: -3, label: "b" },
    position: { x: 0, y: 86 },
    targetPosition: "left",
    sourcePosition: "right",
  },
  {
    id: "4",
    type: "value",
    data: { val: -2, grad: 10, label: "c" },
    position: { x: 406, y: 129 },
    targetPosition: "left",
    sourcePosition: "right",
  },
  {
    id: "2",
    type: "value",
    data: { val: 4, grad: -2, label: "f" },
    position: { x: 812, y: 172 },
    targetPosition: "left",
    sourcePosition: "right",
  },
];
```

- [] Dynamically update `grad` in each `Value`
- [] Values should be tunable reactively
- [] Custom inputs (add your own nodes & edges)
