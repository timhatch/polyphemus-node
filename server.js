// const express = require('express')
import express from 'express'

const app  = express()
const port = process.env.PORT || 3000

app.get('/results', (req, res) => {
  let params = { comp: 7844, cat: 42, ...req.query }
  res.send('params: ' + JSON.stringify(params))
})

app.use(function (req, res, next) {
  res.status(404).send("Error 404")
})

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Error 500')
})

app.listen(port, () => console.log('listening on http://localhost:' + port))

