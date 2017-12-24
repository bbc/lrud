import navigation, { keyCodes } from './navigation'

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

function loadFragment(url, callback) {
  const req = new XMLHttpRequest()
  req.open('GET', url)
  req.send()
  req.onload = () => callback(JSON.parse(req.responseText))
}

loadFragment('/home', ({ html, nodes, focus }) => {
  document.getElementById('app').innerHTML = html

  navigation.nodes = nodes
  navigation.focus(focus)
})
