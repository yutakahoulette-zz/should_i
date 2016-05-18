import h from 'snabbdom/h'
import render from 'flimflam-render'
import R from 'ramda'
import flyd from 'flyd'
import serialize from 'form-serialize'
import getWidth from './element-width'
import rating from './rating'
import placeholders from './placeholders'

const container = document.getElementById('container')
const mapIndexed = R.addIndex(R.map)

const randEl = (arr) => arr[Math.floor(Math.random() * arr.length)] 
  
let placeholder = randEl(placeholders)

const view = (ctx) =>
  h('main', [
    header(ctx)
  , h('div.reasons', [
      h('aside', scale(ctx.state.max))
    , h('section', [
        h('ul.cons', reasonsList(ctx, 'cons'))
      , h('ul.pros', reasonsList(ctx, 'pros'))
      ])
    ])
  , h('form', {on: {submit: ctx.streams.submit}}
    , [ h('p.error', ctx.state.error)
      , h('input', {props: {
                      autocomplete: 'off'
                    , name: 'reason[0]'
                    , type: 'text'
                    , placeholder: 'Add pro or con'}})
      , rating(-5, 5, 'reason[1]')
      , h('button', {props: {type: 'submit'}}, 'Save')
      ]
    )
  ])

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
     h('h1.title', ['Should I '
    , h('div', [
       h('input'
        , {props: { autofocus: true, placeholder: placeholder, autocomplete: 'off' }
          , style: { width: ctx.state.title 
            ? (getWidth(ctx.state.title, 'h1') + 30 + 'px')
            : (getWidth(placeholder, 'h1') + 30 + 'px')}
          , on: {keyup: ctx.streams.saveTitle}
          })
      ])
    ])
  ])


const reasonsList = (ctx, proOrCon) => 
  mapIndexed((reason, i) => h('li', {
      attrs: {index: i, text: reason[0], rating: reason[1]}
    , style: {delayed:  {height: `${(Math.abs(reason[1]) / ctx.state.max) * 100}%`},
              remove: {opacity: '0'}}}
    , [h('span.close', {on: {click: ctx.streams.remove}}, '×')])
  , ctx.state.reasons[proOrCon])

function init(){
  return {
    streams: {
      submit: flyd.stream()
    , saveTitle: flyd.stream()
    , remove: flyd.stream()
    }
  , updates: {
      submit: submit
    , saveTitle: saveTitle
    , remove: remove 
    } 
  , state: {
      reasons: {pros:[], cons:[]}
    , title: ''
    , max: 5
    , error: ''
    }
  }
}

const saveTitle = (ev, state) => R.assoc('title' , ev.target.value , state)

function submit(ev, state) {
  ev.preventDefault()
  let form = ev.target
  let reason = serialize(form, {hash: true}).reason
  let plz = 'Please enter a '
  if(!reason) {
    return R.assoc('error', `${plz} pro or con and a rating`, state)
  }
  if(!reason[0]) {
    return R.assoc('error', `${plz} pro or con`, state)
  }
  if(!reason[1]) {
    return R.assoc('error', `${plz} rating`, state)
  }
  let proOrCon = reason[1] > 0 ? 'pros' : 'cons'
  let newState = R.assocPath(['reasons', proOrCon], R.append(reason, state.reasons[proOrCon]), state) 
  let max = larger(totalIn(1, newState.reasons.pros), totalIn(1, newState.reasons.cons)) 
  form.reset()
  return R.assoc('error', '', R.assoc('max', max, newState))
}

function remove(ev, state) {
  let el = ev.target.parentElement
  let proOrCon = el.getAttribute('rating') > 0 ? 'pros' : 'cons' 
  let i = el.getAttribute('index')
  return R.assocPath(['reasons', proOrCon], R.remove(Number(i), 1, state.reasons[proOrCon]), state)
}


const totalIn = (i, arr) => R.reduce(posAdd, 0, R.pluck(i, arr))

const posAdd = (a, b) => R.add(Math.abs(a), Math.abs(b))

const larger = (a, b) => a >= b ? a : b 

render(init(), view, container)


window.R = R
