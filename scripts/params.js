const R = require('ramda')

var params = {}

params.write = function(state) {
  location.hash = `${encode(state.title)}` +
  `@${stringify(state.reasons.pros)}` +
  `@${stringify(state.reasons.cons)}` +
  `@${state.max || ''}`
}

params.read = {
  title: () => (!ithHash(0) || ithHash(0) === '#') ? '' : decode(ithHash(0).substr(1)).trim()
, pros: () => ithHash(1) ? paramsToReasons(1) : [] 
, cons: () => ithHash(2) ? paramsToReasons(2) : []
, max: () => ithHash(3) ? ithHash(3) : 5 
}

function paramsToReasons(i) {
  let arr = R.dropLast(1, ithHash(i).split('?'))
  return R.map(reasonObj, arr)
}

function reasonObj(x) {
  let reason = x.split('&')      
  return {name: R.drop(2, reason[0]), rating: R.drop(2, reason[1])}
}

const ithHash = (i) => location.hash ? location.hash.split('@')[i] : false

const stringify = (arr) => R.reduce(
    (a,b) => a + `n=${encode(b.name)}&r=${encode(b.rating)}?`, '' , arr) 

const encode = (string) => encodeURIComponent(string)

const decode = (string) => decodeURIComponent(string)

module.exports = params

