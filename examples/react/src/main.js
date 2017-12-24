import './main.css'

import React from 'react'
import { render } from 'react-dom'
import navigation, { keyCodes } from './navigation'
import App from './App'

const $id = (id) => document.getElementById(id)

const addClass = (className) => (id) => {
  const el = $id(id)
  el && el.classList.add(className)
}

const removeClass = (className) => (id) => {
  const el = $id(id)
  el && el.classList.remove(className)
}

navigation.on('focus', addClass('focused'))
navigation.on('blur', removeClass('focused'))
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
