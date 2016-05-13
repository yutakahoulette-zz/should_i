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
      h('ul.cons', reasonsList(ctx.state.reasons.cons))
    , h('ul.pros', reasonsList(ctx.state.reasons.pros))
    , h('aside', scale(ctx.state.max))
    ])
  , h('form', {on: {submit: ctx.streams.submit}}
    , [ h('input', {props: {
                      autocomplete: 'off'
                    , name: 'reason[0]'
                    , type: 'text'
                    , placeholder: 'Add pro or con'}})
      , rating(-5, 5, 'reason[1]')
      , h('button', {props: {type: 'submit'}}, 'Submit')
      ]
    )
  ])

const scale = (max) => max

const header = (ctx) =>
  h('header', [ 
     h('h1.title', ['Should I '
    , h('div', [
       h('input'
        , {props: { placeholder: placeholder, autocomplete: 'off' }
          , style: { width: ctx.state.title 
            ? (getWidth(ctx.state.title, 'h1') + 30 + 'px')
            : (getWidth(placeholder, 'h1') + 30 + 'px')}
          , on: { keyup: ctx.streams.saveTitle }
          })
      ])
    ])
  ])


const reasonsList = (reasons) => 
  mapIndexed((reason, i) => h('li', {
    attrs: {index: i, text: reason[0], rating: reason[1]}
  , style: { height: `${Math.abs(reason[1]) * 1}em`}
  }), reasons)

function init(){
  return {
    streams: {
      submit: flyd.stream()
    , saveTitle: flyd.stream()
    }
  , updates: {
      submit: submit
    , saveTitle: saveTitle
    } 
  , state: {
      reasons: {pros:[], cons:[]}
    , title: ''
    , max: 0
    }
  }
}

const saveTitle = (ev, state) => R.assoc('title' , ev.target.value , state)

function submit(ev, state) {
  ev.preventDefault()
  let form = ev.target
  let reason = serialize(form, {hash: true}).reason
  let proOrCon = reason[1] > 0 ? 'pros' : 'cons'
  form.reset()
  let newState = R.assocPath(['reasons', proOrCon], R.prepend(reason, state.reasons[proOrCon]), state) 
  let max = larger(totalIn(1, newState.reasons.pros), totalIn(1, newState.reasons.cons)) 
  return R.assoc('max', max, newState) 
}

const totalIn = (i, arr) => R.reduce(posAdd, 0, R.pluck(i, arr))

const posAdd = (a, b) => R.add(Math.abs(a), Math.abs(b))

const larger = (a, b) => a >= b ? a : b 

render(init(), view, container)

