/* eslint-env jest */

const { Lrud } = require('./index')

describe('lrud', () => {
  describe('getRootNode()', () => {
    test('return the root node', () => {
      const navigation = new Lrud()
        .registerNode('root')

      const node = navigation.getRootNode()

      expect(node.id).toEqual('root')
    })

    test('should throw an error when root node is not defined', () => {
      const navigation = new Lrud()

      expect(() => navigation.getRootNode()).toThrow('no root node')
    })
  })

  describe('getCurrentFocusNode()', () => {
    test('should return the current focused node', () => {
      const navigation = new Lrud()
        .registerNode('root', { isFocusable: true })

      navigation.assignFocus('root')

      const node = navigation.getCurrentFocusNode()

      expect(node.id).toEqual('root')
    })

    test('should return return nothing when current focused node is not defined', () => {
      const navigation = new Lrud()
        .registerNode('root', { isFocusable: true })

      const node = navigation.getCurrentFocusNode()

      expect(node).toBeUndefined()
    })
  })

  describe('getNode()', () => {
    test('get a nested node with no children by id', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('region-a', { parent: 'root' })
        .registerNode('region-b', { parent: 'root' })
        .registerNode('content-grid', { parent: 'region-b' })
        .registerNode('PID-X', { selectAction: 1, parent: 'content-grid' })
        .registerNode('PID-Y', { selectAction: 2, parent: 'content-grid' })
        .registerNode('PID-Z', { selectAction: 3, parent: 'content-grid' })

      const node = navigation.getNode('PID-X')

      expect(node.parent.id).toEqual('content-grid')
    })

    test('get a nested node with children by id and make sure the entire tree comes with it', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('region-a', { parent: 'root' })
        .registerNode('DEAD-X', { selectAction: 1, parent: 'region-a' })
        .registerNode('DEAD-Y', { selectAction: 2, parent: 'region-a' })
        .registerNode('DEAD-Z', { selectAction: 3, parent: 'region-a' })
        .registerNode('region-b', { parent: 'root' })
        .registerNode('content-grid', { parent: 'region-b' })
        .registerNode('PID-X', { selectAction: 1, parent: 'content-grid' })
        .registerNode('PID-Y', { selectAction: 2, parent: 'content-grid' })
        .registerNode('PID-Z', { selectAction: 3, parent: 'content-grid' })

      const node = navigation.getNode('region-b')

      expect(node.id).toEqual('region-b')
      expect(node.children[0].id).toEqual('content-grid')
      expect(node.children[0].children[0].id).toEqual('PID-X')
      expect(node.children[0].children[1].id).toEqual('PID-Y')
      expect(node.children[0].children[2].id).toEqual('PID-Z')
    })

    test('missing node id - should not fail', () => {
      const navigation = new Lrud()
        .registerNode('root')

      let node
      expect(
        () => { node = navigation.getNode() }
      ).not.toThrow()

      expect(node).toBeUndefined()
    })
  })

  describe('pickNode()', () => {
    test('pick a nested node', () => {
      const navigation = new Lrud()
        .registerNode('root', { selectAction: 1 })
        .registerNode('BOX_A', { selectAction: 2 })
        .registerNode('NODE_1', { selectAction: 11, parent: 'BOX_A' })
        .registerNode('NODE_2', { selectAction: 12, parent: 'BOX_A' })
        .registerNode('NODE_3', { selectAction: 13, parent: 'BOX_A' })

      const node2 = navigation.pickNode('NODE_2')

      expect(node2.selectAction).toEqual(12)
      expect(node2.parent.id).toEqual('BOX_A')

      const root = navigation.nodes.root
      expect(root.children[0].children.length).toEqual(2)
      expect(root.children[0].children[0].id).not.toEqual('NODE_2')
      expect(root.children[0].children[1].id).not.toEqual('NODE_2')
    })
  })

  describe('assignFocus()', () => {
    test('assigning focus should set the `activeChild` of all the nodes back up the tree', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('region-a', { parent: 'root' })
        .registerNode('region-b', { parent: 'root' })
        .registerNode('content-grid', { parent: 'region-b' })
        .registerNode('PID-X', { selectAction: 1, parent: 'content-grid' })
        .registerNode('PID-Y', { selectAction: 2, parent: 'content-grid' })
        .registerNode('PID-Z', { selectAction: 3, parent: 'content-grid' })

      navigation.assignFocus('PID-Y')

      expect(navigation.getNode('content-grid').activeChild.id).toEqual('PID-Y')
      expect(navigation.getNode('region-b').activeChild.id).toEqual('content-grid')
      expect(navigation.getNode('root').activeChild.id).toEqual('region-b')
    })

    test('assigning focus should set the currentFocusNodeId of the instance', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root', isFocusable: true })
        .registerNode('b', { parent: 'root', isFocusable: true })
        .registerNode('c', { parent: 'root', isFocusable: true })

      navigation.assignFocus('b')

      expect(navigation.currentFocusNode.id).toEqual('b')
      expect(navigation.getNode('root').activeChild.id).toEqual('b')
    })

    test('should focus focusable child of focusable node when focused indirectly, focusing leaf', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root', isFocusable: true, orientation: 'vertical' })
        .registerNode('aa', { parent: 'a', isFocusable: true })

      navigation.assignFocus('root')

      expect(navigation.currentFocusNode.id).toEqual('aa')
    })

    test('should focus focusable node containing focusable children when focused indirectly when stop propagate enabled', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root', isFocusable: true, isStopPropagate: true, orientation: 'vertical' })
        .registerNode('aa', { parent: 'a', isFocusable: true })

      navigation.assignFocus('root')

      expect(navigation.currentFocusNode.id).toEqual('a')
    })

    test('should focus focusable node containing focusable children when focused directly', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root', isFocusable: true, orientation: 'vertical' })
        .registerNode('aa', { parent: 'a', isFocusable: true })

      navigation.assignFocus('a')

      expect(navigation.currentFocusNode.id).toEqual('a')
    })

    test('should throw an error when focusing non focusable node', () => {
      const navigation = new Lrud()
        .registerNode('root')

      expect(() => {
        navigation.assignFocus('root')
      }).toThrow('trying to assign focus to a non focusable node')
    })
  })

  describe('climbUp()', () => {
    test('scan up the tree 1 level', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'vertical' })
        .registerNode('BOX_A', { parent: 'root', orientation: 'horizontal' })
        .registerNode('BOX_B', { parent: 'root', orientation: 'horizontal' })
        .registerNode('NODE_1', { parent: 'BOX_B', isFocusable: true })
        .registerNode('NODE_2', { parent: 'BOX_B', isFocusable: true })
        .registerNode('NODE_3', { parent: 'BOX_B', isFocusable: true })

      navigation.assignFocus('NODE_2')

      const nextActionableNode = navigation.climbUp(navigation.getNode('NODE_2'), 'right')

      expect(nextActionableNode.id).toEqual('BOX_B')
    })

    test('scan up the tree 2 levels', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'vertical' })
        .registerNode('page', { parent: 'root', orientation: 'horizontal' })
        .registerNode('BOX_A', { parent: 'page', orientation: 'vertical' })
        .registerNode('BOX_B', { parent: 'page', orientation: 'vertical' })
        .registerNode('NODE_1', { parent: 'BOX_A', isFocusable: true })
        .registerNode('NODE_2', { parent: 'BOX_A', isFocusable: true })
        .registerNode('NODE_3', { parent: 'BOX_A', isFocusable: true })
        .registerNode('NODE_4', { parent: 'BOX_B', isFocusable: true })
        .registerNode('NODE_5', { parent: 'BOX_B', isFocusable: true })
        .registerNode('NODE_6', { parent: 'BOX_B', isFocusable: true })

      navigation.assignFocus('NODE_1')

      const nextActionableNode = navigation.climbUp(navigation.getNode('NODE_1'), 'right')

      // the parent of NODE_1 is BOX_A but we couldn't dig up to that because it was horizontal
      // and the next thing that was horizontal was the page
      expect(nextActionableNode.id).toEqual('page')
    })

    test('should avoid infinite scan when root node reached', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'horizontal' })
        .registerNode('undefined', { parent: 'root', isFocusable: true })

      navigation.assignFocus('undefined')

      expect(
        () => navigation.climbUp(navigation.getNode('undefined'), 'right')
      ).not.toThrow({ name: 'RangeError', message: 'Maximum call stack size exceeded' })
    })
  })

  describe('getNextFocusableChildInDirection()', () => {
    test('with no order values, get the next child of a node', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'horizontal' })
        .registerNode('alpha', { id: 'alpha', parent: 'root', isFocusable: true })
        .registerNode('beta', { id: 'beta', parent: 'root', isFocusable: true })
        .registerNode('charlie', { id: 'charlie', parent: 'root', isFocusable: true })

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
        .registerNode('root', { orientation: 'horizontal' })
        .registerNode('alpha', { id: 'alpha', parent: 'root', isFocusable: true })
        .registerNode('beta', { id: 'beta', parent: 'root', isFocusable: true })
        .registerNode('charlie', { id: 'charlie', parent: 'root', isFocusable: true })

      navigation.assignFocus('charlie')

      // we're already focused on the last child of root, so it should return that
      const nextChild = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'right')
      expect(nextChild).toBeFalsy()
    })

    test('horizontal list, direction: right', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'horizontal' })
        .registerNode('a', { isFocusable: true })
        .registerNode('b', { isFocusable: true })
        .registerNode('c', { isFocusable: true })

      navigation.assignFocus('a')

      const child = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'right')

      expect(child.id).toEqual('b')
    })

    test('horizontal list, direction: left', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'horizontal' })
        .registerNode('a', { isFocusable: true })
        .registerNode('b', { isFocusable: true })
        .registerNode('c', { isFocusable: true })

      navigation.assignFocus('b')

      const child = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'left')

      expect(child.id).toEqual('a')
    })

    test('vertical list, direction: down', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'vertical' })
        .registerNode('a', { isFocusable: true })
        .registerNode('b', { isFocusable: true })
        .registerNode('c', { isFocusable: true })

      navigation.assignFocus('a')

      const child = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'down')

      expect(child.id).toEqual('b')
    })

    test('vertical list, direction: up', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'vertical' })
        .registerNode('a', { isFocusable: true })
        .registerNode('b', { isFocusable: true })
        .registerNode('c', { isFocusable: true })

      navigation.assignFocus('b')

      const child = navigation.getNextFocusableChildInDirection(navigation.getNode('root'), 'up')

      expect(child.id).toEqual('a')
    })

    test('should not fail when node is not defined', () => {
      const navigation = new Lrud()

      let child

      expect(() => {
        child = navigation.getNextFocusableChildInDirection(undefined, 'up')
      }).not.toThrow()

      expect(child).toBeUndefined()
    })
  })

  describe('digDown()', () => {
    test('dig down 2 levels', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'horizontal' })
        .registerNode('left_column', { parent: 'root', orientation: 'vertical' })
        .registerNode('right_column', { parent: 'root', orientation: 'vertical' })
        .registerNode('NODE_A', { id: 'NODE_A', parent: 'left_column', isFocusable: true })
        .registerNode('NODE_B', { id: 'NODE_B', parent: 'left_column', isFocusable: true })
        .registerNode('NODE_C', { id: 'NODE_C', parent: 'right_column', isFocusable: true })
        .registerNode('NODE_D', { id: 'NODE_D', parent: 'right_column', isFocusable: true })

      // first focusable of 'root' should be 'NODE_A'
      const root = navigation.getNode('root')
      const focusable = navigation.digDown(root)
      expect(focusable.id).toEqual('NODE_A')
    })
  })

  describe('getNextFocusableChild()', () => {
    test('get the next focusable child when children were added without indexes', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { isFocusable: true })
        .registerNode('b', { isFocusable: true })
        .registerNode('c', { isFocusable: true })
        .registerNode('d', { isFocusable: true })

      navigation.assignFocus('b')

      const root = navigation.getNode('root')

      expect(navigation.getNextFocusableChild(root).id).toEqual('c')
    })

    test('get the next focusable child when children were added with indexes, out of order', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { index: 0, isFocusable: true }) // order: |a|
        .registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
        .registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
        .registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      navigation.assignFocus('d')

      const root = navigation.getNode('root')

      expect(navigation.getNextFocusableChild(root).id).toEqual('a')
    })

    test('if node is already focused on the last child, regardless of index, return nothing', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { index: 0, isFocusable: true }) // order: |a|
        .registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
        .registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
        .registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      navigation.assignFocus('b')

      const root = navigation.getNode('root')

      expect(navigation.getNextFocusableChild(root)).toBeUndefined()
    })

    test('if node is already focused on the last child, regardless of index, search from the beginning', () => {
      const navigation = new Lrud()
        .registerNode('root', { isWrapping: true })
        .registerNode('a', { index: 0, isFocusable: true }) // order: |a|
        .registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
        .registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
        .registerNode('d', { index: 0, isFocusable: false }) // order: |d|, a, c, b

      navigation.assignFocus('b')

      const root = navigation.getNode('root')

      expect(navigation.getNextFocusableChild(root).id).toEqual('a')
    })

    test('if node has no children, return nothing and not fail', () => {
      const navigation = new Lrud()
        .registerNode('root')

      const root = navigation.getNode('root')

      let nextFocusableChild = root
      expect(() => {
        nextFocusableChild = navigation.getNextFocusableChild(root)
      }).not.toThrow()

      expect(nextFocusableChild).toBeUndefined()
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
        .registerNode('root')

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
        .registerNode('root')
        .registerNode('a', { isFocusable: true })
        .registerNode('b', { isFocusable: true })
        .registerNode('c', { isFocusable: true })
        .registerNode('d', { isFocusable: true })

      navigation.assignFocus('c')

      const root = navigation.getNode('root')

      expect(navigation.getPrevFocusableChild(root).id).toEqual('b')
    })

    test('get the prev focusable child when children were added with indexes, out of order', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { index: 0, isFocusable: true }) // order: |a|
        .registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
        .registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
        .registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      navigation.assignFocus('b')

      const root = navigation.getNode('root')

      expect(navigation.getPrevFocusableChild(root).id).toEqual('c')
    })

    test('if node is already focused on the first child, regardless of index, return nothing', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { index: 0, isFocusable: true }) // order: |a|
        .registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
        .registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
        .registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      navigation.assignFocus('d')

      const root = navigation.getNode('root')

      expect(navigation.getPrevFocusableChild(root)).toBeUndefined()
    })

    test('if node is already focused on the first child, regardless of index, search from the end', () => {
      const navigation = new Lrud()
        .registerNode('root', { isWrapping: true })
        .registerNode('a', { index: 0, isFocusable: true }) // order: |a|
        .registerNode('b', { index: 1, isFocusable: false }) // order: a, |b|
        .registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
        .registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      navigation.assignFocus('d')

      const root = navigation.getNode('root')

      expect(navigation.getPrevFocusableChild(root).id).toEqual('c')
    })

    test('if node has no children, return nothing and not fail', () => {
      const navigation = new Lrud()
        .registerNode('root')

      const root = navigation.getNode('root')

      let prevFocusableChild = root
      expect(() => {
        prevFocusableChild = navigation.getPrevFocusableChild(root)
      }).not.toThrow()

      expect(prevFocusableChild).toBeUndefined()
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
        .registerNode('root')

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
        .registerNode('root')
        .registerNode('a', { isFocusable: true })
        .registerNode('b', { isFocusable: true })
        .registerNode('c', { isFocusable: true })
        .registerNode('d', { isFocusable: true })

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstFocusableChild(root).id).toEqual('a')
    })

    test('get the first focusable child when children were added with indexes, out of order', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { index: 0, isFocusable: true }) // order: |a|
        .registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
        .registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
        .registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstFocusableChild(root).id).toEqual('d')
    })

    test('if node has no children, return nothing and not fail', () => {
      const navigation = new Lrud()
        .registerNode('root')

      const root = navigation.getNode('root')

      let firstFocusableChild = root
      expect(() => {
        firstFocusableChild = navigation.getNodeFirstFocusableChild(root)
      }).not.toThrow()

      expect(firstFocusableChild).toBeUndefined()
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
        .registerNode('root')

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
        .registerNode('root')
        .registerNode('a', { isFocusable: true })
        .registerNode('b', { isFocusable: true })
        .registerNode('c', { isFocusable: true })
        .registerNode('d', { isFocusable: true })

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastFocusableChild(root).id).toEqual('d')
    })

    test('get the last focusable child when children were added with indexes, out of order', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { index: 0, isFocusable: true }) // order: |a|
        .registerNode('b', { index: 1, isFocusable: true }) // order: a, |b|
        .registerNode('c', { index: 1, isFocusable: true }) // order: a, |c|, b
        .registerNode('d', { index: 0, isFocusable: true }) // order: |d|, a, c, b

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastFocusableChild(root).id).toEqual('b')
    })

    test('if node has no children, return nothing and not fail', () => {
      const navigation = new Lrud()
        .registerNode('root')

      const root = navigation.getNode('root')

      let lastFocusableChild = root
      expect(() => {
        lastFocusableChild = navigation.getNodeLastFocusableChild(root)
      }).not.toThrow()

      expect(lastFocusableChild).toBeUndefined()
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
        .registerNode('root')

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
        .registerNode('root')
        .registerNode('b')

      const node = navigation.getNode('b')

      expect(navigation.getNodeFirstChild(node)).toBeUndefined()
    })

    test('should return child with index of 1 - added without indexes', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('b')
        .registerNode('a')
        .registerNode('c')

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstChild(root).id).toEqual('b')
    })

    test('should return child with index of 1 - added without indexes, more than 9 nodes', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('b')
        .registerNode('a')
        .registerNode('h')
        .registerNode('g')
        .registerNode('f')
        .registerNode('i')
        .registerNode('d')
        .registerNode('j')
        .registerNode('k')

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstChild(root).id).toEqual('b')
    })

    test('should return child with index of 1 - added out of order, with indexes', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { index: 0 }) // order: |a|
        .registerNode('b', { index: 0 }) // order: |b|, a
        .registerNode('c', { index: 2 }) // order: b, a, |c|

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstChild(root).id).toEqual('b')
    })

    test('should return child with index of 1 - added out of order, with indexes, more than 9 nodes', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { index: 0 }) // order: |a|
        .registerNode('b', { index: 0 }) // order: |b|, a
        .registerNode('c', { index: 0 }) // order: |c|, b, a
        .registerNode('d', { index: 1 }) // order: c, |d|, b, a
        .registerNode('e', { index: 1 }) // order: c, |e|, d, b, a
        .registerNode('f', { index: 3 }) // order: c, e, d, |f|, b, a
        .registerNode('g', { index: 3 }) // order: c, e, d, |g|, f, b, a
        .registerNode('h', { index: 5 }) // order: c, e, d, g, f, |h|, b, a
        .registerNode('i', { index: 5 }) // order: c, e, d, g, f, |i|, h, b, a
        .registerNode('j', { index: 8 }) // order: c, e, d, g, f, i, h, b, |j|, a
        .registerNode('k', { index: 8 }) // order: c, e, d, g, f, i, h, b, |k|, j, a

      const root = navigation.getNode('root')

      expect(navigation.getNodeFirstChild(root).id).toEqual('c')
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
        .registerNode('root')

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
        .registerNode('root')
        .registerNode('a')
        .registerNode('b')
        .registerNode('c')

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastChild(root).id).toEqual('c')
    })

    test('should return child with last index - more than 9 elements', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('1')
        .registerNode('2')
        .registerNode('3')
        .registerNode('4')
        .registerNode('5')
        .registerNode('6')
        .registerNode('7')
        .registerNode('8')
        .registerNode('9')
        .registerNode('10')

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastChild(root).id).toEqual('10')
    })

    test('should return child with last index - added with indexes, out of order', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { index: 0 }) // order: |a|
        .registerNode('b', { index: 0 }) // order: |b|, a
        .registerNode('c', { index: 1 }) // order: b, |c|, a

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastChild(root).id).toEqual('a')
    })

    test('should return child with last index - added with indexes, out of order, more than 9', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { index: 0 }) // order: |a|
        .registerNode('b', { index: 0 }) // order: |b|, a
        .registerNode('c', { index: 1 }) // order: b, |c|, a
        .registerNode('d', { index: 3 }) // order: b, c, a, |d|
        .registerNode('e', { index: 4 }) // order: b, c, a, d, |e|
        .registerNode('f', { index: 4 }) // order: b, c, a, d, |f|, e
        .registerNode('g', { index: 3 }) // order: b, c, a, |g|, d, f, e
        .registerNode('h', { index: 5 }) // order: b, c, a, g, d, |h|, f, e
        .registerNode('i', { index: 8 }) // order: b, c, a, g, d, h, f, e, |i|
        .registerNode('j', { index: 9 }) // order: b, c, a, g, d, h, f, e, i, |j|
        .registerNode('k', { index: 10 }) // order: b, c, a, g, d, h, f, e, i, j, |k|

      const root = navigation.getNode('root')

      expect(navigation.getNodeLastChild(root).id).toEqual('k')
    })

    test('should not fail of node does not exists', () => {
      const navigation = new Lrud()
        .registerNode('root')

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
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('b', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })
        .registerNode('b0', { isFocusable: true, parent: 'b' })

      navigation.assignFocus('b0')
      navigation.setActiveChild('a', 'a0')
      expect(navigation.currentFocusNode.id).toEqual('b0')
      expect(navigation.getNode('root').activeChild.id).toEqual('b')
    })

    it('should change existing parent\'s activeChild property', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root', isFocusable: true })
        .registerNode('b', { parent: 'root', isFocusable: true })

      navigation.assignFocus('a')
      navigation.setActiveChild('root', 'b')
      expect(navigation.getNode('root').activeChild.id).toEqual('b')
    })

    it('should not fail when parent does not exist', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })

      expect(() => navigation.setActiveChild('not_existing', 'a0')).not.toThrow()
    })

    it('should do nothing when child does not exist', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })

      navigation.assignFocus('a0')

      expect(() => navigation.setActiveChild('a', 'not_existing')).not.toThrow()
      expect(navigation.getNode('a').activeChild.id).toEqual('a0')
    })

    it('should do nothing when child is not direct child of parent', () => {
      const navigation = new Lrud()
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
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('b', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })
        .registerNode('a1', { isFocusable: true, parent: 'a' })
        .registerNode('b0', { isFocusable: true, parent: 'b' })

      navigation.assignFocus('a1')
      navigation.setActiveChildRecursive('a', 'a0')
      expect(navigation.currentFocusNode.id).toEqual('a1')
      expect(navigation.getNode('root').activeChild.id).toEqual('a')
    })

    it('should not fail when parent does not exist', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })

      expect(() => navigation.setActiveChildRecursive('not_existing', 'a0')).not.toThrow()
    })
  })

  describe('unsetActiveChild', () => {
    it('should recurse up the tree', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })
        .registerNode('a00', { isFocusable: true, parent: 'a0' })
        .registerNode('b', { isFocusable: true, parent: 'root' })

      navigation.assignFocus('a00')
      expect(navigation.getNode('a0').activeChild.id).toEqual('a00')
      expect(navigation.getNode('a').activeChild.id).toEqual('a0')
      expect(navigation.getNode('root').activeChild.id).toEqual('a')

      navigation.assignFocus('b')
      expect(navigation.getNode('a0').activeChild.id).toEqual('a00')
      expect(navigation.getNode('a').activeChild.id).toEqual('a0')
      expect(navigation.getNode('root').activeChild.id).toEqual('b')

      navigation.unsetActiveChild('a0', 'a00')
      expect(navigation.getNode('a0').activeChild).toBeUndefined()
      expect(navigation.getNode('a').activeChild).toBeUndefined()
      expect(navigation.getNode('root').activeChild.id).toEqual('b')
    })

    it('should recurse up the tree - unsetting current focused node', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })
        .registerNode('a00', { isFocusable: true, parent: 'a0' })
        .registerNode('a000', { isFocusable: true, parent: 'a00' })
        .registerNode('b', { isFocusable: true, parent: 'root' })

      navigation.assignFocus('a000')

      navigation.unsetActiveChild('a00', 'a000')
      expect(navigation.getNode('root').activeChild).toBeUndefined()
      expect(navigation.getNode('a').activeChild).toBeUndefined()
      expect(navigation.getNode('a0').activeChild).toBeUndefined()
      expect(navigation.getNode('a00').activeChild).toBeUndefined()
    })

    it('should recurse up the tree - unsetting node on the current focused node branch', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })
        .registerNode('a00', { isFocusable: true, parent: 'a0' })
        .registerNode('a000', { isFocusable: true, parent: 'a00' })
        .registerNode('b', { isFocusable: true, parent: 'root' })

      navigation.assignFocus('a000')

      navigation.unsetActiveChild('a0', 'a00')
      expect(navigation.getNode('root').activeChild).toBeUndefined()
      expect(navigation.getNode('a').activeChild).toBeUndefined()
      expect(navigation.getNode('a0').activeChild).toBeUndefined()
      // note that activeChild setting in the subtree of unset activeChild should remain not changed
      expect(navigation.getNode('a00').activeChild.id).toEqual('a000')
    })

    it('should not fail when parent does not exist', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })

      expect(() => navigation.unsetActiveChild('not_existing', 'a0')).not.toThrow()
    })

    it('should do nothing when child does not exist', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })

      navigation.assignFocus('a0')

      expect(() => navigation.unsetActiveChild('a', 'not_existing')).not.toThrow()
      expect(navigation.getNode('a').activeChild.id).toEqual('a0')
    })

    it('should do nothing when child is not direct child of parent', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('a0', { isFocusable: true, parent: 'a' })
        .registerNode('b', { parent: 'root' })
        .registerNode('b0', { isFocusable: true, parent: 'b' })

      navigation.assignFocus('b0')

      expect(() => navigation.unsetActiveChild('b', 'a0')).not.toThrow()
      expect(navigation.getNode('b').activeChild.id).toEqual('b0')
    })
  })

  describe('digDown', () => {
    it('does not set an activeChild to an unfocusable element', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('parent', { orientation: 'vertical' })
        .registerNode('a', { parent: 'parent' })
        .registerNode('b', { parent: 'parent', isFocusable: true })

      navigation.assignFocus('b')
      navigation.handleKeyEvent({ direction: 'UP' })
      expect(navigation.currentFocusNode.id).toEqual('b')
      expect(navigation.getNode('parent').activeChild.id).toEqual('b')
    })
  })

  describe('recalculateFocus()', () => {
    test('refocusing when node index is out of sync should find the nearest node', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'horizontal' })
        .registerNode('b', { isFocusable: true })
        .registerNode('c', { isFocusable: true })

      navigation.assignFocus('b')
      const node = navigation.getNode('b')
      const parentNode = navigation.getNode('root')
      delete parentNode.activeChild
      node.isFocusable = false
      navigation.recalculateFocus(node)
      expect(navigation.currentFocusNode.id).toEqual('c')
    })

    test('if there are no focusable nodes should fall back to undefined', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('d')
        .registerNode('b', { isFocusable: true, parent: 'd' })
        .registerNode('c')

      navigation.assignFocus('b')
      const node = navigation.getNode('b')
      const parentNode = navigation.getNode('d')
      delete parentNode.activeChild
      node.isFocusable = false
      navigation.recalculateFocus(node)
      expect(navigation.currentFocusNode).toBeUndefined()
    })
  })

  describe('setNodeFocusable()', () => {
    test('changing the node focusability should change the property', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { isFocusable: true })

      navigation.setNodeFocusable(navigation.nodes.a, false)

      expect(navigation.nodes.a.isFocusable).toEqual(false)
    })

    test('calling with the same focusability should do nothing', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { isFocusable: true })

      navigation.setNodeFocusable('a', true)

      expect(navigation.getNode('a').isFocusable).toEqual(true)
    })

    test('changing the node focusability should change the property, true -> false', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { isFocusable: true })

      navigation.setNodeFocusable('a', false)

      expect(navigation.getNode('a').isFocusable).toEqual(false)
    })

    test('changing the node focusability should change the property, false -> true', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { isFocusable: false })

      navigation.setNodeFocusable('a', true)

      expect(navigation.getNode('a').isFocusable).toEqual(true)
    })

    test('making child nodes unfocusable should prevent focus', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a')
        .registerNode('b', { parent: 'a', isFocusable: true })

      expect(() => navigation.assignFocus('a')).not.toThrow()
      navigation.setNodeFocusable('b', false)
      expect(() => navigation.assignFocus('a')).toThrow()
    })

    test('should recalculate node focus if current node is set to be unfocusable', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a')
        .registerNode('b', { parent: 'a', isFocusable: true })

      navigation.assignFocus('b')
      navigation.setNodeFocusable('b', false)
      expect(navigation.currentFocusNode).toBeUndefined()
    })

    test('should ensure the activeChild is unset after unfocusing a focused node', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a')
        .registerNode('b', { parent: 'a', isFocusable: true })
        .registerNode('c', { parent: 'a', isFocusable: true })

      navigation.assignFocus('b')
      expect(navigation.getNode('a').activeChild.id).toEqual('b')
      expect(navigation.getNode('root').activeChild.id).toEqual('a')

      navigation.setNodeFocusable('b', false)
      expect(navigation.getNode('a').activeChild).toBeUndefined()
      expect(navigation.getNode('root').activeChild).toBeUndefined()
    })

    test('should not fail when changing root node focusability', () => {
      const navigation = new Lrud()
        .registerNode('root')

      navigation.setNodeFocusable('root', true)
      expect(navigation.getRootNode().isFocusable).toEqual(true)

      navigation.setNodeFocusable('root', false)
      expect(navigation.getRootNode().isFocusable).toEqual(false)
    })

    test('should not fail when node does not exists', () => {
      const navigation = new Lrud()
        .registerNode('root')

      expect(() => navigation.setNodeFocusable('not_existing', true)).not.toThrow()
    })
  })

  describe('doesNodeHaveFocusableChildren()', () => {
    test('should correctly detect nodes with focusable children', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'vertical' })
        .registerNode('a', { parent: 'root', orientation: 'horizontal' })
        .registerNode('aa', { parent: 'a', orientation: 'horizontal' })
        .registerNode('aaa', { parent: 'aa' })
        .registerNode('aab', { parent: 'aa', isFocusable: true })
        .registerNode('b', { parent: 'root', orientation: 'vertical' })
        .registerNode('ba', { parent: 'b' })
        .registerNode('bb', { parent: 'b' })
        .registerNode('c', { parent: 'root', isFocusable: true })

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
        .registerNode('root')
        .registerNode('a', { isFocusable: true, parent: 'root' })

      const notExistingNode = navigation.getNode('not_existing')
      expect(() => navigation.doesNodeHaveFocusableChildren(notExistingNode)).not.toThrow()
      expect(navigation.doesNodeHaveFocusableChildren(notExistingNode)).toEqual(false)
    })
  })

  describe('isNodeFocusableCandidate()', () => {
    test('should correctly check if node is a focusable candidate', () => {
      const navigation = new Lrud()
        .registerNode('root', { orientation: 'vertical' })
        .registerNode('a', { parent: 'root', orientation: 'horizontal' })
        .registerNode('aa', { parent: 'a', orientation: 'horizontal' })
        .registerNode('aaa', { parent: 'aa' })
        .registerNode('aab', { parent: 'aa', isFocusable: true })
        .registerNode('b', { parent: 'root', orientation: 'vertical' })
        .registerNode('ba', { parent: 'b' })
        .registerNode('bb', { parent: 'b' })
        .registerNode('c', { parent: 'root', isFocusable: true })

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
        .registerNode('root')
        .registerNode('a', { isFocusable: true, parent: 'root' })

      const notExistingNode = navigation.getNode('not_existing')
      expect(() => navigation.isNodeFocusableCandidate(notExistingNode)).not.toThrow()
      expect(navigation.isNodeFocusableCandidate(notExistingNode)).toEqual(false)
    })
  })

  describe('isSameOrParentForChild()', () => {
    test('should correctly recognize parent node', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('aa', { parent: 'a' })
        .registerNode('aaa', { parent: 'aa' })
        .registerNode('aab', { parent: 'aa' })
        .registerNode('b', { parent: 'root' })
        .registerNode('ba', { parent: 'b' })

      expect(navigation.isSameOrParentForChild('a', undefined)).toEqual(false)
      expect(navigation.isSameOrParentForChild(undefined, 'a')).toEqual(false)
      expect(navigation.isSameOrParentForChild(undefined, undefined)).toEqual(false)

      expect(navigation.isSameOrParentForChild('a', 'a')).toEqual(true)

      expect(navigation.isSameOrParentForChild('a', 'aa')).toEqual(true)
      expect(navigation.isSameOrParentForChild('aa', 'a')).toEqual(false)

      expect(navigation.isSameOrParentForChild('a', 'aaa')).toEqual(true)
      expect(navigation.isSameOrParentForChild('aaa', 'aa')).toEqual(false)

      expect(navigation.isSameOrParentForChild('a', 'ba')).toEqual(false)
      expect(navigation.isSameOrParentForChild('ba', 'a')).toEqual(false)

      expect(navigation.isSameOrParentForChild('aa', 'ab')).toEqual(false)
      expect(navigation.isSameOrParentForChild('ba', 'aa')).toEqual(false)
    })
  })

  describe('moveNode()', () => {
    test('should not fail when one of the arguments is missing', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })

      expect(
        () => navigation.moveNode('a', undefined)
      ).not.toThrow()
      expect(
        () => navigation.moveNode(undefined, 'root')
      ).not.toThrow()
    })

    test('should do nothing when moved node is a root node', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })

      expect(
        () => navigation.moveNode('root', 'a')
      ).not.toThrow()
    })

    test('should do nothing when moving to already assigned parent', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })

      expect(
        () => navigation.moveNode('a', 'root')
      ).not.toThrow()
    })

    test('should append moved node to the new parent if new index not specified', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('aa', { parent: 'a' })
        .registerNode('ab', { parent: 'a' })
        .registerNode('b', { parent: 'root' })
        .registerNode('ba', { parent: 'b' })

      navigation.moveNode('aa', 'b')

      expect(navigation.getNode('a').children).toMatchObject([
        { id: 'ab', parent: { id: 'a' }, index: 0 }
      ])

      expect(navigation.getNode('b').children).toMatchObject([
        { id: 'ba', parent: { id: 'b' }, index: 0 },
        { id: 'aa', parent: { id: 'b' }, index: 1 }
      ])
    })

    test('should insert moved node to the new parent at a given index', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('aa', { parent: 'a' })
        .registerNode('ab', { parent: 'a' })
        .registerNode('b', { parent: 'root' })
        .registerNode('ba', { parent: 'b' })
        .registerNode('bb', { parent: 'b' })

      navigation.moveNode('aa', 'b', { index: 1 })

      expect(navigation.getNode('a').children).toMatchObject([
        { id: 'ab', parent: { id: 'a' }, index: 0 }
      ])

      expect(navigation.getNode('b').children).toMatchObject([
        { id: 'ba', parent: { id: 'b' }, index: 0 },
        { id: 'aa', parent: { id: 'b' }, index: 1 },
        { id: 'bb', parent: { id: 'b' }, index: 2 }
      ])
    })

    test('should insert moved node maintaining it\'s current position if possible', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('aa', { parent: 'a' })
        .registerNode('ab', { parent: 'a' })
        .registerNode('b', { parent: 'root' })
        .registerNode('ba', { parent: 'b' })
        .registerNode('bb', { parent: 'b' })

      navigation.moveNode('aa', 'b', { maintainIndex: true })

      expect(navigation.getNode('a').children).toMatchObject([
        { id: 'ab', parent: { id: 'a' }, index: 0 }
      ])

      expect(navigation.getNode('b').children).toMatchObject([
        { id: 'aa', parent: { id: 'b' }, index: 0 },
        { id: 'ba', parent: { id: 'b' }, index: 1 },
        { id: 'bb', parent: { id: 'b' }, index: 2 }
      ])

      // index of moved node is greater than the new parent's children count, index should be kept coherent and compact
      navigation.moveNode('bb', 'a', { maintainIndex: true })

      expect(navigation.getNode('a').children).toMatchObject([
        { id: 'ab', parent: { id: 'a' }, index: 0 },
        { id: 'bb', parent: { id: 'a' }, index: 1 }
      ])

      expect(navigation.getNode('b').children).toMatchObject([
        { id: 'aa', parent: { id: 'b' }, index: 0 },
        { id: 'ba', parent: { id: 'b' }, index: 1 }
      ])
    })

    test('should favor given index value over maintaining existing one', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('aa', { parent: 'a' })
        .registerNode('ab', { parent: 'a' })
        .registerNode('b', { parent: 'root' })
        .registerNode('ba', { parent: 'b' })
        .registerNode('bb', { parent: 'b' })

      navigation.moveNode('aa', 'b', { index: 1, maintainIndex: true })

      expect(navigation.getNode('a').children).toMatchObject([
        { id: 'ab', parent: { id: 'a' }, index: 0 }
      ])

      // new index value is 1, maintained index value would be 0
      expect(navigation.getNode('b').children).toMatchObject([
        { id: 'ba', parent: { id: 'b' }, index: 0 },
        { id: 'aa', parent: { id: 'b' }, index: 1 },
        { id: 'bb', parent: { id: 'b' }, index: 2 }
      ])
    })

    test('should unset old parent\'s activeNode, if points to moved node', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('aa', { parent: 'a', isFocusable: true })
        .registerNode('b', { parent: 'root' })
        .registerNode('ba', { parent: 'b', isFocusable: true })

      navigation.assignFocus('aa')
      expect(navigation.getNode('a').activeChild.id).toEqual('aa')
      expect(navigation.getNode('root').activeChild.id).toEqual('a')

      // changing focus, so moved node is not the current focused node
      navigation.assignFocus('ba')

      navigation.moveNode('aa', 'b')

      expect(navigation.getNode('a').activeChild).toBeUndefined()
      // new parent's activeChild remains not changed
      expect(navigation.getNode('b').activeChild.id).toEqual('ba')
      expect(navigation.getNode('root').activeChild.id).toEqual('b')
    })

    test('should reassign activeChild is moving currently focused node', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root' })
        .registerNode('aa', { parent: 'a', isFocusable: true })
        .registerNode('b', { parent: 'root' })
        .registerNode('ba', { parent: 'b', isFocusable: true })

      navigation.assignFocus('aa')
      expect(navigation.getNode('a').activeChild.id).toEqual('aa')
      expect(navigation.getNode('root').activeChild.id).toEqual('a')

      navigation.moveNode('aa', 'b')

      expect(navigation.getNode('a').activeChild).toBeUndefined()
      expect(navigation.getNode('b').activeChild.id).toEqual('aa')
      expect(navigation.getNode('root').activeChild.id).toEqual('b')
    })

    test('should not remove overrides pointing to moved node', () => {
      const navigation = new Lrud()
        .registerNode('root')
        .registerNode('a', { parent: 'root', orientation: 'horizontal' })
        .registerNode('aa', { parent: 'a', isFocusable: true })
        .registerNode('ab', { parent: 'a', isFocusable: true })
        .registerNode('b', { parent: 'root' })

      navigation.assignFocus('aa')

      navigation.registerOverride('aa', 'ab', 'down')
      navigation.registerOverride('ab', 'aa', 'down')

      navigation.moveNode('aa', 'b')

      expect(navigation.nodes.aa.overrides.down).toMatchObject({ id: 'ab' })
      expect(navigation.nodes.ab.overrides.down).toMatchObject({ id: 'aa' })
    })
  })
})
