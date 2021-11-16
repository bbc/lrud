# Recipes

Below you can find the Lrud setup for various common scenarios. Hopefully these should help illuminate various points of registering nodes in order to get the desired behaviour.

## Recipe 1 - A "keyboard"

A miniature version of a search keyboard - utilising a grid and some buttons that are wider than others.

```js
navigation.registerNode('keyboard', { orientation: 'vertical', isIndexAlign: true })
navigation
  .registerNode('row-1', { orientation: 'horizontal' }) // note we don't explicitly set the parent - so Lrud assumes the root node
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
  .registerNode('Space', { parent: 'row-3', indexRange: [1, 3], isFocusable: true })    // these buttons are wider, so are given index ranges
  .registerNode('Delete', { parent: 'row-3', indexRange: [4, 6], isFocusable: true })   // these buttons are wider, so are given index ranges
```

## Recipe 2 - A series of wrapping rows

Representing multiple horizontal rows of content that a user could be browsing, where navigating past the end of a row should return the user focus to the start of that row. _But_, the rows are _not_ a grid, and going down from the middle of one row should put the user focus to the start of the next row.

```js
navigation.registerNode('root', { orientation: 'vertical' })

navigation
  .registerNode('row-1', { parent: 'root', orientation: 'horizontal', isWrapping: true })
  .registerNode('row-1-item-1', { parent: 'row-1', isFocusable: true })
  .registerNode('row-1-item-2', { parent: 'row-1', isFocusable: true })

navigation
  .registerNode('row-2', { parent: 'root', orientation: 'horizontal', isWrapping: true })
  .registerNode('row-2-item-1', { parent: 'row-2', isFocusable: true })
  .registerNode('row-2-item-2', { parent: 'row-2', isFocusable: true })
```

## Recipe 3 - Moving between nested `isIndexAlign: true` nodes e.g nested grids

See `docs/test-diagrams/fig-2.png` for the diagram of how this looks rendered out.

We sometimes want to have 2 nodes that are affected by their parent's `isIndexAlign: true`, that are _themselves_ also `isIndexAlign: true`.

This could be thought of as "nested grids".

```js
const navigation = new Lrud()

navigation.registerNode('root', { orientation: 'vertical', isIndexAlign: true })

navigation
  .registerNode('grid-a', { parent: 'root', orientation: 'vertical', isIndexAlign: true })
  .registerNode('grid-a-row-1', { parent: 'grid-a', orientation: 'horizontal' })
  .registerNode('grid-a-row-1-col-1', { parent: 'grid-a-row-1', isFocusable: true })
  .registerNode('grid-a-row-1-col-2', { parent: 'grid-a-row-1', isFocusable: true })
  .registerNode('grid-a-row-2', { parent: 'grid-a', orientation: 'horizontal' })
  .registerNode('grid-a-row-2-col-1', { parent: 'grid-a-row-2', isFocusable: true })
  .registerNode('grid-a-row-2-col-2', { parent: 'grid-a-row-2', isFocusable: true })

navigation
  .registerNode('grid-b', { parent: 'root', orientation: 'vertical', isIndexAlign: true })
  .registerNode('grid-b-row-1', { parent: 'grid-b', orientation: 'horizontal' })
  .registerNode('grid-b-row-1-col-1', { parent: 'grid-b-row-1', isFocusable: true })
  .registerNode('grid-b-row-1-col-2', { parent: 'grid-b-row-1', isFocusable: true })
  .registerNode('grid-b-row-2', { parent: 'grid-b', orientation: 'horizontal' })
  .registerNode('grid-b-row-2-col-1', { parent: 'grid-b-row-2', isFocusable: true })
  .registerNode('grid-b-row-2-col-2', { parent: 'grid-b-row-2', isFocusable: true })
```

## Recipe 4 - Cancelling moves due to external business logic

Perhaps you have a system where you only want a user to be able to navigate to a specific section of a page/app if some external logic authorizes and allows that move.

Thanks to `shouldCancel` functions, we can block that movement.

```js
const shouldCancelEnterItem = () => {
  return !userPermissions.canSelectItem();
}

navigation.registerNode('root', { orientation: 'horizontal' })

navigation
  .registerNode('left-col', { orientation: 'vertical' })
  .registerNode('item-1', { parent: 'left-col', isFocusable: true })
  .registerNode('item-2', { parent: 'left-col', isFocusable: true })

navigation
  .registerNode('right-col', { orientation: 'vertical' })
  .registerNode('item-a', { parent: 'right-col', shouldCancelEnter: shouldCancelEnterItem, isFocusable: true })
  .registerNode('item-b', { parent: 'right-col', shouldCancelEnter: shouldCancelEnterItem, isFocusable: true })

navigation.assignFocus('item-1')
```

With the setup above, if the user attempted to select `item-a`, or `item-b`, `shouldCancelEnterItem()` would be run. If this function returned `true`, that movement would be blocked, and focus would remain on `item-1`.

## Recipe 5 - Error Modal Popup

Leaving `orientation` undefined in parent node allows creating closed boxes, from which focus can not "jump out". It's the best to think about modal popups with semi transparent overlay here. It may contain Ok/Cancel buttons and focus must be moved only around those buttons. The rest of the page is still visible in the background and LRUD navigation tree may stay untouched.

Following example simulates such popup. Press `enter` on any child node of `mainPage` to move focus to `errorPopup` and on any popup button to move focus back to `mainPage`. Note that you can navigate only within the `mainPage` or `errorPopup`. You cannot move focus between those two regions without pressing `enter`.

```js
const toMainPage = () => navigation.assignFocus('mainPage')
const toErrorPopup = () => navigation.assignFocus('errorPopup')

navigation.registerNode('root', { orientation: undefined })

navigation.registerNode('mainPage', { parent: 'root', orientation: 'vertical', isIndexAlign: true })
    .registerNode('row0', { parent: 'mainPage', orientation: 'horizontal' })
        .registerNode('card0', { parent: 'row0', isFocusable: true, onSelect: toErrorPopup })
        .registerNode('card1', { parent: 'row0', isFocusable: true, onSelect: toErrorPopup })
        .registerNode('card2', { parent: 'row0', isFocusable: true, onSelect: toErrorPopup })
    .registerNode('row1', { parent: 'mainPage', orientation: 'horizontal' })
        .registerNode('card3', { parent: 'row1', isFocusable: true, onSelect: toErrorPopup })
        .registerNode('card4', { parent: 'row1', isFocusable: true, onSelect: toErrorPopup })
        .registerNode('card5', { parent: 'row1', isFocusable: true, onSelect: toErrorPopup })

navigation.registerNode('errorPopup', { parent: 'root', orientation: 'horizontal' })
    .registerNode('okButton', { parent: 'errorPopup', isFocusable: true, onSelect: toMainPage })
    .registerNode('cancelButon', { parent: 'errorPopup', isFocusable: true, onSelect: toMainPage })

navigation.assignFocus('card0')
```
