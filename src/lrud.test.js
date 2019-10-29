/* eslint-env jest */

const { Lrud } = require('./index')

describe('lrud', () => {
  describe('getRootNode()', () => {
    test('return the root node', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')

      const node = navigation.getRootNode()

      expect(node.id).toEqual('root')
    })
  })

  describe('getNode()', () => {
    test('get a nested node with no children by id', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('region-a', { parent: 'root' })
      navigation.registerNode('region-b', { parent: 'root' })
      navigation.registerNode('content-grid', { parent: 'region-b' })
      navigation.registerNode('PID-X', { action: 1, parent: 'content-grid' })
      navigation.registerNode('PID-Y', { action: 2, parent: 'content-grid' })
      navigation.registerNode('PID-Z', { action: 3, parent: 'content-grid' })

      const node = navigation.getNode('PID-X')

      expect(node.parent).toEqual('content-grid')
    })

    test('get a nested node with children by id and make sure the entire tree comes with it', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('region-a', { parent: 'root' })
      navigation.registerNode('DEAD-X', { action: 1, parent: 'region-a' })
      navigation.registerNode('DEAD-Y', { action: 2, parent: 'region-a' })
      navigation.registerNode('DEAD-Z', { action: 3, parent: 'region-a' })
      navigation.registerNode('region-b', { parent: 'root' })
      navigation.registerNode('content-grid', { parent: 'region-b' })
      navigation.registerNode('PID-X', { action: 1, parent: 'content-grid' })
      navigation.registerNode('PID-Y', { action: 2, parent: 'content-grid' })
      navigation.registerNode('PID-Z', { action: 3, parent: 'content-grid' })

      const node = navigation.getNode('region-b')

      expect(node.id).toEqual('region-b')
      expect(node.children['content-grid'].children['PID-X']).not.toBeUndefined()
      expect(node.children['content-grid'].children['PID-Y']).not.toBeUndefined()
      expect(node.children['content-grid'].children['PID-Z']).not.toBeUndefined()
    })
  })

  describe('pickNode()', () => {
    test('pick a nested node', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { selectAction: 1 })
      navigation.registerNode('BOX_A', { selectAction: 2 })
      navigation.registerNode('NODE_1', { selectAction: 11, parent: 'BOX_A' })
      navigation.registerNode('NODE_2', { selectAction: 12, parent: 'BOX_A' })
      navigation.registerNode('NODE_3', { selectAction: 13, parent: 'BOX_A' })

      const node2 = navigation.pickNode('NODE_2')

      expect(node2.selectAction).toEqual(12)
      expect(node2.parent).toEqual('BOX_A')
      expect(navigation.tree.root.children['BOX_A'].children['NODE_2']).toBeUndefined()
    })
  })

  describe('assignFocus()', () => {
    test('assigning focus should set the `activeChild` of all the nodes back up the tree', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('region-a', { parent: 'root' })
      navigation.registerNode('region-b', { parent: 'root' })
      navigation.registerNode('content-grid', { parent: 'region-b' })
      navigation.registerNode('PID-X', { selectAction: 1, parent: 'content-grid' })
      navigation.registerNode('PID-Y', { selectAction: 2, parent: 'content-grid' })
      navigation.registerNode('PID-Z', { selectAction: 3, parent: 'content-grid' })

      navigation.assignFocus('PID-Y')

      expect(navigation.getNode('content-grid').activeChild).toEqual('PID-Y')
      expect(navigation.getNode('region-b').activeChild).toEqual('content-grid')
      expect(navigation.getNode('root').activeChild).toEqual('region-b')
    })

    test('assigning focus should set the currentFocusNodeId of the instance', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { parent: 'root', isFocusable: true })
      navigation.registerNode('b', { parent: 'root', isFocusable: true })
      navigation.registerNode('c', { parent: 'root', isFocusable: true })

      navigation.assignFocus('b')

      expect(navigation.currentFocusNodeId).toEqual('b')
      expect(navigation.getNode('root').activeChild).toEqual('b')
    })
  })

  describe('climbUp()', () => {
    test('scan up the tree 1 level', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'vertical' })
      navigation.registerNode('BOX_A', { parent: 'root', orientation: 'horizontal' })
      navigation.registerNode('BOX_B', { parent: 'root', orientation: 'horizontal' })
      navigation.registerNode('NODE_1', { parent: 'BOX_B', isFocusable: true })
      navigation.registerNode('NODE_2', { parent: 'BOX_B', isFocusable: true })
      navigation.registerNode('NODE_3', { parent: 'BOX_B', isFocusable: true })

      navigation.assignFocus('NODE_2')

      const nextActionableNode = navigation.climbUp(navigation.getNode('NODE_2'), 'right')

      expect(nextActionableNode.id).toEqual('BOX_B')
    })

    test('scan up the tree 2 levels', () => {
      const navigation = new Lrud()
      navigation.registerNode('root', { orientation: 'vertical' })
      navigation.registerNode('page', { parent: 'root', orientation: 'horizontal' })
      navigation.registerNode('BOX_A', { parent: 'page', orientation: 'vertical' })
      navigation.registerNode('BOX_B', { parent: 'page', orientation: 'vertical' })
      navigation.registerNode('NODE_1', { parent: 'BOX_A', isFocusable: true })
      navigation.registerNode('NODE_2', { parent: 'BOX_A', isFocusable: true })
      navigation.registerNode('NODE_3', { parent: 'BOX_A', isFocusable: true })
      navigation.registerNode('NODE_4', { parent: 'BOX_B', isFocusable: true })
      navigation.registerNode('NODE_5', { parent: 'BOX_B', isFocusable: true })
      navigation.registerNode('NODE_6', { parent: 'BOX_B', isFocusable: true })

      navigation.assignFocus('NODE_1')

      const nextActionableNode = navigation.climbUp(navigation.getNode('NODE_1'), 'right')

      // the parent of NODE_1 is BOX_A but we couldn't dig up to that because it was horizontal
      // and the next thing that was horizontal was the page
      expect(nextActionableNode.id).toEqual('page')
    })
  })

  describe('getNextChildInDirection()', () => {
    test('with no order values, get the next child of a node', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'horizontal' })
      navigation.registerNode('alpha', { id: 'alpha', parent: 'root', isFocusable: true })
      navigation.registerNode('beta', { id: 'beta', parent: 'root', isFocusable: true })
      navigation.registerNode('charlie', { id: 'charlie', parent: 'root', isFocusable: true })

      // default active child of 'root' is 'alpha'
      let nextChild = navigation.getNextChildInDirection(navigation.getNode('root'), 'right')

      expect(nextChild.id).toEqual('beta')

      // so then we assign focus to 'beta' and go again
      navigation.assignFocus('beta')
      nextChild = navigation.getNextChildInDirection(navigation.getNode('root'), 'right')

      expect(nextChild.id).toEqual('charlie')
    })

    test('with no order values, if the activeChild is the last child, just return that', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'horizontal' })
      navigation.registerNode('alpha', { id: 'alpha', parent: 'root', isFocusable: true })
      navigation.registerNode('beta', { id: 'beta', parent: 'root', isFocusable: true })
      navigation.registerNode('charlie', { id: 'charlie', parent: 'root', isFocusable: true })

      navigation.assignFocus('charlie')

      // we're already focused on the last child of root, so it should return that
      let nextChild = navigation.getNextChildInDirection(navigation.getNode('root'), 'right')
      expect(nextChild.id).toEqual('charlie')
    })

    test('horizontal list, direction: right', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'horizontal' })
      navigation.registerNode('a')
      navigation.registerNode('b')
      navigation.registerNode('c')

      const child = navigation.getNextChildInDirection(navigation.getNode('root'), 'right')

      expect(child.id).toEqual('b')
    })

    test('horizontal list, direction: left', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'horizontal' })
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })

      navigation.assignFocus('b')

      const child = navigation.getNextChildInDirection(navigation.getNode('root'), 'left')

      expect(child.id).toEqual('a')
    })

    test('vertical list, direction: down', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'vertical' })
      navigation.registerNode('a')
      navigation.registerNode('b')
      navigation.registerNode('c')

      const child = navigation.getNextChildInDirection(navigation.getNode('root'), 'down')

      expect(child.id).toEqual('b')
    })

    test('vertical list, direction: up', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'vertical' })
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })

      navigation.assignFocus('b')

      const child = navigation.getNextChildInDirection(navigation.getNode('root'), 'up')

      expect(child.id).toEqual('a')
    })
  })

  describe('digDown()', () => {
    test('dig down 2 levels', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'horizontal' })

      navigation.registerNode('left_column', { parent: 'root', orientation: 'vertical' })
      navigation.registerNode('right_column', { parent: 'root', orientation: 'vertical' })

      navigation.registerNode('NODE_A', { id: 'NODE_A', parent: 'left_column', isFocusable: true })
      navigation.registerNode('NODE_B', { id: 'NODE_B', parent: 'left_column', isFocusable: true })

      navigation.registerNode('NODE_C', { id: 'NODE_C', parent: 'right_column', isFocusable: true })
      navigation.registerNode('NODE_D', { id: 'NODE_D', parent: 'right_column', isFocusable: true })

      // first focusable of 'root' should be 'NODE_A'
      const root = navigation.getNode('root')
      const focusable = navigation.digDown(root)
      expect(focusable.id).toEqual('NODE_A')
    })
  })

  describe('getNextChild()', () => {
    test('get the next child when children were added without indexes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })
      navigation.registerNode('d', { isFocusable: true })

      navigation.assignFocus('b')

      const root = navigation.getNode('root')

      expect(navigation.getNextChild(root).id).toEqual('c')
    })

    test('get the next child when children were added with indexes, out of order', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 2, isFocusable: true })
      navigation.registerNode('b', { index: 4, isFocusable: true })
      navigation.registerNode('c', { index: 3, isFocusable: true })
      navigation.registerNode('d', { index: 1, isFocusable: true })

      navigation.assignFocus('d')

      const root = navigation.getNode('root')

      expect(navigation.getNextChild(root).id).toEqual('a')
    })

    test('if node is already focused on the last child, regardless of index, return that child', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 2, isFocusable: true })
      navigation.registerNode('b', { index: 4, isFocusable: true })
      navigation.registerNode('c', { index: 3, isFocusable: true })
      navigation.registerNode('d', { index: 1, isFocusable: true })

      navigation.assignFocus('b')

      const root = navigation.getNode('root')

      expect(navigation.getNextChild(root).id).toEqual('b')
    })
  })

  describe('getPrevChild()', () => {
    test('get the prev child when children were added without indexes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })
      navigation.registerNode('d', { isFocusable: true })

      navigation.assignFocus('c')

      const root = navigation.getNode('root')

      expect(navigation.getPrevChild(root).id).toEqual('b')
    })

    test('get the prev child when children were added with indexes, out of order', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 2, isFocusable: true })
      navigation.registerNode('b', { index: 4, isFocusable: true })
      navigation.registerNode('c', { index: 3, isFocusable: true })
      navigation.registerNode('d', { index: 1, isFocusable: true })

      navigation.assignFocus('b')

      const root = navigation.getNode('root')

      expect(navigation.getPrevChild(root).id).toEqual('c')
    })

    test('if node is already focused on the first child, regardless of index, return that child', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 2, isFocusable: true })
      navigation.registerNode('b', { index: 4, isFocusable: true })
      navigation.registerNode('c', { index: 3, isFocusable: true })
      navigation.registerNode('d', { index: 1, isFocusable: true })

      navigation.assignFocus('d')

      const root = navigation.getNode('root')

      expect(navigation.getPrevChild(root).id).toEqual('d')
    })
  })

  describe('getNodeFirstChild()', () => {
    test('should return child with index of 1 - added without indexes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a')
      navigation.registerNode('b')
      navigation.registerNode('c')

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstChild(root).id).toEqual('a')
    })

    test('should return child with index of 1 - added out of order, with indexes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 2 })
      navigation.registerNode('b', { index: 1 })
      navigation.registerNode('c', { index: 3 })

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstChild(root).id).toEqual('b')
    })
  })

  describe('getNodeLastChild()', () => {
    test('should return child with last index - added without indexes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a')
      navigation.registerNode('b')
      navigation.registerNode('c')

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastChild(root).id).toEqual('c')
    })

    test('should return child with last index - added with indexes, out of order', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 3 })
      navigation.registerNode('b', { index: 1 })
      navigation.registerNode('c', { index: 2 })

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastChild(root).id).toEqual('a')
    })
  })

  describe('reindexChildrenOfNode', () => {
    test('deleting a leaf should re-index the other leaves when leaves are added without indexes', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('c', { index: 9 })
        .registerNode('a', { index: 4 })
        .registerNode('d', { index: 13 })
        .registerNode('b', { index: 6 })

      let root = navigation.getNode('root')
      root = navigation.reindexChildrenOfNode(root)

      expect(root.children.a.index).toEqual(0)
      expect(root.children.b.index).toEqual(1)
      expect(root.children.c.index).toEqual(2)
      expect(root.children.d.index).toEqual(3)
    })

    test('test it through unregister', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('c', { index: 9 })
        .registerNode('a', { index: 4 })
        .registerNode('e', { index: 16 })
        .registerNode('d', { index: 13 })
        .registerNode('b', { index: 6 })

      navigation.unregisterNode('e')

      expect(navigation.getNode('a').index).toEqual(0)
      expect(navigation.getNode('b').index).toEqual(1)
      expect(navigation.getNode('c').index).toEqual(2)
      expect(navigation.getNode('d').index).toEqual(3)
    })
  })

  describe('updateNode', () => {
    test('updating a property should change the property on the node', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a', { isFocusable: true })

      navigation.updateNode('a', { isFocusable: false, isIndexAlign: true })

      expect(navigation.getNode('a').isFocusable).toEqual(false)
      expect(navigation.getNode('a').isIndexAlign).toEqual(true)
    })

    test('making a previously focusable node unfocusable should remove it from the list of focusable nodes', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a', { isFocusable: true })

      navigation.updateNode('a', { isFocusable: false })

      expect(navigation.focusableNodePathList).not.toEqual(expect.arrayContaining(['root.children.a']))
    })

    test('current focus should not be updated when updating a node', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a', { isFocusable: true })
        .registerNode('b', { isFocusable: true })

      navigation.assignFocus('b')
      navigation.updateNode('a', { isFocusable: false })

      expect(navigation.currentFocusNodeId).toEqual('b')
    })

    test('node indexes should not change unless specified', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a', { isFocusable: true, orientation: 'horizontal' })
        .registerNode('b', { isFocusable: true, parent: 'a' })
        .registerNode('c', { isFocusable: true, parent: 'a' })

      navigation.assignFocus('c')
      navigation.updateNode('b', { isFocusable: false })

      expect(navigation.getNode('c').index).toEqual(1)
      expect(navigation.getNode('b').index).toEqual(0)
    })

    test('children of a node should remain unaltered if id is not changed', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a', { isFocusable: true, orientation: 'horizontal' })
        .registerNode('b', { isFocusable: true, parent: 'a' })
        .registerNode('c', { isFocusable: true, parent: 'a' })

      navigation.assignFocus('c')
      navigation.updateNode('a', { isFocusable: false })

      expect(navigation.getNode('c').index).toEqual(1)
      expect(navigation.getNode('c').parent).toEqual('a')
      expect(navigation.getNode('c').isFocusable).toEqual(true)
      expect(navigation.currentFocusNodeId).toEqual('c')
    })

    test('should recalculate node focus if currentNode is set to be unfocusable', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root', { orientation: 'vertical' }) // Orientation must be set on root or the focus recalculation fails
        .registerNode('a', { isFocusable: true, orientation: 'horizontal' })
        .registerNode('b', { isFocusable: true, parent: 'a' })
        .registerNode('c', { isFocusable: true, parent: 'a' })
        .registerNode('d', { isFocusable: true, parent: 'root' })

      navigation.assignFocus('c')

      navigation.updateNode('c', { isFocusable: false })
      expect(navigation.currentFocusNodeId).not.toBeUndefined()
      expect(navigation.currentFocusNodeId).not.toEqual('c')
    })
  })
})
