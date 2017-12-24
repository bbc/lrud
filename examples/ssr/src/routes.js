import React from 'react'
import express from 'express'
import path from 'path'
import { renderToStaticMarkup } from 'react-dom/server'
import App from './components/App'
import navigation from './navigation'

const app = express()

app.use('/public', express.static(path.resolve(__dirname, '../public')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.get('/home', (req, res) => {
  res.json({
    html: renderToStaticMarkup(<App />),
    nodes: navigation.nodes,
    focus: 'root'
  })
})

export default app
