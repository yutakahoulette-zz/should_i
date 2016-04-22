// Render a flimflam component using flyd, ramda, and snabbdom

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _flyd = require('flyd');

var _flyd2 = _interopRequireDefault(_flyd);

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _snabbdom = require('snabbdom');

var _snabbdom2 = _interopRequireDefault(_snabbdom);

_flyd2['default'].lift = require('flyd/module/lift');
_flyd2['default'].scanMerge = require('flyd/module/scanmerge');

var defaultPatch = _snabbdom2['default'].init([require('snabbdom/modules/class'), require('snabbdom/modules/props'), require('snabbdom/modules/style'), require('snabbdom/modules/eventlisteners'), require('snabbdom/modules/attributes')]);

// Given a UI component object with these keys:
//   streams: an object of event names set to flyd streams
//   state: an initial default component (plain js object) to be set immediately on pageload
//   updates: an array of pairs of flyd streams and updater functions (with each stream, make an update on the component for each new value on that stream)
//   children: an object of child components
// Return:
//   component$: A single component stream that combines the default component, updaters, and child components
//   vtree$: a stream of snabbdom VTrees for every value on the component stream
function render(component, view, container, options) {
  options = options || {};
  var patch = options.patch || defaultPatch;

  // Render it!
  var component$ = toComponentStream(component, options);
  var vtree$ = _flyd2['default'].scan(patch, container, _flyd2['default'].map(view, component$));
  return { component$: component$, vtree$: vtree$ };
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
  var updatePairs = _ramda2['default'].compose(_ramda2['default'].map(_ramda2['default'].apply(function (key, fn) {
    return [component.streams[key], function (state, val) {
      return fn(val, state);
    }];
  })), _ramda2['default'].filter(_ramda2['default'].apply(function (key, fn) {
    return component.streams[key];
  })), // only use streams actually present in .streams
  _ramda2['default'].toPairs)(component.updates || {});

  // Hooray for scanMerge !!!
  // We must use flyd.immediate so we get the component's default state on the stream immediately on pageload
  var state$ = _flyd2['default'].immediate(_flyd2['default'].scanMerge(updatePairs, component.state || {}));

  // update the 'state' key for every new value on the state stream
  var component$ = _flyd2['default'].map(function (s) {
    return _ramda2['default'].assoc('state', s, component);
  }, state$);

  // Reduce over all child components, lifting each one into a single parent stream
  // Stream of child updates of pairs of [childName, childcomponent]
  component$ = _ramda2['default'].reduce(function (stream, pair) {
    var _pair = _slicedToArray(pair, 2);

    var key = _pair[0];
    var child = _pair[1];

    var child$ = toComponentStream(child, options);
    return _flyd2['default'].lift(_ramda2['default'].assocPath(['children', key]), child$, stream);
  }, component$, _ramda2['default'].toPairs(component.children));

  // You can get a console.log record of all new `.state` objects on your component stream for debugging by setting `options.debug: true`
  if (options.debug) _flyd2['default'].map(function (s) {
    return console.log('%cState: %O', "color:green; font-weight: bold;", s.state);
  }, component$);

  return component$;
}

module.exports = render;

