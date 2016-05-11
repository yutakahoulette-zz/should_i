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

function view(ctx) {
  console.log(ctx.state.title)
  return h('div.container', [
    header(ctx)
  , h('ul.reasonsList.reasonsList--cons', reasonsList(ctx.state.reasons.cons))
  , h('ul.reasonsList.reasonsList--pros', reasonsList(ctx.state.reasons.pros))
  , h('form.reasonsForm', {on: {submit: ctx.streams.submit}}
    , [ h('input', {props: {autocomplete: 'off', name: 'reason[0]', type: 'text', placeholder: 'Add pro or con'}})
      , rating(-7, 7, 'reason[1]')
      , h('button', {props: {type: 'submit'}}, 'Submit')
      ]
    )
  ])
}


function header(ctx) {
   return h('header', [ 
       h('h1.title', ['Should I '
      , h('div', [
         h('input'
          , {props: { placeholder: placeholder, autocomplete: 'off' }
            , style: { width: ctx.state.title 
              ? (getWidth(ctx.state.title, 'h1') + 30 + 'px')
              : (getWidth(placeholder, 'h1') + 30 + 'px')}
            , on: { keyup: ctx.streams.saveTitle }
            }
          )
        ])
      ])
    ])
}


function reasonsList(reasons) {
  return mapIndexed((reason, i) => h('li', {
      attrs: {index: i, text: reason[0], rating: reason[1]}
    , style: { height: `${Math.abs(reason[1]) * 1}em`}
  }), reasons)
}

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
    }
  }
}

function saveTitle(ev, state) {
  return R.assoc('title' , ev.target.value , state)
}

function submit(ev, state) {
  ev.preventDefault()
  let form = ev.target
  let reason = serialize(form, {hash: true}).reason
  let proOrCon = reason[1] > 0 ? 'pros' : 'cons'
  form.reset()
  return R.assocPath(['reasons', proOrCon], R.prepend(reason, state.reasons[proOrCon]), state) 
}

function hidePlaceholder(ev, state) {
  return R.assoc('isHidingPlaceholder', true, state)
}

render(init(), view, container)

