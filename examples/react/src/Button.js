import React, { PureComponent } from 'react'
import navigation from './navigation'

export default class Button extends PureComponent {
  componentWillUnmount () {
    navigation.unregister(this.props.id)
  }

  render () {
    const { id, parent, data, className, children } = this.props

    navigation.register(id, { parent, data })

    return (
      <div
        id={id}
        className={className}
      >
        {children}
      </div>
    )
  }
}
