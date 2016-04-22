// Render a flimflam component using flyd, ramda, and snabbdom

import flyd from 'flyd'
import R from 'ramda'
import snabbdom from 'snabbdom'

flyd.lift = require('flyd/module/lift')
flyd.scanMerge = require('flyd/module/scanmerge')

const defaultPatch = snabbdom.init([
  require('snabbdom/modules/class')
, require('snabbdom/modules/props')
, require('snabbdom/modules/style')
, require('snabbdom/modules/eventlisteners')
, require('snabbdom/modules/attributes')
])


// Given a UI component object with these keys:
//   streams: an object of event names set to flyd streams
//   state: an initial default component (plain js object) to be set immediately on pageload
//   updates: an array of pairs of flyd streams and updater functions (with each stream, make an update on the component for each new value on that stream)
//   children: an object of child components
// Return:
//   component$: A single component stream that combines the default component, updaters, and child components
//   vtree$: a stream of snabbdom VTrees for every value on the component stream
function render(component, view, container, options) {
  options = options || {}
  let patch = options.patch || defaultPatch

  // Render it!
  let component$ = toComponentStream(component, options)
  let vtree$ = flyd.scan(patch, container, flyd.map(view, component$))
  return { component$, vtree$ }
}


// Given a component object (and options), return a component stream based on all the streams and updates from the component
//
// We use flyd.scanMerge to combine all the streams/updates into one single stream
//
// We flip the component's updater functions to make it more compatible with Ramda functions.
// That is, the updater functions for flyd.scanMerge are like scan: (accumulator, val) -> accumulator
// instead we want (val, accumulator) -> accumulator
// That way we can use partial applicaton functions easily like { stream1: R.assoc('prop'), stream2: R.evolve({count: R.inc}) }
function toComponentStream(component, options) {
  // Construct array of pairs of stream/updateFunc to use with scanMerge
  let updatePairs = R.compose(
    R.map(R.apply((key, fn) => [component.streams[key], (state, val) => fn(val, state)]))
  , R.filter(R.apply((key, fn) => component.streams[key])) // only use streams actually present in .streams
  , R.toPairs
  )(component.updates || {})

  // Hooray for scanMerge !!!
  // We must use flyd.immediate so we get the component's default state on the stream immediately on pageload
  let state$ = flyd.immediate(flyd.scanMerge(updatePairs, component.state || {}))

  // update the 'state' key for every new value on the state stream
  let component$ = flyd.map(s => R.assoc('state', s, component), state$)

  // Reduce over all child components, lifting each one into a single parent stream
  // Stream of child updates of pairs of [childName, childcomponent]
  component$ = R.reduce(
    (stream, pair) => {
      let [key, child] = pair
      let child$ = toComponentStream(child, options)
      return flyd.lift(R.assocPath(['children', key]), child$, stream)
    }
  , component$
  , R.toPairs(component.children))

  // You can get a console.log record of all new `.state` objects on your component stream for debugging by setting `options.debug: true`
  if(options.debug)
    flyd.map(s => console.log('%cState: %O', "color:green; font-weight: bold;", s.state), component$)

  return component$
}

module.exports = render

