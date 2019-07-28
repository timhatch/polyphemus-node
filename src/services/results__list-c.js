import { updateQualiRanking } from './combi-quali'
import { updateFinalRanking } from './combi-final'

// finalStarted :: (a) -> (b)
// sig { params(Array[Hash]).return(Boolean) }
// The final round is underway if any climber has a result in Speed
// FIXME: Check is result_rank4 and result_rank5 tests are redundant
const finalStarted = (arr) => 
  arr.filter((p) => !!p.result_rank3 || !!p.result_rank4 || !!p.result_rank5)
     .length > 0 ? true : false

// qualiComplete :: (a) -> (b)
// sig { params(Array[Hash]).return(Boolean) }
// Qualification is complete if all climbers have results in all 3 stages
const qualiComplete = (arr) =>
  arr.filter((p) => !!p.result_rank0 && !!p.result_rank1 && p.result_rank2)
     .length === arr.length ? true : false

// 
const handleQualiData = (route_0, route_1, route_3) => {
  return !finalStarted(Object.values(route_1))
    ? mergeQualiStarters(route_0, route_1)
    : mergeGeneralResult(route_1, route_3)
}

const mergeQualiStarters = (route_0, route_1) => {
  // console.log('mergeQualiStarters')
  let quali_result = updateQualiRanking(Object.values(route_1))
  let has_started  = quali_result.map((x) => x.PerId)
  let not_started  = Object.values(route_0).filter((k) => !has_started.includes(k.PerId))
  return quali_result.concat(not_started) 
}

// 
const mergeGeneralResult = (route_1, route_3) => {
  // console.log('mergeGeneralResult')
  let general_result = Object.keys(route_1).map((k) =>
    ({ ...route_1[k], result_rank: route_3[k].result_rank || null }))
  return updateQualiRanking(general_result)
}

const mergeFinalStarters = (route_1, route_3) => {
  // console.log('mergeFinalStarters')
  let starters = Object.values(route_1)
                       .filter((x) => parseInt(x.result_rank, 10) < 9)
                       .map((x) => ({ ...x, quali_rank: route_3[x.PerId].result_rank || null }))
  let results  = updateFinalRanking(starters)
  return starters.map((x) => ({ ...x, result_rank: null, ...results.find((y) => y.PerId === x.PerId) }))
}

// handleFinalData :: (a, b) -> (c)
// sig { params(route_1: Hash, route_3: Hash).return(Array[Hash]) }
// Given rhe current general result (route_1), merge in the qualification ranking from the stored Quali
// result (route_3) and return either the merged data or, if the quali round is incomplete, an empty array
const handleFinalData = (route_1, route_3) => {
  // console.log('handleFinalData')
  let data = Object.values(route_1)
  return (finalStarted(data) || qualiComplete(data)) 
    ? mergeFinalStarters(route_1, route_3)
    : []
} 

// reducer :: (a) -> () -> (b)
export const reducer = (store) => () => {
  let keys    = [...store.results.keys()].sort()

  let route_0 = store.results.get(keys.find(x => x.endsWith('0'))) || {}
  let route_1 = store.results.get(keys.find(x => x.endsWith('1'))) || {}
  let route_3 = store.results.get(keys.find(x => x.endsWith('3'))) || {}
  console.log(store.routes) 
  return (store.routes.length > 2)
    ? handleQualiData(route_0, route_1, route_3) 
    : handleFinalData(route_1, route_3)
}
