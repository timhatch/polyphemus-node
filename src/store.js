import { isObject }  from './services/utilities'

const parseRoute = (r) => !!r && parseInt(r) > 0 ? [-1, -3] : [0, -1, -3]

class Store {
  // Constructor
  constructor(httpservice, { comp=7844, cats=[42], routes=[0, -1, -3] } = {}) {
    // Static (non-observable) properties
    this.http     = httpservice
    this.requests = new Map(Object.entries({ comp, cats, routes }))  // Stored params for data requests
    this.results  = new Map()                                       // Retrieved results data
  }

  get routes() {
    return this.requests.get('routes')
  } 

  // _composeXHRParams :: () -> ([a])
  // Iterate over the categories and routes within the requests Map, producing an array of
  // requests object for each individual eGroupware query
  _composeXHRParams() {
    const comp   = this.requests.get('comp')
    const routes = this.requests.get('routes')
    const cats   = this.requests.get('cats')
    return [].concat(...cats.map((cat) => routes.map((route) => ({ comp, cat, route }))))
  }

  async _handleRequests(requests, promises = []) {
    // Fetch results for each of the requests passed
    requests.forEach((query) => promises.push(this.http.fetchResults(query)))

    // If no results are returned and at least one query has route === 0, fetch the list of
    // registered competitors for the competition
    // TODO: Check if this relies on null being returned for unsuccessful queries
    const results       = (await Promise.all(promises)).filter(isObject)
    const qualification = requests.find(x => x.route === 0)
    if (!results.length && !!qualification) { 
      results.push(await this.http.fetchStarters(qualification))
    }
    // Return the retrieved results/startlist
    return results.filter(isObject)
  }

  // Fetch [n] sets of data from the server
  // NOTE: This method will only overwrite existing results for the same category/round.
  //       If existing results need to be deleted, that needs to be dealt with in whichever method
  //       calls this fetchResults
  async fetchResults() {
    // Get [n] sets of results, then upsert each set into this.results and reset the loading
    // indicator when we've finished
    const requests = this._composeXHRParams()
    const response = await this._handleRequests(requests)
    if (isObject(response) && !!response[0] && !!response[0].cancel) return 

    response.forEach((x) => Object.keys(x).forEach((k) => this.results.set(k, x[k])))
  }

  // setRequestParams :: (Object) -> ()
  // Update the requests Observable Map.
  // NOTE: Flushes any existing results
  setRequestParams(obj) {
    let data = {
      cats: [parseInt(obj.cat, 10) || 42],
      comp: parseInt(obj.comp, 10) || 7844,
      routes: parseRoute(obj.route || 0)
    }

    Object.keys(data).forEach((x) => this.requests.set(x, data[x]))
    this.results.clear()
  }
}

export default Store
