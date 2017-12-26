import './main.css'

import React from 'react'
import { render } from 'react-dom'
import navigation, { keyCodes } from './navigation'
import App from './components/App'

const $id = (id) => document.getElementById(id)

const addClass = (className) => (id) => {
  const el = $id(id)
  el && el.classList.add(className)
}

const removeClass = (className) => (id) => {
  const el = $id(id)
  el && el.classList.remove(className)
}

navigation.on('focus', (id) => {
  const addFocus = addClass('focused')
  const node = navigation.nodes[id]

  addFocus(id)
  node.onFocus && node.onFocus(id)
})

navigation.on('blur', (id) => {
  const removeFocus = removeClass('focused')
  const node = navigation.nodes[id]

  removeFocus(id)
  node.onBlur && node.onBlur(id)
})

navigation.on('move', (event) => {
  const node = navigation.nodes[event.id]

  if (node.orientation === 'horizontal') {
    if (event.offset === 1) {
      console.log('You moved right')
    } else {
      console.log('You moved left')
    }
  } else {
    if (event.offset === 1) {
      console.log('You moved down')
    } else {
      console.log('You moved up')
    }
  }

  node.onMove && node.onMove(event)
})

navigation.on('activate', addClass('active'))
navigation.on('deactivate', removeClass('active'))
navigation.on('select', (id) => alert(`Selected: ${id}`))

document.onkeydown = (event) => {
  if (keyCodes[event.keyCode]) {
    navigation.handleKeyEvent(event)
    event.preventDefault()
  }
}

render(<App />, $id('app'), () => navigation.focus('root'))
