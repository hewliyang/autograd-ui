<script lang="ts">
  import { Handle, type NodeProps } from "@xyflow/svelte";
  import type { OperatorNodeProps } from "$lib/types";
  import Katex from "$lib/Katex.svelte";

  type $$Props = NodeProps<OperatorNodeProps>;

  export let data: $$Props["data"];
  export let sourcePosition: $$Props["sourcePosition"];
  export let targetPosition: $$Props["targetPosition"];

  const { op } = data;
</script>

<div
  class="text-xs border border-black dark:border-gray-600/75 dark:bg-neutral-800 rounded-full h-[48px] w-[56px] items-center flex justify-center antialiased"
>
  {#if targetPosition}
    <Handle type="target" position={targetPosition} />
  {/if}
  <Katex math={op} />
  {#if sourcePosition}
    <Handle type="source" position={sourcePosition} />
  {/if}
</div>
