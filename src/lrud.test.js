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
      expect(navigation.currentFocusNodePath).toEqual('root.children.b')
      expect(navigation.currentFocusNode).toEqual(navigation.getNode('b'))
      expect(navigation.getNode('root').activeChild).toEqual('b')
    })

    test('should focus focusable child of focusable node when focused indirectly, focusing leaf', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { parent: 'root', isFocusable: true, orientation: 'vertical' })
      navigation.registerNode('aa', { parent: 'a', isFocusable: true })

      navigation.assignFocus('root')

      expect(navigation.currentFocusNodeId).toEqual('aa')
    })

    test('should focus focusable node containing focusable children when focused indirectly when stop propagate enabled', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { parent: 'root', isFocusable: true, isStopPropagate: true, orientation: 'vertical' })
      navigation.registerNode('aa', { parent: 'a', isFocusable: true })

      navigation.assignFocus('root')

      expect(navigation.currentFocusNodeId).toEqual('a')
    })

    test('should focus focusable node containing focusable children when focused directly', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { parent: 'root', isFocusable: true, orientation: 'vertical' })
      navigation.registerNode('aa', { parent: 'a', isFocusable: true })

      navigation.assignFocus('a')

      expect(navigation.currentFocusNodeId).toEqual('a')
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

    test('should avoid infinite scan when root node reached', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', {orientation: 'horizontal'})
      navigation.registerNode('undefined', {parent: 'root', isFocusable: true})

      navigation.assignFocus('undefined')

      expect(
        () => navigation.climbUp(navigation.getNode('undefined'), 'right')
      ).not.toThrow({name: 'RangeError', message: 'Maximum call stack size exceeded'})
    })
  })

  describe('getNextFocusableChildInDirection()', () => {
    test('with no order values, get the next child of a node', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'horizontal' })
      navigation.registerNode('alpha', { id: 'alpha', parent: 'root', isFocusable: true })
      navigation.registerNode('beta', { id: 'beta', parent: 'root', isFocusable: true })
      navigation.registerNode('charlie', { id: 'charlie', parent: 'root', isFocusable: true })

      navigation.assignFocus('alpha')

      let nextChild = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'right')

      expect(nextChild.id).toEqual('beta')

      // so then we assign focus to 'beta' and go again
      navigation.assignFocus('beta')
      nextChild = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'right')

      expect(nextChild.id).toEqual('charlie')
    })

    test('with no order values, if the activeChild is the last child, just return nothing', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'horizontal' })
      navigation.registerNode('alpha', { id: 'alpha', parent: 'root', isFocusable: true })
      navigation.registerNode('beta', { id: 'beta', parent: 'root', isFocusable: true })
      navigation.registerNode('charlie', { id: 'charlie', parent: 'root', isFocusable: true })

      navigation.assignFocus('charlie')

      // we're already focused on the last child of root, so it should return that
      const nextChild = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'right')
      expect(nextChild).toBeFalsy()
    })

    test('horizontal list, direction: right', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'horizontal' })
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })

      navigation.assignFocus('a')

      const child = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'right')

      expect(child.id).toEqual('b')
    })

    test('horizontal list, direction: left', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'horizontal' })
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })

      navigation.assignFocus('b')

      const child = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'left')

      expect(child.id).toEqual('a')
    })

    test('vertical list, direction: down', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'vertical' })
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })

      navigation.assignFocus('a')

      const child = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'down')

      expect(child.id).toEqual('b')
    })

    test('vertical list, direction: up', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'vertical' })
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })

      navigation.assignFocus('b')

      const child = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'up')

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

  describe('getNextFocusableChild()', () => {
    test('get the next focusable child when children were added without indexes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })
      navigation.registerNode('d', { isFocusable: true })

      navigation.assignFocus('b')

      const root = navigation.getNode('root')

      expect(navigation.getNextFocusableChild(root).id).toEqual('c')
    })

    test('get the next focusable child when children were added with indexes, out of order', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 0, isFocusable: true }) // order: |a|
      navigation.registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
      navigation.registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
      navigation.registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      navigation.assignFocus('d')

      const root = navigation.getNode('root')

      expect(navigation.getNextFocusableChild(root).id).toEqual('a')
    })

    test('if node is already focused on the last child, regardless of index, return nothing', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 0, isFocusable: true }) // order: |a|
      navigation.registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
      navigation.registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
      navigation.registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      navigation.assignFocus('b')

      const root = navigation.getNode('root')

      expect(navigation.getNextFocusableChild(root)).toBeUndefined()
    })

    test('if node has no children, return nothing and not fail', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      const root = navigation.getNode('root')

      let nextFocusableChild = root
      expect(() => {
        nextFocusableChild = navigation.getNextFocusableChild(root)
      }).not.toThrow()

      expect(nextFocusableChild).toBeUndefined()
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
      navigation.registerNode('root')

      let nextFocusableChild = navigation.getRootNode()
      expect(() => {
        nextFocusableChild = navigation.getNextFocusableChild(navigation.getNode('not_existing'))
      }).not.toThrow()

      expect(nextFocusableChild).toBeUndefined()
    })
  })

  describe('getPrevFocusableChild()', () => {
    test('get the prev focusable child when children were added without indexes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })
      navigation.registerNode('d', { isFocusable: true })

      navigation.assignFocus('c')

      const root = navigation.getNode('root')

      expect(navigation.getPrevFocusableChild(root).id).toEqual('b')
    })

    test('get the prev focusable child when children were added with indexes, out of order', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 0, isFocusable: true }) // order: |a|
      navigation.registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
      navigation.registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
      navigation.registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      navigation.assignFocus('b')

      const root = navigation.getNode('root')

      expect(navigation.getPrevFocusableChild(root).id).toEqual('c')
    })

    test('if node is already focused on the first child, regardless of index, return nothing', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 0, isFocusable: true }) // order: |a|
      navigation.registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
      navigation.registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
      navigation.registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      navigation.assignFocus('d')

      const root = navigation.getNode('root')

      expect(navigation.getPrevFocusableChild(root)).toBeUndefined()
    })

    test('if node has no children, return nothing and not fail', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      const root = navigation.getNode('root')

      let prevFocusableChild = root
      expect(() => {
        prevFocusableChild = navigation.getPrevFocusableChild(root)
      }).not.toThrow()

      expect(prevFocusableChild).toBeUndefined()
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
      navigation.registerNode('root')

      let nextFocusableChild = navigation.getRootNode()
      expect(() => {
        nextFocusableChild = navigation.getPrevFocusableChild(navigation.getNode('not_existing'))
      }).not.toThrow()

      expect(nextFocusableChild).toBeUndefined()
    })
  })

  describe('getNodeFirstFocusableChild()', () => {
    test('get the first focusable child when children were added without indexes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })
      navigation.registerNode('d', { isFocusable: true })

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstFocusableChild(root).id).toEqual('a')
    })

    test('get the first focusable child when children were added with indexes, out of order', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 0, isFocusable: true }) // order: |a|
      navigation.registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
      navigation.registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
      navigation.registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstFocusableChild(root).id).toEqual('d')
    })

    test('if node has no children, return nothing and not fail', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      const root = navigation.getNode('root')

      let firstFocusableChild = root
      expect(() => {
        firstFocusableChild = navigation.getNodeFirstFocusableChild(root)
      }).not.toThrow()

      expect(firstFocusableChild).toBeUndefined()
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
      navigation.registerNode('root')

      let nextFocusableChild = navigation.getRootNode()
      expect(() => {
        nextFocusableChild = navigation.getNodeFirstFocusableChild(navigation.getNode('not_existing'))
      }).not.toThrow()

      expect(nextFocusableChild).toBeUndefined()
    })
  })

  describe('getNodeLastFocusableChild()', () => {
    test('get the last focusable child when children were added without indexes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { isFocusable: true })
      navigation.registerNode('b', { isFocusable: true })
      navigation.registerNode('c', { isFocusable: true })
      navigation.registerNode('d', { isFocusable: true })

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastFocusableChild(root).id).toEqual('d')
    })

    test('get the last focusable child when children were added with indexes, out of order', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 0, isFocusable: true }) // order: |a|
      navigation.registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
      navigation.registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
      navigation.registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastFocusableChild(root).id).toEqual('b')
    })

    test('if node has no children, return nothing and not fail', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      const root = navigation.getNode('root')

      let lastFocusableChild = root
      expect(() => {
        lastFocusableChild = navigation.getNodeLastFocusableChild(root)
      }).not.toThrow()

      expect(lastFocusableChild).toBeUndefined()
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
      navigation.registerNode('root')

      let nextFocusableChild = navigation.getRootNode()
      expect(() => {
        nextFocusableChild = navigation.getNodeLastFocusableChild(navigation.getNode('not_existing'))
      }).not.toThrow()

      expect(nextFocusableChild).toBeUndefined()
    })
  })

  describe('getNodeFirstChild()', () => {
    test('should return undefined - node with no children', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('b')

      const node = navigation.getNode('b')

      expect(navigation.getNodeFirstChild(node)).toBeUndefined()
    })

    test('should return child with index of 1 - added without indexes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('b')
      navigation.registerNode('a')
      navigation.registerNode('c')

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstChild(root).id).toEqual('b')
    })

    test('should return child with index of 1 - added without indexes, more than 9 nodes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('b')
      navigation.registerNode('a')
      navigation.registerNode('h')
      navigation.registerNode('g')
      navigation.registerNode('f')
      navigation.registerNode('i')
      navigation.registerNode('d')
      navigation.registerNode('j')
      navigation.registerNode('k')

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstChild(root).id).toEqual('b')
    })

    test('should return child with index of 1 - added out of order, with indexes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 0 }) // order: |a|
      navigation.registerNode('b', { index: 0 }) // order: |b|, a
      navigation.registerNode('c', { index: 2 }) // order: b, a, |c|

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstChild(root).id).toEqual('b')
    })

    test('should return child with index of 1 - added out of order, with indexes, more than 9 nodes', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 0 }) // order: |a|
      navigation.registerNode('b', { index: 0 }) // order: |b|, a
      navigation.registerNode('c', { index: 0 }) // order: |c|, b, a
      navigation.registerNode('d', { index: 1 }) // order: c, |d|, b, a
      navigation.registerNode('e', { index: 1 }) // order: c, |e|, d, b, a
      navigation.registerNode('f', { index: 3 }) // order: c, e, d, |f|, b, a
      navigation.registerNode('g', { index: 3 }) // order: c, e, d, |g|, f, b, a
      navigation.registerNode('h', { index: 5 }) // order: c, e, d, g, f, |h|, b, a
      navigation.registerNode('i', { index: 5 }) // order: c, e, d, g, f, |i|, h, b, a
      navigation.registerNode('j', { index: 8 }) // order: c, e, d, g, f, i, h, b, |j|, a
      navigation.registerNode('k', { index: 8 }) // order: c, e, d, g, f, i, h, b, |k|, j, a

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstChild(root).id).toEqual('c')
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
      navigation.registerNode('root')

      let nextFocusableChild = navigation.getRootNode()
      expect(() => {
        nextFocusableChild = navigation.getNodeFirstChild(navigation.getNode('not_existing'))
      }).not.toThrow()

      expect(nextFocusableChild).toBeUndefined()
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

    test('should return child with last index - more than 9 elements', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('1')
      navigation.registerNode('2')
      navigation.registerNode('3')
      navigation.registerNode('4')
      navigation.registerNode('5')
      navigation.registerNode('6')
      navigation.registerNode('7')
      navigation.registerNode('8')
      navigation.registerNode('9')
      navigation.registerNode('10')

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastChild(root).id).toEqual('10')
    })

    test('should return child with last index - added with indexes, out of order', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 0 }) // order: |a|
      navigation.registerNode('b', { index: 0 }) // order: |b|, a
      navigation.registerNode('c', { index: 1 }) // order: b, |c|, a

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastChild(root).id).toEqual('a')
    })

    test('should return child with last index - added with indexes, out of order, more than 9', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('a', { index: 0 }) // order: |a|
      navigation.registerNode('b', { index: 0 }) // order: |b|, a
      navigation.registerNode('c', { index: 1 }) // order: b, |c|, a
      navigation.registerNode('d', { index: 3 }) // order: b, c, a, |d|
      navigation.registerNode('e', { index: 4 }) // order: b, c, a, d, |e|
      navigation.registerNode('f', { index: 4 }) // order: b, c, a, d, |f|, e
      navigation.registerNode('g', { index: 3 }) // order: b, c, a, |g|, d, f, e
      navigation.registerNode('h', { index: 5 }) // order: b, c, a, g, d, |h|, f, e
      navigation.registerNode('i', { index: 8 }) // order: b, c, a, g, d, h, f, e, |i|
      navigation.registerNode('j', { index: 9 }) // order: b, c, a, g, d, h, f, e, i, |j|
      navigation.registerNode('k', { index: 10 }) // order: b, c, a, g, d, h, f, e, i, j, |k|

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastChild(root).id).toEqual('k')
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
      navigation.registerNode('root')

      let nextFocusableChild = navigation.getRootNode()
      expect(() => {
        nextFocusableChild = navigation.getNodeLastChild(navigation.getNode('not_existing'))
      }).not.toThrow()

      expect(nextFocusableChild).toBeUndefined()
    })
  })

  describe('reindexChildrenOfNode', () => {
    test('deleting a child should re-index the other children', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('c', { index: 0 }) // order: |c|
        .registerNode('a', { index: 0 }) // order: |a|, c
        .registerNode('e', { index: 2 }) // order: a, c, |e|
        .registerNode('d', { index: 2 }) // order: a, c, |d|, e
        .registerNode('b', { index: 1 }) // order: a, |b|, c, d, e

      navigation.unregisterNode('e')

      expect(navigation.getNode('a').index).toEqual(0)
      expect(navigation.getNode('b').index).toEqual(1)
      expect(navigation.getNode('c').index).toEqual(2)
      expect(navigation.getNode('d').index).toEqual(3)
    })

    test('test it through unregister, more than 9 nodes', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('c', { index: 0 }) // order: |c|
        .registerNode('a', { index: 0 }) // order: |a|, c
        .registerNode('e', { index: 2 }) // order: a, c, |e|
        .registerNode('d', { index: 2 }) // order: a, c, |d|, e
        .registerNode('b', { index: 1 }) // order: a, |b|, c, d, e
        .registerNode('f', { index: 3 }) // order: a, b, c, |f|, d, e
        .registerNode('g', { index: 6 }) // order: a, b, c, f, d, e, |g|
        .registerNode('h', { index: 6 }) // order: a, b, c, f, d, e, |h|, g
        .registerNode('i', { index: 5 }) // order: a, b, c, f, d, |i|, e, h, g
        .registerNode('j', { index: 0 }) // order: |j|, a, b, c, f, d, i, e, h, g
        .registerNode('k', { index: 0 }) // order: |k|, j, a, b, c, f, d, i, e, h, g

      navigation.unregisterNode('e')

      expect(navigation.getNode('k').index).toEqual(0)
      expect(navigation.getNode('j').index).toEqual(1)
      expect(navigation.getNode('a').index).toEqual(2)
      expect(navigation.getNode('b').index).toEqual(3)
      expect(navigation.getNode('c').index).toEqual(4)
      expect(navigation.getNode('f').index).toEqual(5)
      expect(navigation.getNode('d').index).toEqual(6)
      expect(navigation.getNode('i').index).toEqual(7)
      expect(navigation.getNode('h').index).toEqual(8)
      expect(navigation.getNode('g').index).toEqual(9)
    })
  })

  describe('setActiveChild', () => {
    it('does not set the parent\'s parent\'s activeChild property', () => {
      const navigation = new Lrud()
      navigation
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('b', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })
        .registerNode('b0', { isFocusable: true, parent: 'b' })

      navigation.assignFocus('b0')
      navigation.setActiveChild('a', 'a0')
      expect(navigation.currentFocusNodeId).toEqual('b0')
      expect(navigation.getNode('root').activeChild).toEqual('b')
    })

    it('should not fail when parent does not exist', () => {
      const navigation = new Lrud()
      navigation
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })

      expect(() => navigation.setActiveChild('not_existing', 'a0')).not.toThrow()
    })

    it('should do nothing when child does not exist', () => {
      const navigation = new Lrud()
      navigation
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })

      navigation.assignFocus('a0')

      expect(() => navigation.setActiveChild('a', 'not_existing')).not.toThrow()
      expect(navigation.getNode('a').activeChild).toEqual('a0')
    })

    it('should do nothing when child is not direct child of parent', () => {
      const navigation = new Lrud()
      navigation
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })
        .registerNode('b', { parent: 'root' })

      expect(() => navigation.setActiveChild('b', 'a0')).not.toThrow()
      expect(navigation.getNode('b').activeChild).toBeUndefined()
    })
  })

  describe('setActiveChildRecursive', () => {
    it('should recurse up the tree', () => {
      const navigation = new Lrud()
      navigation
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('b', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })
        .registerNode('a1', { isFocusable: true, parent: 'a' })
        .registerNode('b0', { isFocusable: true, parent: 'b' })

      navigation.assignFocus('a1')
      navigation.setActiveChildRecursive('a', 'a0')
      expect(navigation.currentFocusNodeId).toEqual('a1')
      expect(navigation.getNode('root').activeChild).toEqual('a')
    })

    it('should not fail when parent does not exist', () => {
      const navigation = new Lrud()
      navigation
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })

      expect(() => navigation.setActiveChildRecursive('not_existing', 'a0')).not.toThrow()
    })
  })

  describe('unsetActiveChild', () => {
    it('should recurse up the tree', () => {
      const navigation = new Lrud()
      navigation
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })

      navigation.assignFocus('a0')

      navigation.unsetActiveChild('a', 'a0')
      expect(navigation.getNode('a').activeChild).toBeUndefined()
      expect(navigation.getNode('root').activeChild).toBeUndefined()
    })

    it('should not fail when parent does not exist', () => {
      const navigation = new Lrud()
      navigation
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })

      expect(() => navigation.unsetActiveChild('not_existing', 'a0')).not.toThrow()
    })

    it('should do nothing when child does not exist', () => {
      const navigation = new Lrud()
      navigation
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })

      navigation.assignFocus('a0')

      expect(() => navigation.unsetActiveChild('a', 'not_existing')).not.toThrow()
      expect(navigation.getNode('a').activeChild).toEqual('a0')
    })

    it('should do nothing when child is not direct child of parent', () => {
      const navigation = new Lrud()
      navigation
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })
        .registerNode('b', { parent: 'root' })
        .registerNode('b0', { isFocusable: true, parent: 'b' })

      navigation.assignFocus('b0')

      expect(() => navigation.unsetActiveChild('b', 'a0')).not.toThrow()
      expect(navigation.getNode('b').activeChild).toEqual('b0')
    })
  })

  describe('digDown', () => {
    it('does not set an activeChild to an unfocusable element', () => {
      const navigation = new Lrud()
      navigation
        .registerNode('root')
        .registerNode('parent', { orientation: 'vertical' })
        .registerNode('a', { parent: 'parent' })
        .registerNode('b', { parent: 'parent', isFocusable: true })

      navigation.assignFocus('b')
      navigation.handleKeyEvent({ direction: 'UP' })
      expect(navigation.currentFocusNodeId).toEqual('b')
      expect(navigation.getNode('parent').activeChild).toEqual('b')
    })
  })

  describe('recalculateFocus()', () => {
    test('refocusing when node index is out of sync should find the nearest node', () => {
      const navigation = new Lrud()
      navigation.registerNode('root', { orientation: 'horizontal' })
        .registerNode('b', { isFocusable: true })
        .registerNode('c', { isFocusable: true })

      navigation.assignFocus('b')
      const node = navigation.getNode('b')
      const parentNode = navigation.getNode('root')
      delete parentNode.activeChild
      node.isFocusable = false
      navigation.recalculateFocus(node)
      expect(navigation.currentFocusNodeId).toEqual('c')
    })

    test('if there are no focusable nodes should fall back to undefined', () => {
      const navigation = new Lrud()
      navigation.registerNode('root')
        .registerNode('d')
        .registerNode('b', { isFocusable: true, parent: 'd' })
        .registerNode('c')

      navigation.assignFocus('b')
      const node = navigation.getNode('b')
      const parentNode = navigation.getNode('d')
      delete parentNode.activeChild
      node.isFocusable = false
      navigation.recalculateFocus(node)
      expect(navigation.currentFocusNodeId).toEqual(undefined)
    })
  })

  describe('setNodeFocusable()', () => {
    test('calling with the same focusability should do nothing', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a', { isFocusable: true })

      navigation.setNodeFocusable('a', true)

      expect(navigation.getNode('a').isFocusable).toEqual(true)
    })

    test('changing the node focusability should change the property', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a', { isFocusable: true })

      navigation.setNodeFocusable('a', false)

      expect(navigation.getNode('a').isFocusable).toEqual(false)
    })

    test('making a previously focusable node unfocusable should remove it from the list of focusable nodes', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a', { isFocusable: true })
        .registerNode('b', { selectAction: true })

      navigation.setNodeFocusable('a', false)
      navigation.setNodeFocusable('b', false)

      expect(navigation.focusableNodePathList).not.toEqual(expect.arrayContaining(['root.children.a']))
      expect(navigation.focusableNodePathList).not.toEqual(expect.arrayContaining(['root.children.b']))
    })

    test('making a previously unfocusable node focusable should add it to the list of focusable nodes', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a', { isFocusable: false })
        .registerNode('b')

      navigation.setNodeFocusable('a', true)
      navigation.setNodeFocusable('b', true)

      expect(navigation.focusableNodePathList).toEqual(expect.arrayContaining(['root.children.a']))
      expect(navigation.focusableNodePathList).toEqual(expect.arrayContaining(['root.children.b']))
    })

    test('making child nodes unfocusable should prevent focus', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a')
        .registerNode('b', {parent: 'a', isFocusable: true})

      expect(() => navigation.assignFocus('a')).not.toThrow()
      navigation.setNodeFocusable('b', false)
      expect(() => navigation.assignFocus('a')).toThrow()
    })

    test('should recalculate node focus if current node is set to be unfocusable', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a')
        .registerNode('b', {parent: 'a', isFocusable: true})

      navigation.assignFocus('b')
      navigation.setNodeFocusable('b', false)
      expect(navigation.currentFocusNodeId).not.toEqual('b')
    })

    test('should ensure the activeChild is unset after unfocusing a focused node', () => {
      const navigation = new Lrud()

      navigation
        .registerNode('root')
        .registerNode('a')
        .registerNode('b', {parent: 'a', isFocusable: true})
        .registerNode('c', {parent: 'a', isFocusable: true})

      navigation.assignFocus('b')
      expect(navigation.getNode('a').activeChild).toEqual('b')
      expect(navigation.getNode('root').activeChild).toEqual('a')

      navigation.setNodeFocusable('b', false)
      expect(navigation.getNode('a').activeChild).toBeUndefined()
      expect(navigation.getNode('root').activeChild).toBeUndefined()
    })

    test('should not fail when node does not exists', () => {
      const navigation = new Lrud()
      navigation.registerNode('root')

      expect(() => navigation.setNodeFocusable('not_existing', true)).not.toThrow()
    })
  })

  describe('getPathForNodeId()', () => {
    test('should return undefined - nodeId is not defined', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('undefined', { })
      navigation.registerNode('null', { })

      expect(navigation.getPathForNodeId('undefined')).toEqual('root.children.undefined')
      expect(navigation.getPathForNodeId(undefined)).toBeUndefined()

      expect(navigation.getPathForNodeId('null')).toEqual('root.children.null')
      expect(navigation.getPathForNodeId(null)).toBeUndefined()
    })
  })

  describe('doesNodeHaveFocusableChildren()', () => {
    test('should correctly detect nodes with focusable children', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'vertical' })
      navigation.registerNode('a', { parent: 'root', orientation: 'horizontal' })
      navigation.registerNode('aa', { parent: 'a', orientation: 'horizontal' })
      navigation.registerNode('aaa', { parent: 'aa' })
      navigation.registerNode('aab', { parent: 'aa', isFocusable: true })
      navigation.registerNode('b', { parent: 'root', orientation: 'vertical' })
      navigation.registerNode('ba', { parent: 'b' })
      navigation.registerNode('bb', { parent: 'b' })
      navigation.registerNode('c', { parent: 'root', isFocusable: true })


      expect(navigation.doesNodeHaveFocusableChildren(navigation.getNode('root'))).toEqual(true)
      expect(navigation.doesNodeHaveFocusableChildren(navigation.getNode('a'))).toEqual(true)
      expect(navigation.doesNodeHaveFocusableChildren(navigation.getNode('aa'))).toEqual(true)
      expect(navigation.doesNodeHaveFocusableChildren(navigation.getNode('aaa'))).toEqual(false)
      expect(navigation.doesNodeHaveFocusableChildren(navigation.getNode('aab'))).toEqual(false)
      expect(navigation.doesNodeHaveFocusableChildren(navigation.getNode('b'))).toEqual(false)
      expect(navigation.doesNodeHaveFocusableChildren(navigation.getNode('ba'))).toEqual(false)
      expect(navigation.doesNodeHaveFocusableChildren(navigation.getNode('bb'))).toEqual(false)
      expect(navigation.doesNodeHaveFocusableChildren(navigation.getNode('c'))).toEqual(false)
    })

    test('should not fail when node does not exists', () => {
      const navigation = new Lrud()
      navigation.registerNode('root')
      navigation.registerNode('a', { isFocusable: true, parent: 'root' })

      const notExistingNode = navigation.getNode('not_existing')
      expect(() => navigation.doesNodeHaveFocusableChildren(notExistingNode)).not.toThrow()
      expect(navigation.doesNodeHaveFocusableChildren(notExistingNode)).toEqual(false)
    })
  })

  describe('isNodeFocusableCandidate()', () => {
    test('should correctly check if node is a focusable candidate', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'vertical' })
      navigation.registerNode('a', { parent: 'root', orientation: 'horizontal' })
      navigation.registerNode('aa', { parent: 'a', orientation: 'horizontal' })
      navigation.registerNode('aaa', { parent: 'aa' })
      navigation.registerNode('aab', { parent: 'aa', isFocusable: true })
      navigation.registerNode('b', { parent: 'root', orientation: 'vertical' })
      navigation.registerNode('ba', { parent: 'b' })
      navigation.registerNode('bb', { parent: 'b' })
      navigation.registerNode('c', { parent: 'root', isFocusable: true })

      expect(navigation.isNodeFocusableCandidate(undefined)).toEqual(false)
      expect(navigation.isNodeFocusableCandidate(navigation.getNode('root'))).toEqual(true)
      expect(navigation.isNodeFocusableCandidate(navigation.getNode('a'))).toEqual(true)
      expect(navigation.isNodeFocusableCandidate(navigation.getNode('aa'))).toEqual(true)
      expect(navigation.isNodeFocusableCandidate(navigation.getNode('aaa'))).toEqual(false)
      expect(navigation.isNodeFocusableCandidate(navigation.getNode('aab'))).toEqual(true)
      expect(navigation.isNodeFocusableCandidate(navigation.getNode('b'))).toEqual(false)
      expect(navigation.isNodeFocusableCandidate(navigation.getNode('ba'))).toEqual(false)
      expect(navigation.isNodeFocusableCandidate(navigation.getNode('bb'))).toEqual(false)
      expect(navigation.isNodeFocusableCandidate(navigation.getNode('c'))).toEqual(true)
    })

    test('should not fail when node does not exists', () => {
      const navigation = new Lrud()
      navigation.registerNode('root')
      navigation.registerNode('a', { isFocusable: true, parent: 'root' })

      const notExistingNode = navigation.getNode('not_existing')
      expect(() => navigation.isNodeFocusableCandidate(notExistingNode)).not.toThrow()
      expect(navigation.isNodeFocusableCandidate(notExistingNode)).toEqual(false)
    })
  })
})
