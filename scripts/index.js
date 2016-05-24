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
  return h('div#container', [
    header(ctx)
  , h('div.reasons', [
      h('aside', scale(ctx.state.max))
    , h('figure', [
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
            ? (getWidth(ctx.state.title, 'header') + 8 + 'px')
            : (getWidth(placeholder, 'header') + 8 + 'px')}
          , on: {input: ctx.streams.saveTitle}
          })
      ])
    ])

const reasonsList = (ctx, pc) => 
  mapIndexed((reason, i) => h('li', {
      attrs: {index: i, rating: reason.rating}
    , class: {selected: selected(ctx.state.editingKey, pc, i)}
    , style: {delayed:  {height: `${(Math.abs(reason.rating) / ctx.state.max) * 100}%`, opacity: '1'},
              remove: {opacity: '0'}}}
    , [
        h('span.close', {on: {click: ctx.streams.removeReason}}, '×')
      , h('figcaption', {on: {click: ctx.streams.editKey}}, reason.name)
      ])
  , ctx.state.reasons[pc])

const selected = (editingKey, pc, i) =>
  editingKey && pc === editingKey.pc && i === editingKey.i

const footer = (ctx) =>
  h('footer', [
    h('form', {on: {submit: ctx.streams.saveReason}}
    , [ h('p.notice', ctx.state.notice)
      , h('input', {props: {
                      autocomplete: 'off'
                    , name: 'reason[name]'
                    , type: 'text'
                    , placeholder: 'Add pro or con'
                    , value: ctx.state.editingKey 
                      ? ctx.state.reasons[ctx.state.editingKey.pc][ctx.state.editingKey.i]['name']
                      : ''
                    }
                    , hook: {
                      update: (vnode) => { ctx.state.focusProOrCon ? vnode.elm.focus() : false }
                    }
                    })
      , rating(-5, 5, 'reason[rating]', ctx.state)
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
    , editKey: flyd.stream()
    }
  , updates: {
      saveReason: saveReason 
    , saveTitle: saveTitle
    , removeReason: removeReason
    , submitTitle: submitTitle
    , editKey: editKey
    } 
  , state: {
      reasons: {pros:[], cons:[]}
    , title: ''
    , max: 5
    , notice: ''
    , focusProOrCon: false
    , editingKey: false
    }
  }
}

const saveTitle = (ev, state) => R.assoc('focusProOrCon', false, R.assoc('title' , ev.target.value , state))

function saveReason(ev, state) {
  ev.preventDefault()
  let form = ev.target
  let reason = serialize(form, {hash: true}).reason
  let plz = 'Please enter a '
  if(!reason) {
    return R.assoc('notice', `${plz} pro or con and a rating`, state)
  }
  if(!reason.name) {
    return R.assoc('focusProOrCon', true, R.assoc('notice', `${plz} pro or con`, state))
  }
  if(!reason.rating) {
    return R.assoc('notice', `${plz} rating`, state)
  }
  let pc = proOrCon(reason.rating)
  if(state.editingKey) {
    state = R.assocPath(['reasons', state.editingKey.pc]
                      , R.remove(state.editingKey.i, 1, state.reasons[state.editingKey.pc])
                      , state)    
  }
  state = R.assocPath(['reasons', pc], R.append(reason, state.reasons[pc]), state)    
  let max = larger(totalIn('rating', state.reasons.pros), totalIn('rating', state.reasons.cons)) 
  form.reset()
  return R.assoc('editingKey', false
         , R.assoc('focusProOrCon', true
         , R.assoc('notice', ''
         , R.assoc('max', max, state))))
}

function submitTitle(ev, state) {
  ev.preventDefault()
  return R.assoc('focusProOrCon', true, state)
}

function removeReason(ev, state) {
  let data = attrData(ev.target.parentElement)
  return R.assoc('editingKey', false, R.assocPath(['reasons', data.pc], R.remove(data.i, 1, state.reasons[data.pc]), state))
}

function attrData(el) {
  return {pc: proOrCon(el.getAttribute('rating')), i : Number(el.getAttribute('index'))}
}

const editKey = (ev, state) => {
  let data = attrData(ev.target.parentElement)
  let key = state.editingKey
  if(key && key.pc === data.pc && key.i === data.i) {
    return R.assoc('notice', '', R.assoc('editingKey', false, state))
  }  
  return R.assoc('notice', 'Editing...', R.assoc('editingKey', data, state))
}

const proOrCon = (rating) => rating > 0 ? 'pros' : 'cons'

const totalIn = (key, arr) => R.reduce(posAdd, 0, R.pluck(key, arr))

const posAdd = (a, b) => R.add(Math.abs(a), Math.abs(b))

const larger = (a, b) => a >= b ? a : b 

render(init(), view, container)

window.R = R
