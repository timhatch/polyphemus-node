/*
 *  FUNCTIONAL PROGRAMMING METHODS
 *
 */

// compose :: (a) -> (b)
// sig { params(*Proc).return(Proc) }
// Compose an array of functions (right to left application)
const compose2 = (f, g) => (...val) => f(g(...val))
export const compose  = (...f) => f.reduce(compose2)

// groupBy :: (a) -> (b) -> (c)
// sig { params(prop: String).params(Array[Hash]).return(Array[Array[Hash]]) }
// Emulate Ruby's group_by method, taking an array of objects (xs) and grouping them by some included
// property (prop)
export const groupBy = (prop) => (xs) =>
  xs.filter((x) => x[prop])
    .reduce((rv, x) => Object.assign(rv, { [x[prop]]: [...(rv[x[prop]] || []), x] }), {})


// isObject :: (a) -> (b)
// sig { params(Any).return(Booleam)
// Return true if the parameter argument is an Object or an Array
export const isObject = (obj) => obj instanceof Object // !Array.isArray(obj)

// tranpose :: (a) -> (b)
// sig { params(Array[Array]).returns(Array[Array]) }
// Transpose a 2d array (in this case to "pair" associated qualification routes
// stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript#17428705
// export const transpose = (mx) => mx[0].map((col, c) => mx.map((row, r) => mx[r][c]))
// export const transpose = (mx) => mx.reduce((a, c) => c.map((x, i) => (a[i] || []).concat(c[i])), [])
export const transpose = (mx) => mx[0].map((col, i) => mx.map((row) => row[i]))

// fromEntries :: (a) -> (b)
// sig { params(Array[Array]).returns(Hash) }
// NOTE: This is a shim for Object.fromEntries(), which is not yet supported in IOS/Android webkit
// stackoverflow.com/questions/20059995/how-to-create-an-object-from-an-array-of-key-value-pairs#20060044
export const fromEntries = (arr) => arr.reduce((a, c) => { a[c[0]] = c[1]; return a }, {})


/*
 *  TEXT PROCESSING METHODS
 *
 */

// Parse the eGroupware competition name and return the host city
// Competition names are typically formatted like so:
// '3rd CISM World Winter Games - Sochi (RUS) 2017' or
// 'IFSC Climbing Worldcup (B) - Meiringen (SUI) 2017 '
// So we split by ' - ' (to avoid hyphens) and strip out numbers, nation codes and whitespace
//
export const truncateWCHostname = (name) => {
  return name.split(' - ')
    .pop()
    .replace(/[0-9]/g,'')
    .replace(/\([A-Za-z]{3,}\)/g, '') 
    .replace('PROVISIONAL','')
    .replace(/^\s+|\s+$/g,'')
}

// Force a name in to Sentence Case (from all capitals, or all lowercase)
// NOTE: This implementation uses an ES6 arrow function to recapitalise letters, it may be more
// efficient to expand this function so that the arrow function is not re-interpreted on each call
// NOTE: Doesn't work for names which include diacritic characters, as these are detected as 
// word boundaries (so the letter following the diacritic is capitalised)
export const sentenceCase = (name) => name.toLowerCase().replace(/\b([a-z])/g, (v) => v.toUpperCase())

// rankorder :: (a, b) -> int
// Comparator function to sort by rank, interleaving results from multiple starting groups
// 1) Sort by computed position (i.e. unranked last)
// 2) If computed position is equal, sort by starting group
// 3) If computed position is equal and starting group is equal, sort by PerId (this is purely to give
//    a stable sort, it confers no precedence to the results)
export const rankorder = (a, b) => {
  // Compute a position, assigning a value in the range >500 to climbers yet to start
  const aComputed = parseInt(a.result_rank, 10) || 500 + parseInt(a.start_order, 10)
  const bComputed = parseInt(b.result_rank, 10) || 500 + parseInt(b.start_order, 10)

  if (aComputed > bComputed) return 1
  if (aComputed < bComputed) return -1

  if (a.start_group > b.start_group) return 1
  if (a.start_group < b.start_group) return -1

  if (a.nation > b.nation) return 1
  if (a.nation < b.nation) return -1

  if (a.PerId > b.PerId) return 1
  if (a.PerId < b.PerId) return -1

  return 0
}

// qointOrder :: (a,  b) -> int
// Comparator function to sort by qualifying points (lowest best)
export const qointorder = (a, b) => a.qoints - b.qoints

