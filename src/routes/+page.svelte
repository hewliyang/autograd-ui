<script lang="ts">
  import { writable } from "svelte/store";
  import {
    SvelteFlow,
    Background,
    Controls,
    Panel,
    type Node,
    type Edge,
    type ColorMode,
  } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";

  import Button from "$lib/components/ui/button/button.svelte";
  import * as Select from "$lib/components/ui/select";
  import { setMode } from "mode-watcher";

  import ValueNode from "$lib/components/graph/ValueNode.svelte";
  import OperatorNode from "$lib/components/graph/OperatorNode.svelte";

  import { simpleArithmetic, simpleNeuron } from "$lib/example-graphs";
  import { formatTrace, getLayoutedElements } from "$lib/utils";

  const nodeTypes = {
    value: ValueNode,
    operator: OperatorNode,
  };

  const L = simpleNeuron();
  L.backward();
  const [initialNodes, initialEdges] = formatTrace(L);
  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    initialNodes,
    initialEdges
  );
  const nodes = writable<Node[]>(layoutedNodes);
  const edges = writable<Edge[]>(layoutedEdges);

  function onLayout(direction: string) {
    // $ syntax is because nodes, edges are Svelte stores
    // it means auto-subscription to the internal value
    const layoutedElements = getLayoutedElements($nodes, $edges, direction);
    console.log(layoutedElements.nodes);
    console.log(layoutedElements.edges);
    // re-assignment to trigger rerender
    $nodes = layoutedElements.nodes;
    $edges = layoutedElements.edges;
  }

  let selected = { value: "dark", label: "Dark" };
  $: colorMode = selected.value as ColorMode;
  $: setMode(colorMode);
</script>

<div style="height:100vh;">
  <SvelteFlow
    {nodes}
    {nodeTypes}
    {edges}
    {colorMode}
    fitView
    defaultEdgeOptions={{ type: "bezier", animated: true }}
    proOptions={{ hideAttribution: true }}
  >
    <Panel
      position="top-right"
      class="border rounded-lg p-3 flex flex-col space-y-3"
    >
      <div>
        <Button class="text-xs" on:click={() => onLayout("TB")}>Vertical</Button
        >
        <Button class="text-xs" on:click={() => onLayout("LR")}
          >Horizontal</Button
        >
      </div>
      <Select.Root bind:selected>
        <Select.Trigger class="w-[180px] text-xs">
          <Select.Value placeholder="Theme" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item class="text-xs" value="light">Light</Select.Item>
          <Select.Item class="text-xs" value="dark">Dark</Select.Item>
          <Select.Item class="text-xs" value="system">System</Select.Item>
        </Select.Content>
      </Select.Root>
    </Panel>
    <Controls />
    <Background />
  </SvelteFlow>
</div>
