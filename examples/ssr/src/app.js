import React from 'react'
import express from 'express'
import path from 'path'
import { renderToStaticMarkup } from 'react-dom/server'
import App from './components/App'
import navigation from './navigation'

const app = express()

app.use('/public', express.static(path.resolve(__dirname, '../public')))

app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'index.html'))
  } catch (error) {
    res.send('Oops ' + error)
  }
})

app.get('/home', (req, res) => {
  try {
    res.json({
      html: renderToStaticMarkup(<App />),
      nodes: navigation.nodes,
      focus: 'root'
    })
  } catch (error) {
    res.send('Oops ' + error)
  }
})

export default app
