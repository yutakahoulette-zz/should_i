import h from 'snabbdom/h'
import render from 'flimflam-render'
import R from 'ramda'
import flyd from 'flyd'
import serialize from 'form-serialize'
import getWidth from './element-width'
import rating from './rating'
import placeholders from './placeholders'

const mapIndexed = R.addIndex(R.map)
const randEl = (arr) => arr[Math.floor(Math.random() * arr.length)] 

let placeholder = randEl(placeholders)
let container = document.getElementById('container')

function view(ctx) {
  console.log(ctx.state)
  return h('main', [
    header(ctx)
  , h('div.reasons', [
      h('aside', scale(ctx.state.max))
    , h('section', [
        h('ul.cons', reasonsList(ctx, 'cons'))
      , h('ul.pros', reasonsList(ctx, 'pros'))
      ])
    ])
  , footer(ctx)
  ])
}

const round = (a) => Math.round(a * 10) / 10

const scale = (max) =>
  [ h('span', max + ' -')
  , h('span', round(max * 0.75) + ' -')
  , h('span', round(max * 0.5) + ' -')
  , h('span', round(max * 0.25) + ' -')
  , h('span', 0 + ' -')
  ]

const header = (ctx) =>
  h('header', [ 
     'Should I'
    , h('form', {on: {submit: ctx.streams.submitTitle}}
      , [h('input'
        , {props: { autofocus: true, placeholder: placeholder, autocomplete: 'off' }
          , style: { width: ctx.state.title 
            ? (getWidth(ctx.state.title, 'header') + 30 + 'px')
            : (getWidth(placeholder, 'header') + 30 + 'px')}
          , on: {keyup: ctx.streams.saveTitle}
          })
      ])
    ])


const reasonsList = (ctx, pc) => 
  mapIndexed((reason, i) => h('li', {
      attrs: {index: i, rating: reason[1]}
    , style: {delayed:  {height: `${(Math.abs(reason[1]) / ctx.state.max) * 100}%`, opacity: '1'},
              remove: {opacity: '0'}}}
    , [
        h('span.close', {on: {click: ctx.streams.removeReason}}, '×')
      , h('span.text', {on: {click: ctx.streams.editReason}}, reason[0])
      ])
  , ctx.state.reasons[pc])


const footer = (ctx) =>
  h('footer', [
    h('form', {on: {submit: ctx.streams.saveReason}}
    , [ h('p.error', ctx.state.error)
      , h('input', {props: {
                      autocomplete: 'off'
                    , name: 'reason[0]'
                    , type: 'text'
                    , placeholder: 'Add pro or con'
                    }
                    , hook: {
                      update: (vnode) => { ctx.state.focusProOrCon ? vnode.elm.focus() : false }
                    }
                    })
      , rating(-5, 5, 'reason[1]')
      , h('button', {props: {type: 'submit'}}, 'Save')
      ]
    )
  ])

function init(){
  return {
    streams: {
      saveReason: flyd.stream()
    , saveTitle: flyd.stream()
    , submitTitle: flyd.stream()
    , removeReason: flyd.stream()
    , editReason: flyd.stream()
    }
  , updates: {
      saveReason: saveReason 
    , saveTitle: saveTitle
    , removeReason: removeReason
    , submitTitle: submitTitle
    , editReason: editReason
    } 
  , state: {
      reasons: {pros:[], cons:[]}
    , title: ''
    , max: 5
    , error: ''
    , focusProOrCon: false
    , editingReason: false
    }
  }
}

const saveTitle = (ev, state) => R.assoc('title' , ev.target.value , state)

function saveReason(ev, state) {
  ev.preventDefault()
  let form = ev.target
  let reason = serialize(form, {hash: true}).reason
  let plz = 'Please enter a '
  if(!reason) {
    return R.assoc('error', `${plz} pro or con and a rating`, state)
  }
  if(!reason[0]) {
    return R.assoc('focusProOrCon', true, R.assoc('error', `${plz} pro or con`, state))
  }
  if(!reason[1]) {
    return R.assoc('error', `${plz} rating`, state)
  }
  let pc = proOrCon(reason[1])
  let newState = R.assocPath(['reasons', pc], R.append(reason, state.reasons[pc]), state) 
  let max = larger(totalIn(1, newState.reasons.pros), totalIn(1, newState.reasons.cons)) 
  form.reset()
  return R.assoc('focusProOfCon', true, (R.assoc('error', '', R.assoc('max', max, newState))))
}

function submitTitle(ev, state) {
  ev.preventDefault()
  return R.assoc('focusProOrCon', true, state)
}


function removeReason(ev, state) {
  let data = attrData(ev.target.parentElement)
  return R.assocPath(['reasons', data.pc], R.remove(Number(data.i), 1, state.reasons[data.pc]), state)
}


function attrData(el) {
  return {pc: proOrCon(el.getAttribute('rating')), i : el.getAttribute('index')}
}


function editReason(ev, state) {
  let data = attrData(ev.target.parentElement)
  return R.assoc('editingReason', [data.pc, data.i], state)  
}


const proOrCon = (rating) => rating > 0 ? 'pros' : 'cons'

const totalIn = (i, arr) => R.reduce(posAdd, 0, R.pluck(i, arr))

const posAdd = (a, b) => R.add(Math.abs(a), Math.abs(b))

const larger = (a, b) => a >= b ? a : b 

render(init(), view, container)


window.R = R
