<script lang="ts">
  import { Handle, type NodeProps } from "@xyflow/svelte";
  import type { ValueNodeProps } from "$lib/types";
  import Katex from "$lib/Katex.svelte";

  type $$Props = NodeProps<ValueNodeProps>;

  export let data: $$Props["data"];
  export let sourcePosition: $$Props["sourcePosition"];
  export let targetPosition: $$Props["targetPosition"];

  const { val, grad, label } = data;
</script>

<div
  class="font-mono text-xs flex items-center justify-around border border-black rounded-md py-4 px-3 w-[225px] h-[36px] dark:border-gray-600/75 dark:bg-neutral-800"
>
  {#if targetPosition}
    <Handle type="target" position={targetPosition} />
  {/if}
  <div><Katex math="{label}={grad.toFixed(2)}" /></div>
  <div class="w-[1px] bg-black dark:bg-gray-600 h-[35px]" />
  <div><Katex math="\nabla={val.toFixed(2)}" /></div>
  {#if sourcePosition}
    <Handle type="source" position={sourcePosition} />
  {/if}
</div>
