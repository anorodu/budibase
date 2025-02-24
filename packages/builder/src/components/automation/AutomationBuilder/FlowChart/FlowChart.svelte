<script>
  import {
    automationStore,
    selectedAutomation,
    automationHistoryStore,
  } from "builderStore"
  import ConfirmDialog from "components/common/ConfirmDialog.svelte"
  import FlowItem from "./FlowItem.svelte"
  import TestDataModal from "./TestDataModal.svelte"
  import { flip } from "svelte/animate"
  import { fly } from "svelte/transition"
  import { Icon, notifications, Modal } from "@budibase/bbui"
  import { ActionStepID } from "constants/backend/automations"
  import UndoRedoControl from "components/common/UndoRedoControl.svelte"

  export let automation

  let testDataModal
  let confirmDeleteDialog
  let scrolling = false
  $: blocks = getBlocks(automation).filter(x => x.stepId !== ActionStepID.LOOP)
  const getBlocks = automation => {
    let blocks = []
    if (automation.definition.trigger) {
      blocks.push(automation.definition.trigger)
    }
    blocks = blocks.concat(automation.definition.steps || [])
    return blocks
  }

  const deleteAutomation = async () => {
    try {
      await automationStore.actions.delete($selectedAutomation)
    } catch (error) {
      notifications.error("Error deleting automation")
    }
  }

  const handleScroll = e => {
    if (e.target.scrollTop >= 30) {
      scrolling = true
    } else if (e.target.scrollTop) {
      // Set scrolling back to false if scrolled back to less than 100px
      scrolling = false
    }
  }
</script>

<div class="header" class:scrolling>
  <div class="header-left">
    <UndoRedoControl store={automationHistoryStore} />
  </div>
  <div class="controls">
    <div
      on:click={() => {
        testDataModal.show()
      }}
      class="buttons"
    >
      <Icon hoverable size="M" name="Play" />
      <div>Run test</div>
    </div>
    <div class="buttons">
      <Icon
        disabled={!$automationStore.testResults}
        hoverable
        size="M"
        name="Multiple"
      />
      <div
        class:disabled={!$automationStore.testResults}
        on:click={() => {
          $automationStore.showTestPanel = true
        }}
      >
        Test details
      </div>
    </div>
  </div>
</div>
<div class="canvas" on:scroll={handleScroll}>
  <div class="content">
    {#each blocks as block, idx (block.id)}
      <div
        class="block"
        animate:flip={{ duration: 500 }}
        in:fly={{ x: 500, duration: 500 }}
        out:fly|local={{ x: 500, duration: 500 }}
      >
        {#if block.stepId !== ActionStepID.LOOP}
          <FlowItem {testDataModal} {block} {idx} />
        {/if}
      </div>
    {/each}
  </div>
</div>
<ConfirmDialog
  bind:this={confirmDeleteDialog}
  okText="Delete Automation"
  onOk={deleteAutomation}
  title="Confirm Deletion"
>
  Are you sure you wish to delete the automation
  <i>{automation.name}?</i>
  This action cannot be undone.
</ConfirmDialog>

<Modal bind:this={testDataModal} width="30%">
  <TestDataModal />
</Modal>

<style>
  .canvas {
    padding: var(--spacing-l) var(--spacing-xl);
    overflow-y: auto;
    max-height: 100%;
  }

  .header-left :global(div) {
    border-right: none;
  }
  /* Fix for firefox not respecting bottom padding in scrolling containers */
  .canvas > *:last-child {
    padding-bottom: 40px;
  }

  .block {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }

  .content {
    flex-grow: 1;
    padding: 23px 23px 80px;
    box-sizing: border-box;
  }

  .header.scrolling {
    background: var(--background);
    border-bottom: var(--border-light);
    border-left: var(--border-light);
    z-index: 1;
  }

  .header {
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: var(--spacing-l);
    transition: background 130ms ease-out;
    flex: 0 0 48px;
    padding-right: var(--spacing-xl);
  }
  .controls {
    display: flex;
    gap: var(--spacing-xl);
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--spacing-s);
  }

  .buttons:hover {
    cursor: pointer;
  }

  .disabled {
    pointer-events: none;
    color: var(--spectrum-global-color-gray-500) !important;
  }
</style>
