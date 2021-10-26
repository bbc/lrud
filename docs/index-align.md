# Index Alignment

## What?

Index alignment is used to replicate the behaviour of a "grid" - consider the following scenario:

- there are 2 rows of items, each having 2 items.
- the user is focused on the 2nd item of the 1st row
- when they press "down", the typical behaviour would be to go to the 1st item of the 2nd row
    - This is because row 2 has never been focused before, and thus its `activeChild` is its first child.

In this scenario, we want the focus to _actually_ go to the **2nd** item of the 2nd row. e.g. we want the **indexes to be aligned between the rows**.

## How?

Registering the scenario above as a Lrud tree would look like the following:

```js
const { Lrud } = require('lrud');

const navigation = new Lrud();

navigation
  .register('root', { orientation: 'vertical' })
  .register('row-1', { orientation: 'horizontal' })
  .register('row-1_item-1', { isFocusable: true, parent: 'row-1' })
  .register('row-1_item-2', { isFocusable: true, parent: 'row-1' })
  .register('row-2', { orientation: 'horizontal' })
  .register('row-2_item-1', { isFocusable: true, parent: 'row-2' })
  .register('row-2_item-2', { isFocusable: true, parent: 'row-2' })
```

In order to achieve our index alignment that we desire between the 2 rows, all we need to do is tag their parent (in this case, the `root` node) as `isIndexAlign: true`.

```js
navigation
  .register('root', { orientation: 'vertical', isIndexAlign: true })
  .register('row-1', { orientation: 'horizontal' })
  .register('row-1_item-1', { isFocusable: true, parent: 'row-1' })
  .register('row-1_item-2', { isFocusable: true, parent: 'row-1' })
  .register('row-2', { orientation: 'horizontal' })
  .register('row-2_item-1', { isFocusable: true, parent: 'row-2' })
  .register('row-2_item-2', { isFocusable: true, parent: 'row-2' })
```

Now, when the user enters the 2nd row (whose active child, as its never been focused on, is its first item) they will instead focus on the node that has the same index as the node they just left.

## Column spans?

Lrud supports the idea of a "column span". This is useful for situations where there are rows of content with different numbers of items.

Consider the following Lrud navigation:

```js
navigation
  .register('root', { orientation: 'vertical', isIndexAlign: true })
  .register('row-1', { orientation: 'horizontal' })
  .register('row-1_item-1', { isFocusable: true, parent: 'row-1' })
  .register('row-1_item-2', { isFocusable: true, parent: 'row-1' })
  .register('row-1_item-3', { isFocusable: true, parent: 'row-1' })
  .register('row-1_item-4', { isFocusable: true, parent: 'row-1' })
  .register('row-2', { orientation: 'horizontal' })
  .register('row-2_item-1', { isFocusable: true, parent: 'row-2' })
  .register('row-2_item-2', { isFocusable: true, parent: 'row-2' })
```

When focused on `row-1_item-2` and handling a "down" event, the naive behaviour would be to focus on `row-2_item-2`.

However, perhaps _visually_ each item on row 2 takes up the effective width of 2 items on row 1.

In order to make Lrud understand that these indexes need to align, the following change can be made:

```js
navigation
  .register('root', { orientation: 'vertical', isIndexAlign: true })
  .register('row-1', { orientation: 'horizontal' })
  .register('row-1_item-1', { isFocusable: true, parent: 'row-1', index: 0 })
  .register('row-1_item-2', { isFocusable: true, parent: 'row-1', index: 1 })
  .register('row-1_item-3', { isFocusable: true, parent: 'row-1', index: 2 })
  .register('row-1_item-4', { isFocusable: true, parent: 'row-1', index: 3 })
  .register('row-2', { orientation: 'horizontal' })
  .register('row-2_item-1', { isFocusable: true, parent: 'row-2', indexRange: [0, 1] })
  .register('row-2_item-2', { isFocusable: true, parent: 'row-2', indexRange: [2, 3] })
```

Note the `indexRange` values on the 2nd row items. Every definition of an `indexRange` should be an array with 2 values - the inclusive lower and upper bound of indexes that this node is covering.

## Nested Grids

LRUD has limited support for nested grid functionality.

A nested grid is where we want 2 grids, that are each behaving as grids independently, to be index aligned _between_ each other.

Consider the following scenario.

```js
navigation.registerNode('root', { orientation: 'horizontal' })

navigation
  .registerNode('grid1', { parent: 'root', orientation: 'vertical', isIndexAlign: true })
  .registerNode('grid1_row1', { parent: 'grid1', orientation: 'horizontal' })
  .registerNode('grid1_item1', { parent: 'grid1_row1', isFocusable: true })
  .registerNode('grid1_item2', { parent: 'grid1_row1', isFocusable: true })
  .registerNode('grid1_item3', { parent: 'grid1_row1', isFocusable: true })
  .registerNode('grid1_row2', { parent: 'grid1', orientation: 'horizontal' })
  .registerNode('grid1_item4', { parent: 'grid1_row2', isFocusable: true })
  .registerNode('grid1_item5', { parent: 'grid1_row2', isFocusable: true })
  .registerNode('grid1_item6', { parent: 'grid1_row2', isFocusable: true })

navigation
  .registerNode('grid2', { parent: 'root', orientation: 'vertical', isIndexAlign: true })
  .registerNode('grid2_row1', { parent: 'grid2', orientation: 'horizontal' })
  .registerNode('grid2_item1', { parent: 'grid2_row1', isFocusable: true })
  .registerNode('grid2_item2', { parent: 'grid2_row1', isFocusable: true })
  .registerNode('grid2_item3', { parent: 'grid2_row1', isFocusable: true })
  .registerNode('grid2_row2', { parent: 'grid2', orientation: 'horizontal' })
  .registerNode('grid2_item4', { parent: 'grid2_row2', isFocusable: true })
  .registerNode('grid2_item5', { parent: 'grid2_row2', isFocusable: true })
  .registerNode('grid2_item6', { parent: 'grid2_row2', isFocusable: true })
```

We have 2 "grids", each with 2 rows and 3 items per row. As the `root` node is `orientation: 'horizontal'`, these 2 grids would be sat next to each other horizontally.

If the user was focused on `grid1_item6` (the last item of the 2nd row of the grid on the left) and the user pressed `right`, ordinally, LRUD would then put your focus onto `grid2_item1` (the first focusable `activeChild` of the grid on the right).

But what if we wanted the grids themselves to be index aligned between each other?

It may make sense to _instead_ have the focus land on `grid2_item4` (the _first_ item of 2nd row of the grid on the right). This would be as though the users focus had "hopped over" to the 2nd grid, and landed in the "closest" place.

In order to make this happen, all we have to do is add an `isIndexAlign: true` to the root node (the parent of the 2 grids).

### Nested Grid Limitations

Nested grids currently only work 1 level deep, and support for nested grids working with index ranges varies from minimal to untested.

If you encounter a scenario with a nested grid that you think should work and isn't doing, feel free to open a Github issue.