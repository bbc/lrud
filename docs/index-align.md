# Index Alignment

## What?

Index alignment is used to replicated the behaviour of a "grid" - consider the following scenario:

- there are 2 rows of items, each having 2 items.
- the user is focused on the 2nd item of row 1
- when they press "down", the typical behaviour would be to go to the 2nd row, but on item 1.
    - This is because row 2 has never been focused before, and thus will use its first child.

In this scenario, we want the focus to _actually_ go to the 2nd item of the 2nd row. e.g we want the **indexes to be aligned between the rows**.

## How?

Registering the scenario above as an Lrud tree would look like the following:

```js
const { Lrud } = require('lrud');

const navigation = new Lrud();

navigation
  .register('root', { orientation: 'vertical' })
  .register('row-1', { orientation: 'horizontal' })
  .register('row-1_item-1', { isFocusable: true, parent: 'row-1' })
  .register('row-1_item-2', { isFocusable: true, parent: 'row-1' })
  .register('row-2', { orientation: 'horizontal' })
  .register('row-2_item-1', { isFocusable: true, parent: 'row-1' })
  .register('row-2_item-2', { isFocusable: true, parent: 'row-1' })
```

In order to achieve our index alignment that we desire between the 2 rows, all we need to do is tag their parent (in this case, the `root` node) as `isIndexAlign: true`.

```js
navigation
  .register('root', { orientation: 'vertical', isIndexAlign: true })
  .register('row-1', { orientation: 'horizontal' })
  .register('row-1_item-1', { isFocusable: true, parent: 'row-1' })
  .register('row-1_item-2', { isFocusable: true, parent: 'row-1' })
  .register('row-2', { orientation: 'horizontal' })
  .register('row-2_item-1', { isFocusable: true, parent: 'row-1' })
  .register('row-2_item-2', { isFocusable: true, parent: 'row-1' })
```

Now, when the user enters the 2nd row (whos active child, as its never been focused on, is its first item) they will instead focus on the node that has the same index as the node they just left.

