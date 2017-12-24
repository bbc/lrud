import './main.css'

import React from 'react'
import { render } from 'react-dom'
import navigation, { keyCodes } from './navigation'
import List from './List'
import Button from './Button'

navigation.on('focus', function (id) {
  const el = document.getElementById(id)
  if (el) el.classList.add('focused')
})

navigation.on('blur', function (id) {
  const el = document.getElementById(id)
  if (el) el.classList.remove('focused')
})

navigation.on('activate', function (id) {
  const el = document.getElementById(id)
  if (el) el.classList.add('active')
})

navigation.on('deactivate', function (id) {
  const el = document.getElementById(id)
  if (el) el.classList.remove('active')
})

document.onkeydown = function (event) {
  if (keyCodes[event.keyCode]) {
    navigation.handleKeyEvent(event)
    event.preventDefault()
  }
}

render(
  <List
    id='root'
    orientation='vertical'
  >
    <List
      id='appbar'
      orientation='horizontal'
      className='AppBar'
    >
      {[ 1, 2, 3, 4, 5 ].map((text, i) => (
        <Button
          key={i}
          id={`appbar-${i}`}
          className='AppBar__item'
        >
          {text}
        </Button>
      ))}
    </List>
    <List
      id='vlist'
      className='Vlist'
    >
      {[ 1, 2, 3 ].map((text, i) => (
        <Button
          key={i}
          id={`vlist-${i}`}
          className='Vlist__item'
        >
          {text}
        </Button>
      ))}
    </List>
    <List
      id='grid'
      className='Grid'
      grid
    >
      {[[ 1, 2, 3, 4 ], [ 5, 6, 7, 8 ]].map((row, i) => (
        <List
          key={i}
          id={`grid-row-${i}`}
          className='Grid__row'
          orientation='horizontal'
          wrapping
        >
          {row.map((text, i) => (
            <Button
              key={i}
              id={`grid-btn-${text}`}
              className='Grid__item'
            >
              {text}
            </Button>
          ))}
        </List>
      ))}
    </List>
  </List>,
  document.getElementById('app'),
  () => navigation.focus('root')
)
