/* eslint-env jest */
const Utils = require('./utils')

describe('find() - find nested properties and return path strings', () => {
  test('property is at top level', () => {
    const tree = {
      alpha: {
        beta: {
          charlie: {}
        }
      }
    }

    const path = Utils.find(tree, 'alpha')

    expect(path).toEqual('alpha')
  })

  test('property is 1 level down', () => {
    const tree = {
      alpha: { beta: { charlie: {} } }
    }

    const path = Utils.find(tree, 'beta')

    expect(path).toEqual('alpha.beta')
  })

  test('property is 2 levels down', () => {
    const tree = {
      alpha: { beta: { charlie: {} } }
    }

    const path = Utils.find(tree, 'charlie')

    expect(path).toEqual('alpha.beta.charlie')
  })

  test('property is nested and not on first path (e.g getting a content item from a grid in the 2nd region)', () => {
    const tree = {
      root: {
        children: {
          left_region: {
            children: {
              keyboard: {
                children: {
                  row_a: {},
                  row_b: {},
                  row_c: {}
                }
              }
            }
          },
          right_region: {
            children: {
              grid: {
                children: {
                  row_1: {},
                  row_2: {
                    children: {
                      PIDXYZ: {},
                      PIDDEF: {},
                      PIDIOP: {}
                    }
                  },
                  row_3: {}
                }
              }
            }
          }
        }
      }
    }

    const path = Utils.find(tree, 'PIDXYZ')

    console.log('path', path)

    expect(path).toEqual('root.children.right_region.children.grid.children.row_2.children.PIDXYZ')
  })
})
