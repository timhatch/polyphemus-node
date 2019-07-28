const para = {
  AU1: [246, 250],
  AU2: [254, 258],
  B1:  [88, 85],
  B2:  [89, 86],
  B3:  [90, 87],
  AL1: [230, 234],
  AL2: [238, 242],
  RP1: [262, 266],
  RP2: [270, 274],
  RP3: [278, 282]
}

const lead = {
  O15: [2, 1],
  U20: [18, 17],
  U18: [19, 15],
  U16: [20, 16], 
  ...para
}

const boulder = {
  O15: [5, 6],
  U20: [81, 84],
  U18: [79, 82],
  U16: [80, 83] 
}

const speed = {
  O15: [24, 23],
  U20: [59, 58],
  U18: [60, 57],
  U16: [61, 56]
}

const combined = {
  O15: [42, 45],
  U20: [288, 291],
  U18: [286, 289],
  U16: [287, 290]
}

export const disciplines = { boulder, lead, speed, combined }

// groupsAsArray :: (int) -> ([int])
// Return an array containing either male or female grp_ids. The input integer
// determines whether the return list is female gep_id (index === 0) or male
// grp_ids (index === 1)
export const groupsAsArray = (index) => [].concat(...Object.values(disciplines)
  .map(x => Object.values(x).map(y => y[index])))

// findDiscipline :: (int) => (str)
// return the discipline (key value) associated with some grp_id
export const findDiscipline = (grpid) => Object.entries(disciplines)
  .map(([k, v]) => ([k, [].concat(...Object.values(v))]))
  .find(x => x[1].includes(grpid))[0]

// isMaleCategory :: (int) => (bool)
// returns true if the passed grp_id value is for a male category
export const isMaleCategory = (grpid) => groupsAsArray(1).includes(grpid) ? true : false

// findCombinedGrpId :: (int) -> (int)
// Find the Combined grp_id associated with some boulder/lead/speed grp_id
// If the grpid is para, return itself (this is safe) otherwise, return the combined
export const findCombinedGrpId = (grpid) => {
  let ageGroup = findAgeGroup(grpid)
  return Object.keys(para).includes(ageGroup)
    ? grpid
    : disciplines.combined[ageGroup][isMaleCategory(grpid) ? 1 : 0]
}

// findAgeGroup :: (int) -> (str)
// Find the Age Group for some grp_id
// If the grpid is para, return the classification
export const findAgeGroup = (grpid) => {
  let discipline = findDiscipline(grpid)
  return Object.entries(disciplines[discipline]).find((x) => x[1].includes(grpid))[0]
}
