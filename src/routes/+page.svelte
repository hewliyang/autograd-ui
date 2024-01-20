<script lang="ts">
  import { writable, type Writable } from "svelte/store";
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
  import * as Collapsible from "$lib/components/ui/collapsible";
  import ValueNode from "$lib/components/graph/ValueNode.svelte";
  import { setMode } from "mode-watcher";
  import OperatorNode from "$lib/components/graph/OperatorNode.svelte";
  import {
    simpleArithmetic,
    simpleNeuron,
    multiLayerPerceptron,
  } from "$lib/example-graphs";
  import {
    formatTrace,
    getLayoutedElements,
    sleep,
    updateEdge,
  } from "$lib/utils";
  import type { BackwardInfo, Value } from "$lib/micrograd/engine";
  import { CaretSort } from "radix-icons-svelte";

  const nodeTypes = {
    value: ValueNode,
    operator: OperatorNode,
  };
  let nodes: Writable<Node[]> = writable([]);
  let edges: Writable<Edge[]> = writable([]);

  let examples = { value: simpleNeuron(), label: "Simple" };
  $: loss = examples.value;

  function initGraph(loss: Value) {
    const [initialNodes, initialEdges] = formatTrace(loss);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    $nodes = layoutedNodes;
    $edges = layoutedEdges;
  }

  $: initGraph(loss);

  // store the backward instructions
  function onBackward(loss: Value) {
    return loss.verboseBackward();
  }

  let backward: BackwardInfo[];
  $: backward = onBackward(loss);

  let step = -1;
  function onStep(step: number) {
    if (step < 0) return;
    const _edges = updateEdge(backward[step], $edges);

    // reassign
    $edges = _edges;
  }

  $: onStep(step);

  async function autoBackwards() {
    for (const ins of backward) {
      const _edges = updateEdge(ins, $edges);
      $edges = _edges;

      await sleep(250);
    }
  }

  function reset() {
    initGraph(loss);
    step = -1;
  }

  function onLayout(direction: string) {
    // $ syntax is because nodes, edges are Svelte stores
    // it means auto-subscription to the internal value
    const layoutedElements = getLayoutedElements($nodes, $edges, direction);
    // re-assignment to trigger rerender
    $nodes = layoutedElements.nodes;
    $edges = layoutedElements.edges;
  }

  let selectedTheme = { value: "dark", label: "Dark" };
  $: colorMode = selectedTheme.value as ColorMode;
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
      <Collapsible.Root>
        <div class="flex items-center justify-between space-x-2">
          <h4 class="text-sm font-semibold">Controls</h4>
          <Collapsible.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              variant="ghost"
              size="sm"
              class="w-9 p-0"
            >
              <CaretSort class="h-4 w-4" />
              <span class="sr-only">Toggle</span>
            </Button>
          </Collapsible.Trigger>
        </div>
        <Collapsible.Content class="mt-3 grid grid-cols-2 gap-2 max-w-[250px]">
          <Button class="text-xs" on:click={() => onLayout("TB")}
            >Vertical</Button
          >
          <Button class="text-xs" on:click={() => onLayout("LR")}
            >Horizontal</Button
          >
          <Button
            class="text-xs"
            on:click={() => {
              step++;
            }}>Step</Button
          >
          <Button class="text-xs" on:click={() => autoBackwards()}>Cycle</Button
          >
          <Button class="text-xs" on:click={() => reset()}>Reset</Button>
          <Select.Root bind:selected={selectedTheme}>
            <Select.Trigger class="w-[180px] text-xs">
              <Select.Value placeholder="Theme" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item class="text-xs" value="light">Light</Select.Item>
              <Select.Item class="text-xs" value="dark">Dark</Select.Item>
              <Select.Item class="text-xs" value="system">System</Select.Item>
            </Select.Content>
          </Select.Root>
        </Collapsible.Content>
      </Collapsible.Root>
    </Panel>
    <Controls />
    <Background />
  </SvelteFlow>
</div>
