import React, { PureComponent } from 'react'
import navigation from './navigation'

const shouldClone = (child) => child && typeof child.type !== 'string'

export default class List extends PureComponent {
  componentWillUnmount () {
    const { id, parent } = this.props

    navigation.unregister(id, { parent })
  }

  render () {
    const { id, parent, className, children, orientation = 'vertical', wrapping, grid, carousel } = this.props

    navigation.register(id, { parent, orientation, wrapping, grid, carousel })

    return (
      <div
        id={id}
        className={className}
      >
        {React.Children.map(children, (child) =>
          shouldClone(child) ? React.cloneElement(child, { parent: id }) : child)}
      </div>
    )
  }
}
