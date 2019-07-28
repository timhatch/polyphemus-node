import { compose, groupBy }    from './utilities'

// RANKING METHODS FOR THE COMBINED

// setRankingPointsForRoute :: (a) -> (b) -> (c)
// sig { params(Array[Hash]).return(Proc) }
//  .sig { params(index: Integer).return(Array[Hash]) }
// Given some index X, group an array of results by the corresponding result_rankX property values,
// assumed to have been assigned using a Standard Ranking algorithm, then calculate and append 
// the associated ranking points on a rank average basis for tied places
const setRankingPointsForRoute = (arr) => (index) => {
  let prop = `result_rank${index}`
  let pnts = `points${index}`

  return Object.values(groupBy(prop)(arr))
   .map((x) => x.map((y) => ({...y, [pnts]: parseInt(y[prop], 10) + (x.length - 1) / 2.0 }))).flat(1)
}

// setDusplaySortingData :: (a, b) -> (c) -> (d)
// sig { params(ranking: Integer, heat: Integer).return(Proc) }
//  .sig { params(Array[Hash]).return(Array[Hash]) }
// Assign the rank of the climber to either the result_rank or start_order props
// as these are the two props used by the rankorder sorting function (i.e. it sorts
// by start_order where no result_rank is present) so that we display result_rank only
// for heat 1, but preserve the order of display for all other competitors
const setDisplaySortingData = (ranking, heat) => (x) => ({
  ...x, 
  result_rank: heat === 1 ? ranking : null, 
  start_order: heat === 1 ? x.start_order : ranking 
})

// setCombinedRanking :: (a) -> (b) -> (c)
// sig { params(Integer).return(Proc) }
//  .sig { params(Array[Hash]).return(Array[Hash]) }
// Given a starting ranking, curry a ranking method which groups array elements by 'rank_value',
// then assign a ranking to either result_rank or start_order properties.
// NOTE: We can take this simple approach on the assumption that the calculation of rank_value 
// (which needs start_order for countback) precedes calling setDisplaySortingData, which 
// repurposes the same parameter.
// TODO: Avoid repurposing start_order
export const setCombinedRanking = (start) => (arr) => {
  let primary = start
  let grouped = groupBy('rank_value')(arr)
  let keys    = Object.keys(grouped).sort((a, b) => Number(a) - Number(b))
  return keys
    .map((k) => grouped[k])
    .map((items) => {
      let amended = items.map(setDisplaySortingData(start, primary))
      start += items.length
      return amended
    }).flat(1)
}

// concatResults :: (a) -> (b)
// sig { params(Hash).return(Hash) }
// Given an object of form { PerId: [{..}, {..}, {..}], concatenate each of the array
// elements together, appending a stages property at the same time
const concatResults = (obj) => Object.values(obj).map((x) => {
  return x.reduce((acc, curr) => ({...acc, ...curr}), { stages: x.length })    
})

// groupByActiveEvent :: (a) -> (b) -> (c)
// sig { params(Array[Integer]).return(Proc) }
//  .sig { params(Array[Hash]).return(Array[Array[Hash]]) }
// Given an array of route identifiers, and an array of results objects, calculate the ranking points
// acheived by each climber for each route, concatenate these together and return a nested array,
// grouping competitors by the stage in which the are currently competing (1 = speed, 2 = boulder, 
// 3 = lead)
export const groupByActiveEvent = (routes) => (arr) => {
  let withPoints = routes.map(setRankingPointsForRoute(arr)).flat(1)
  return compose(
    groupBy('stages'), 
    concatResults, 
    groupBy('PerId')
  )(withPoints)
}

// 1 <= quali_points <= 8000
// 1 <= start_order <= 20
export const setRankValue = (a, b) =>
  (1e3 * a) - (parseInt(b, 10) / 100) 


// Calculate the Qualification General Ranking
//
//  const head_to_head = (arr) => [0, 1, 2]
//    .map((i) => Math.sign(Number(arr[0][`result_rank${i}`]) - Number(arr[1][`result_rank${i}`])))
//    .reduce((acc, cur) => acc + cur, 0)
//  
//  const split_on_results = ([k, v]) => {
//    const increment = (x, i) => ({ ...x, quali_rank: x.quali_rank + i })
//    switch (head_to_head(v)) {
//      case 1:
//        return [v[1], v[0]].map(increment)
//      case 2:
//        return [v[0], v[1]].map(increment)
//      default:
//        return split_on_seeding([k, v])
//    }
//  }
//  
//  const split_on_seeding = ([k, v]) => {
//    let ranks = v.map(x => x.start_order).sort((a, b) => Number(b) - Number(a))
//    return v.map((x) => ({ ...x, quali_rank: k + ranks.findIndex(y => y === x.start_order) }))
//  }
//  
//  // setInterimRanking :: (a) -> (b) -> (c)
//  // sig { params(Integer).params(Array[Hash]).return(Array[Hash]) }
//  // Given a starting ranking, curry a ranking method which groups array elements by 'rank_value',
//  // then assign a ranking to either result_rank or start_order properties.
//  const setInterimRanking = (start) => (arr) => 
//    compose(Object.entries, groupBy('quali_points'))(arr)
//      .sort((a, b) => Number(a[0]) - Number(b[0]))
//      .map(([k, v]) => {
//        let withRank = [start, v.map((x) => ({...x, quali_rank: start || null }))]
//          start += v.length
//          return withRank
//        })
//  
//  const splitExAequo = (arr) => arr.map(([k, v]) => {
//    switch (v.length) {
//      case 1:
//        return v
//      case 2:
//        return split_on_results([k, v])
//      default:
//        return split_on_seeding([k, v])
//    }
//  }).flat(1)
//  
//  export const calcGeneralRanking = compose(splitExAequo, setInterimRanking(1))
