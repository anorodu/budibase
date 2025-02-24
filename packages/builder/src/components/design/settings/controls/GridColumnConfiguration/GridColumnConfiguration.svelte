<script>
  import {
    getDatasourceForProvider,
    getSchemaForDatasource,
  } from "builderStore/dataBinding"
  import { currentAsset, store } from "builderStore"
  import DraggableList from "../DraggableList/DraggableList.svelte"
  import { createEventDispatcher } from "svelte"
  import FieldSetting from "./FieldSetting.svelte"
  import PrimaryColumnFieldSetting from "./PrimaryColumnFieldSetting.svelte"
  import getColumns from "./getColumns.js"

  export let value
  export let componentInstance

  const dispatch = createEventDispatcher()
  let primaryDisplayColumnAnchor

  const handleChange = newValues => {
    dispatch("change", newValues)
  }

  const getSchema = (asset, datasource) => {
    const schema = getSchemaForDatasource(asset, datasource).schema

    // Don't show ID and rev in tables
    if (schema) {
      delete schema._id
      delete schema._rev
    }

    return schema
  }

  $: datasource = getDatasourceForProvider($currentAsset, componentInstance)
  $: primaryDisplayColumnName = getSchemaForDatasource(
    $currentAsset,
    datasource
  )?.table?.primaryDisplay
  $: schema = getSchema(currentAsset, datasource)
  $: columns = getColumns({
    columns: value,
    schema,
    primaryDisplayColumnName,
    onChange: handleChange,
    createComponent: store.actions.components.createInstance,
  })
</script>

{#if columns.primary}
  <div class="sticky-item">
    <div bind:this={primaryDisplayColumnAnchor} class="sticky-item-inner">
      <div class="right-content">
        <PrimaryColumnFieldSetting
          anchor={primaryDisplayColumnAnchor}
          item={columns.primary}
          on:change={e => columns.update(e.detail)}
        />
      </div>
    </div>
  </div>
{/if}
<DraggableList
  on:change={e => columns.updateSortable(e.detail)}
  on:itemChange={e => columns.update(e.detail)}
  items={columns.sortable}
  listItemKey={"_id"}
  listType={FieldSetting}
/>

<style>
  .right-content {
    flex: 1;
    min-width: 0;
    margin-left: 17.5px;
  }
  .sticky-item {
    list-style-type: none;
    margin: 0;
    padding: 0;
    width: 100%;
    border-radius: 4px;
    background-color: var(
      --spectrum-table-background-color,
      var(--spectrum-global-color-gray-50)
    );
    border: 1px solid
      var(--spectrum-table-border-color, var(--spectrum-alias-border-color-mid));
    margin-bottom: 10px;
  }
  .sticky-item-inner {
    background-color: var(
      --spectrum-table-background-color,
      var(--spectrum-global-color-gray-50)
    );
    transition: background-color ease-in-out 130ms;
    display: flex;
    align-items: center;
    border-bottom: 1px solid
      var(--spectrum-table-border-color, var(--spectrum-alias-border-color-mid));
    padding-left: var(--spacing-s);
    padding-right: var(--spacing-s);
    box-sizing: border-box;
    border-radius: 4px;
    border-bottom: 0;
  }
</style>
