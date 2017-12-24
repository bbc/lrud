import React, { PureComponent } from 'react'
import navigation from './navigation'

export default class List extends PureComponent {
  componentWillUnmount () {
    navigation.unregister(this.props.id)
  }

  render () {
    const { id, parent, className, children, orientation = 'vertical', wrapping, grid, carousel } = this.props

    navigation.register(id, { parent, orientation, wrapping, grid, carousel })

    return (
      <div
        id={id}
        className={className}
      >
        {React.Children.map(children, (child) => React.cloneElement(child, { parent: id }))}
      </div>
    )
  }
}
