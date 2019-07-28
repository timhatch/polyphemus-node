import axios            from 'axios'
import axiosCancel      from 'axios-cancel'

import { fromEntries }  from './utilities'
import { disciplines, findAgeGroup, findCombinedGrpId,
  findDiscipline, groupsAsArray, isMaleCategory } from './egw-utilities'

// Augment axios with the cancel and cancelAll methods provided by axios
axiosCancel(axios, { debug: false })

// Default URL
// NOTE: eGroupware test system URL
const _url = 'https://digitalrock.egroupware.de/egw/ranking/json.php'
// NOTE: Default URL and undocumented HTTPS URL
// const _url = 'http://egw.ifsc-climbing.org/egw/ranking/json.php'
// const _url = 'https://ifsc-egw.wavecdn.net/egw/ranking/json.php'
const _alt = 'https://ifsc.austriaclimbing.com/ch-combined'
// NOTE: Austria Climbing proxy
// const _url = 'https://www.innsbruck2018.com/ifsc/json.php'

// Fetch data from eGroupware
// - axios defaults to { type: 'json' } so don't specify this
// - add a timestamp to the supplied query to avoid caching issues
// - add a requestId to work with axios-cancel.
//   NOTE: that the requestID needs to be unique. Non-unique requestIds can be used,
//   but axios-cancel appears to remove requewstIds when complete, so concurrently
//   running requests are cancelled
//
const fetch = async (query) => axios.get(_url, { 
  params: { time: Date.now(), ...query },
  timeout: 10000,
  requestId: query.type || JSON.stringify(query)
})

// Utility method to return a [k, v] representation of object x with PerId as key
const per_id = (x) => [x.PerId, x]

// Class definition
//
class EGroupwareHTTPService {

  // Static methods linked to eGroupware specific constants
  // fGroups - return a list of female grp_ids
  // mGroups - return a list of male grp_ids
  // findDiscipline - return the discipline associated with some grp_id
  // gender - return true if grp_id === x is for a male category
  static fGroups () { return groupsAsArray(0) }
  static mGroups () { return groupsAsArray(1) }
  static discipline (grpid) { return findDiscipline(grpid) }
  static categories ()      { return disciplines }
  static gender     (grpid) { return isMaleCategory(grpid) }
  static ages       (grpid) { return findAgeGroup(grpid) }

  // Fetch the IFSC calendar
  static async fetchCalendar(query) {
    try {
      const data_url = `${_alt}/${query}.json` 
      const response = await axios.get(data_url, {
        timeout: 7500,
        requestId: JSON.stringify(query)
      })
      return response.data
    } catch (e) {
      return null
    }
  }

  // Fetch the result list for a specific comp/category/route combination
  // @params = comp (WetId), cat (GrpId) and route (route)
  static async fetchRanking(query) {
    try {
      const response    = await fetch(query)
      const results     = { ranking: fromEntries(response.data.participants.map(per_id)) }
      const route_names = response.data.route_names 
      return { results, route_names }
    } catch (e) {
      return axios.isCancel(e) ? { cancel: true } : null
    }
  }

  // Fetch the result list for a specific comp/category/route combination
  // @params = comp (WetId), cat (GrpId) and route (route)
  static async fetchResults(query) {
    const uuid  = `${query.cat}.${query.route}`
    try {
      const response = await fetch(query)
      return { [uuid]: fromEntries(response.data.participants.map(per_id)) }
    } catch (e) {
      return axios.isCancel(e) ? { cancel: true } : null
    }
  }

  // Fetch the list of registered team members
  // Expects a query format: { comp: int, cat: int }
  static async fetchStarters(query) {
    const uuid  = `${query.cat}.0`
    const combi = findCombinedGrpId(query.cat)
    const grpId = (x) => [query.cat, combi].includes(parseInt(x.cat, 10))
    try {
      const response = await fetch({ comp: query.comp, type: 'starters' })
      return { [uuid]: fromEntries(response.data.athletes.filter(grpId).map(per_id)) }
    } catch (e) {
      return null
    }
  }

  // Fetch a career history
  // Expects a single query parameter { person: int }
  static async fetchPerson(query) {
    try {
      const response = await fetch(query)
      return response.data.results
    } catch (e) {
      return null
    }
  }
  
  // Cancel any pending requests
  // NOTE: Because fetchStarters is queued to be fired after all fetchResults
  // requests have been resolved, axios-cancel may or may not fire on the fetchStarters
  // request. We can resolve this by calling a specific cancel call on the 'starters'
  // request and wrapping that in setTimeout(fn, 0) to push execution to the back 
  // of the queue. Seems to work...
  static cancelRequests() {
    axios.cancelAll()
    setTimeout(() => axios.cancel('starters'), 0)
  }
}

export default EGroupwareHTTPService
