import { groupByActiveEvent, setRankValue, setCombinedRanking } from './combi-rankg'

// QUALIFICATION RANKING

// rankValue1 :: (a) -> (b)
// sig { params(Hash).return(Hash) }
// Calculated and append final_points and rank_value for route0
const rankValue0 = (x) => {
  let quali_points = x.points0
  let start_order  = x.start_order || 0
  let rank_value   = setRankValue(quali_points, start_order)
  return { ...x, rank_value, quali_points }
}

// rankValue2 :: (a) -> (b)
// sig { params(Hash).return(Hash) }
// Calculated and append final_points and rank_value for route1
const rankValue1 = (x) => {
  let quali_points = x.points0 * x.points1
  let start_order  = x.start_order || 0
  let rank_value   = setRankValue(quali_points, start_order)
  return { ...x, rank_value, quali_points }
}

// rankValue3 :: (a) -> (b)
// sig { params(Hash).return(Hash) }
// Calculated and append final_points and rank_value for route2
// TODO: Could replace points0, points1 and points2 by an array, applying Array.reduce(:*)
const rankValue2 = (x) => {
  // let quali_points = parseFloat(x.quali_points)
  let quali_points = x.points0 * x.points1 * x.points2
  let rank_value   = parseInt(x.result_rank, 10) || null
  return { ...x, rank_value, quali_points }
}

// updateQualiRanking :: (a) -> (b)
// sig { params(Array[Hash]).return(Array[Hash]) }
// Calculate and update general rankings for an array of competitors who may be at 
// different stages of the competition, e.g. some have speed results only where others
// have speed + boulder, or some have speed + boulder only where others have speed +
// boulder + lead
export const updateQualiRanking = (arr) => {
  let start   = 1
  let methods = { '3': rankValue2, '2': rankValue1, '1': rankValue0 }
  let results = groupByActiveEvent([0, 1, 2])(arr)

  return Object.keys(results).reverse().map((x) => {
    let data = setCombinedRanking(start)(results[x].map(methods[x]))
    start   += results[x].length
    return data
  }).flat(1)
}
