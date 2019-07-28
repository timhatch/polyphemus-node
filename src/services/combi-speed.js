// transformation methods to transform the results data reported by eGroupware for the each
// stage of the Combined::Speed::Final to present "live" updates of the in-discipline ranking
//
// Final results are reported in route == -1 (the General Result) as the following parameters:
// result3, result_rank3, result_detail3 - data for the 1/4 final stage
// result4, result_rank4, result_detail4 - data for the 1/2 final stage
// result5, result_rank5, result_detail5 - data for the 1/1 final stage
// NOTE: The intention is to forces the results array to have a ranking order corresponding to
// allowable pairing outcomes as follow:
// { result_rank3: 1, result_rank4: 1, result_rank5: 1 }
// { result_rank3: 1, result_rank4: 1, result_rank5: 2 }
// { result_rank3: 1, result_rank4: 3, result_rank5: 3 }
// { result_rank3: 1, result_rank4: 3, result_rank5: 4 }
// { result_rank3: 5, result_rank4: 5, result_rank5: 5 }
// { result_rank3: 5, result_rank4: 5, result_rank5: 6 }
// { result_rank3: 5, result_rank4: 7, result_rank5: 7 }
// { result_rank3: 5, result_rank4: 7, result_rank5: 8 }

// Use the compose and groupBy utility methods
import { compose, groupBy } from './utilities'

// stage :: (a, b) -> (c)
// sig { params(a: Hash, b:Hash).returns(Int) }
// Order hashes based on the result_rank3 and result_rank4 values
const stage = (a, b) => {
  if (a.result_rank3 > b.result_rank3) return 1
  if (a.result_rank3 < b.result_rank3) return -1

  if (a.result_rank4 > b.result_rank4) return 1
  if (a.result_rank4 < b.result_rank4) return -1

  return 0
}

// update3 :: (a) -> (b)
// sig { params(x: Hash).return(Integer|nil) }
// Force the ranking following the first stage to be either:
// 1    - win
// 5    - lose
// null - not started
const update3 = (x) => x.result_rank3 
  ? parseInt(x.result_rank3, 10) === 1 ? 1 : 5
  : null

// fixRoute3 :: (a) -> (b)
// sig { params(Array[Hash]).return(Array[Hash])
// Call update3 on all items in the array of results
const fixRoute3 = (arr) => arr.map((x) => ({ ...x, result_rank3: update3(x) }))

// update4 :: (a) -> (b) ->(c)
// sig { params(len: Integer).return(Proc) }
//  .sig { params(x: Hash, i: Integer).return(Hash) }
// Force the ranking following the first stage to be either:
// 1|3|5|7      - force increments to result_rank3 values of 0|2
// and make result_rank4 == result_rank3 where not started
const update4 = (starters) => (x, i) => {
  let result_rank4 = x.result_rank3
  switch (starters) {
    case 4:
      // unmodified eGroupware pairing result_rank4 values:
      // { w: 1, w: 2, l: 3, l: 4 } -> apply += [+0, +0, +2, +2] to result_rank3
      result_rank4 += parseInt(i / 2) % 2 * 2 // evaluated in order as % has equal precedence to * 
      break
    case 2:
      // unmodified eGroupware pairing result_rank4 values:
      // { w: 1, l: 2 } -> apply += [+0, +2] (and +0 where not started) to result_rank3
      // Use the bitwise 'and' operator
      result_rank4 += x.result4 ? parseInt(x.result_rank4) & 2 : 0 
      break 
    default:
  }
  return { ...x, result_rank4 }
}

// update_rank4 :: (a) -> (b)
// sig { params(Array[Hash]).return(Array[Hash]) }
// Apply update4 to each sub-array of the results
const update_rank4 = (arr) => {
  let starters = arr.filter(x => !!x.result_rank4).length
  return arr.sort(stage)              // call sort() here as the update4 method is index-sensitive
            .map(update4(starters))
}

// fixRoute4 :: (a) -> (b)
// sig { params(Array[Hash]).return(Array[Hash])
// Call update_rank4 on all items in the array of results
const fixRoute4 = (arr) => {
  let g = Object.values(groupBy('result_rank3')(arr))
  let h = g.length ? g : [arr]
  return h.map(update_rank4).flat(1)
}
// update5 :: (a, b) -> (c) 
// sig { params(Hash, Integer).return(Hash) }
// If there is no result5 property, return the hash unmodified
// If there is a result5 property, then either:
// a) if result_rank4 exists, the speed stage is in progress, check result_rank5 
//    against result_rank4 and either leave it unmodified or increment the value by 1
// b) if result_rank4 does not exist, the speed stage is complete so return
const update5 = (x, i) => {
  if (!x.result5) return x

  let result_rank5 = parseInt(x.result_rank5)
  if (!!x.result_rank4) {
    result_rank5 = (result_rank5 === x.result_rank4) ? result_rank5 : x.result_rank4 + 1
  }

  return { ...x, result_rank5 }
} 

// fixRoute5 :: (a) -> (b)
// sig { params(Array[Hash]).return(Array[Hash])
// Call update5 on all items in the array of results
// NOTE: This would be more convenient if we had a deep map method
const fixRoute5 = (arr) => {
  let g = Object.values(groupBy('result_rank4')(arr))
  let h = g.length ? g : [arr]
  return h.map(sub => sub.map(update5)).flat(1)
}


// composeSpeedResults :: (a) -> (b)
// sig { params(Array[Hash]).return(Array[Hash]) }
// export composeSpeedResults, which applies fixRoute5, fixRoute4 and fixRoute3 in sequence
export const composeSpeedResults = compose(fixRoute5, fixRoute4, fixRoute3)
