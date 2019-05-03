/* eslint-env jest */

const Get = require('.')

describe('get.js', () => {
  test('get a value from object - 1 level deep', () => {
    const object = {
      a: 2
    }

    expect(Get(object, 'a')).toEqual(2)
  })

  test('get a value from object - 2 levels deep', () => {
    const object = {
      alpha: {
        a: 3
      }
    }

    expect(Get(object, 'alpha.a')).toEqual(3)
  })

  test('get a value from object - 2 levels deep with array', () => {
    const object = {
      alpha: {
        beta: [
          1,
          2,
          3
        ]
      }
    }

    expect(Get(object, 'alpha.beta.0')).toEqual(1)
  })

  test('get a value from object - 3 levels deep with array', () => {
    const object = {
      alpha: {
        beta: [
          1,
          2,
          3
        ]
      }
    }

    expect(Get(object, 'alpha.beta.0')).toEqual(1)
  })

  test('get a value from object - 4 levels deep with array then key again', () => {
    const object = {
      alpha: {
        beta: [
          {
            x: 10
          },
          {
            y: 20
          }
        ]
      }
    }

    expect(Get(object, 'alpha.beta.1.y')).toEqual(20)
  })

  test('get a value that doesnt exist - last item in path', () => {
    const object = {
      alpha: 1
    }

    expect(Get(object, 'beta')).toEqual(null)
  })

  test('get a value that doesnt exist - nested', () => {
    const object = {
      alpha: 1
    }

    expect(Get(object, 'beta.charlie.delta')).toEqual(null)
  })

  test('get a value that doesnt exist - nested using array syntax', () => {
    const object = {
      alpha: 1
    }

    expect(Get(object, 'beta.2.delta')).toEqual(null)
  })
})
