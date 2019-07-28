import { composeSpeedResults } from './combi-speed'
import { groupByActiveEvent, setRankValue, setCombinedRanking } from './combi-rankg'

// FINAL RANKING

// rankValue5 :: (a) -> (b)
// sig { params(Hash).return(Hash) }
// Calculated and append final_points and rank_value for route5
const rankValue5 = (x) => {
  let final_points = x.points5
  let rank_value   = setRankValue(final_points, -x.quali_rank)
  return { ...x, rank_value, final_points }
}

// rankValue6 :: (a) -> (b)
// sig { params(Hash).return(Hash) }
// Calculated and append final_points and rank_value for route6
const rankValue6 = (x) => {
  let final_points = x.points5 * x.points6
  let rank_value   = setRankValue(final_points, -x.quali_rank)
  return { ...x, rank_value, final_points }
}

// rankValue7 :: (a) -> (b)
// sig { params(Hash).return(Hash) }
// Calculated and append final_points and rank_value for route7
const rankValue7 = (x) => {
  // let final_points = parseFloat(x.final_points)
  let final_points = x.points5 * x.points6 * x.points7
  let rank_value   = parseInt(x.result_rank, 10) || null
  return { ...x, rank_value, final_points }
}

// setDisplayData :: (a) -> (b)
// sig { params(Hash).return(String) }
// Return a string of up-arrow and down-arrow characters to indicate the win-loss record
// of any competitor in the final
const setDisplayDetail = (x) => {
  let w = '▲', l = '▽'
  let a = x.result3 
    ? x.result_rank3 === 1 ? w : l
    : ''
  let b = x.result4
    ? [1, 5].includes(x.result_rank4) ? w : l
    : ''

  return x.result5 ?
    binary(x.result_rank5).replace(/1/g, w).replace(/0/g, l)
    : a + b 
}

// binary :: (a) -> (b)
// sign { params(Integer).return(String) }
// Return the 8 bit binary representation of some integer value
const binary = (x) => ('00' + (8 - x).toString(2)).substr(-3) 

// setDisplayResults :: (a) -> (b)
// sig { params(Hash).return(Hash) }
// Calculate result_rank5 and result5 for any competitor within the Final Speed stage so
// that the display elements need only respond to changes in these two params
const setDisplayResults = (x) => {
  let result5      = setDisplayDetail(x)
  let result_rank5 = x.result_rank5 || x.result_rank4 || x.result_rank3 || null
  return { ...x, result5, result_rank5 }
}

// updateFinalRanking :: (a) -> (b)
// sig { params(Array[Hash]).return(Array[Hash]) }
// Calculate and update general rankings for an array of competitors who may be at 
// different stages of the competition, e.g. some have speed results only where others
// have speed + boulder, or some have speed + boulder only where others have speed +
// boulder + lead
export const updateFinalRanking = (arr) => {
  let start   = 1
  let methods = { '3': rankValue7, '2': rankValue6, '1': rankValue5 }
  let results = groupByActiveEvent([5, 6, 7])(composeSpeedResults(arr).map(setDisplayResults))

  return Object.keys(results).reverse().map((x) => {
    let data = setCombinedRanking(start)(results[x].map(methods[x]))
    start   += results[x].length
    return data
  }).flat(1)
}

