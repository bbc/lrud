/* eslint-env jest */

const { Lrud } = require('./index')

describe('overrides', () => {
  test('horizontal list with an override - override targets a leaf', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    navigation.assignFocus('c')

    navigation.registerOverride('c', 'a', 'down')

    // this would normally do nothing, but our override puts it to a
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('a')
  })

  test('override targets a branch', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('left', { orientation: 'vertical' })
      .registerNode('a', { parent: 'left', isFocusable: true })
      .registerNode('right', { orientation: 'vertical' })
      .registerNode('b', { parent: 'right', isFocusable: true })

    navigation.assignFocus('a')

    navigation.registerOverride('a', 'right', 'right')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('b')
  })

  test('ignores override if direction does not match', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { orientation: 'horizontal' })
      .registerNode('aa', { parent: 'a', isFocusable: true })
      .registerNode('ab', { parent: 'a', isFocusable: true })
      .registerNode('b', { orientation: 'horizontal' })
      .registerNode('ba', { parent: 'b', isFocusable: true })

    navigation.assignFocus('aa')

    navigation.registerOverride('aa', 'ba', 'down')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('ab')
  })

  test('registering an override without source node should throw an exception', () => {
    const navigation = new Lrud()
      .registerNode('a')

    expect(() => {
      navigation.registerOverride(undefined, 'a', 'down')
    }).toThrow(Error)
  })

  test('registering an override for not existing source node should throw an exception', () => {
    const navigation = new Lrud()
      .registerNode('a')

    expect(() => {
      navigation.registerOverride('notExisting', 'a', 'down')
    }).toThrow(Error)
  })

  test('registering an override without target node should throw an exception', () => {
    const navigation = new Lrud()
      .registerNode('a')

    expect(() => {
      navigation.registerOverride('a', undefined, 'down')
    }).toThrow(Error)
  })

  test('registering an override for not existing target node should throw an exception', () => {
    const navigation = new Lrud()
      .registerNode('a')

    expect(() => {
      navigation.registerOverride('a', 'notExisting', 'down')
    }).toThrow(Error)
  })

  test('registering an override without direction should throw an exception', () => {
    const navigation = new Lrud()
      .registerNode('a')
      .registerNode('b')

    expect(() => {
      navigation.registerOverride('a', 'b', undefined)
    }).toThrow(Error)
  })

  test('registering an override for not supported direction should throw an exception', () => {
    const navigation = new Lrud()
      .registerNode('a')
      .registerNode('b')

    expect(() => {
      navigation.registerOverride('a', 'b', 'notSupported')
    }).toThrow(Error)
  })

  test('multiple overrides registered with the same source and direction - throw an exception', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })
      .registerOverride('c', 'a', 'down')

    navigation.assignFocus('c')

    expect(() => {
      navigation.registerOverride('c', 'b', 'down')
    }).toThrow(Error)
  })

  test('multiple overrides registered with the same source and direction - forced overwrite', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })
      .registerOverride('c', 'a', 'down')

    navigation.assignFocus('c')

    expect(() => {
      navigation.registerOverride('c', 'b', 'down', { forceOverride: true })
    }).not.toThrow(Error)

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('b')
  })

  test('unregistering an override', () => {
    const navigation = new Lrud()
      .registerNode('a')
      .registerNode('b')
      .registerNode('c')
      .registerNode('d')
      .registerOverride('a', 'd', 'down')
      .registerOverride('b', 'c', 'up')
      .registerOverride('b', 'd', 'down')
      .registerOverride('c', 'd', 'down')

    expect(navigation.nodes.a.overrides.down).toMatchObject({ id: 'd' })
    expect(navigation.nodes.b.overrides.up).toMatchObject({ id: 'c' })
    expect(navigation.nodes.b.overrides.down).toMatchObject({ id: 'd' })
    expect(navigation.nodes.c.overrides.down).toMatchObject({ id: 'd' })
    expect(navigation.nodes.c.overrideSources).toEqual([
      { direction: 'up', node: expect.objectContaining({ id: 'b' }) }
    ])
    expect(navigation.nodes.d.overrideSources).toEqual([
      { direction: 'down', node: expect.objectContaining({ id: 'a' }) },
      { direction: 'down', node: expect.objectContaining({ id: 'b' }) },
      { direction: 'down', node: expect.objectContaining({ id: 'c' }) }
    ])

    navigation.unregisterOverride('b', 'down')

    expect(navigation.nodes.a.overrides.down).toMatchObject({ id: 'd' })
    expect(navigation.nodes.b.overrides.up).toMatchObject({ id: 'c' })
    expect(navigation.nodes.b.overrides.down).toBeUndefined()
    expect(navigation.nodes.c.overrides.down).toMatchObject({ id: 'd' })
    expect(navigation.nodes.c.overrideSources).toEqual([
      { direction: 'up', node: expect.objectContaining({ id: 'b' }) }
    ])
    expect(navigation.nodes.d.overrideSources).toEqual(expect.arrayContaining([
      { direction: 'down', node: expect.objectContaining({ id: 'a' }) },
      { direction: 'down', node: expect.objectContaining({ id: 'c' }) }
    ]))
    expect(navigation.nodes.d.overrideSources.length).toEqual(2)
  })

  test('unregistering an override without source node should not fail', () => {
    const navigation = new Lrud()
      .registerNode('a')
      .registerNode('b')
      .registerOverride('a', 'b', 'down')

    expect(() => {
      navigation.unregisterOverride(undefined, 'down')
    }).not.toThrow(Error)
  })

  test('registering an override for not existing source node should not fail', () => {
    const navigation = new Lrud()
      .registerNode('a')
      .registerNode('b')
      .registerOverride('a', 'b', 'down')

    expect(() => {
      navigation.unregisterOverride('notExisting', 'down')
    }).not.toThrow(Error)
  })

  test('registering an override without direction should not fail', () => {
    const navigation = new Lrud()
      .registerNode('a')
      .registerNode('b')
      .registerOverride('a', 'b', 'down')

    expect(() => {
      navigation.unregisterOverride('a', undefined)
    }).not.toThrow(Error)
  })

  test('registering an override for not supported direction should not fail', () => {
    const navigation = new Lrud()
      .registerNode('a')
      .registerNode('b')
      .registerOverride('a', 'b', 'down')

    expect(() => {
      navigation.unregisterOverride('a', 'notSupported')
    }).not.toThrow(Error)
  })
})
