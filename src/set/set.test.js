/* eslint-env jest */

const { Set } = require('./index')

describe('set.js', () => {
  test('set a number into object - 1 level deep', () => {
    const object = {}

    Set(object, 'a', 1)

    expect(object).toMatchObject({
      a: 1
    })
  })

  test('set a number into object - 2 levels deep', () => {
    const object = {}

    Set(object, 'alpha.beta', 1)

    expect(object).toMatchObject({
      alpha: {
        beta: 1
      }
    })
  })

  test('set a string into object - 3 levels deep', () => {
    const object = {}

    Set(object, 'alpha.beta.charlie', 'hello world!')

    expect(object).toMatchObject({
      alpha: {
        beta: {
          charlie: 'hello world!'
        }
      }
    })
  })

  test('set an array into object - 2 levels deep', () => {
    const object = {}

    Set(object, 'alpha.beta', [])

    expect(object).toMatchObject({
      alpha: {
        beta: []
      }
    })
  })

  test('set a string into object - 3 levels deep with array notation', () => {
    const object = {}

    Set(object, 'alpha.beta.0', 'hello world!')

    expect(object).toMatchObject({
      alpha: {
        beta: [
          'hello world!'
        ]
      }
    })
  })

  test('set a string into object - 3 levels deep with array notation, not first element in array', () => {
    const object = {}

    Set(object, 'alpha.beta.2', 'hello world!')

    expect(object).toMatchObject({
      alpha: {
        beta: [
          undefined,
          undefined,
          'hello world!'
        ]
      }
    })
  })

  test('set a string into object - 3 levels deep, object already exists', () => {
    const object = {
      alpha: {
        beta: {
          a: 1
        }
      }
    }

    Set(object, 'alpha.beta.b', 2)

    expect(object).toMatchObject({
      alpha: {
        beta: {
          a: 1,
          b: 2
        }
      }
    })
  })

  test('set a string into object - 3 levels deep with array notation, not first element in array and elements already exist', () => {
    const object = {
      alpha: {
        beta: [
          1,
          undefined,
          3
        ]
      }
    }

    Set(object, 'alpha.beta.1', 2)

    expect(object).toMatchObject({
      alpha: {
        beta: [
          1,
          2,
          3
        ]
      }
    })
  })

  test('if path is undefined, dont do anything', () => {
    const object = {}

    Set(object, undefined, 1)

    expect(object).toMatchObject({
      a: 1
    })
  })
})
