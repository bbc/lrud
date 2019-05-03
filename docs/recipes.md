# Recipes

Below you can find the Lrud setup for various common scenarios. Hopefully these should help illuminate various points of registering nodes in order to get the desired behaviour.

## Recipe 1 - A "keyboard"

A miniature version of the search keyboard - utilising a grid and some buttons that are wider than others.

```js
navigation.registerNode('keyboard', { orientation: 'vertical', isIndexAlign: true })
    navigation
      .registerNode('row-1', { orientation: 'horizontal' })
      .registerNode('A', { parent: 'row-1', isFocusable: true })
      .registerNode('B', { parent: 'row-1', isFocusable: true })
      .registerNode('C', { parent: 'row-1', isFocusable: true })
      .registerNode('D', { parent: 'row-1', isFocusable: true })
      .registerNode('E', { parent: 'row-1', isFocusable: true })
      .registerNode('F', { parent: 'row-1', isFocusable: true })

    navigation
      .registerNode('row-2', { orientation: 'horizontal' })
      .registerNode('G', { parent: 'row-2', isFocusable: true })
      .registerNode('H', { parent: 'row-2', isFocusable: true })
      .registerNode('I', { parent: 'row-2', isFocusable: true })
      .registerNode('J', { parent: 'row-2', isFocusable: true })
      .registerNode('K', { parent: 'row-2', isFocusable: true })
      .registerNode('L', { parent: 'row-2', isFocusable: true })

    navigation
      .registerNode('row-3', { orientation: 'horizontal' })
      .registerNode('Space', { parent: 'row-3', indexRange: [1, 3], isFocusable: true })
      .registerNode('Delete', { parent: 'row-3', indexRange: [4, 6], isFocusable: true })
```