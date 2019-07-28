import express      from 'express'

import Store        from './src/store'
import HTTPService  from './src/services/egw-accessor'
import { reducer }  from './src/services/results__list-c'

const strip = (r) => {
  delete r.acl
  delete r.federation
  delete r.fed_url
  delete r.fed_id
  delete r.rank_value
  delete r.result_modified
  delete r.result_detail1
  delete r.result_detail5
  delete r.result_detail6
  delete r.result_detail7
  delete r.rkey
  delete r.url
  return r
}

async function fetch(store, response) {
  let results = await store.fetchResults()
  let data    = reducer(store)().map(strip)
  response.send(JSON.stringify(data))
}

const store = new Store(HTTPService)

// BASIC EXPRESS SERVER IMPLEMENTATION

const app  = express()
const port = process.env.PORT || 3000

app.get('/results', (req, res) => {
  store.setRequestParams(req.query)
  fetch(store, res)
})

app.use(function (req, res, next) {
  res.status(404).send("Error 404")
})

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Error 500')
})

app.listen(port, () => console.log('listening on:' + port))

