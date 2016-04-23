import h from 'snabbdom/h'
import render from 'flimflam-render'
import R from 'ramda'
import flyd from 'flyd'
import serialize from 'form-serialize'

const container = document.getElementById('container')
const mapIndexed = R.addIndex(R.map)

function view(ctx) {
  return h('div', [
    h('ul.reasonsList.reasonsList--pros', 
      reasonsList(ctx.state.reasons.pros)
    )
  , h('ul.reasonsList.reasonsList--cons', 
      reasonsList(ctx.state.reasons.cons)
    )
  , h('form', {on: {submit: ctx.streams.submit}}
  , [ h('input', {props: {name: 'reason[0]', type: 'text', placeholder: 'Add pro or con'}})
      , h('input', {props: {name: 'reason[1]', type: 'number', placeholder: 'Add value'}})
      , h('button', {props: {type: 'submit'}}, 'Submit')
      ]
    )
  ])
}

function reasonsList(reasons) {
  return mapIndexed((reason, i) => h('li', {
    attrs: {index: i, text: reason[0], rating: reason[1]}
  , style: { height: `${Math.abs(reason[1]) * 5}px`}
  })
  , reasons)
}

function init(){
  return {
    streams: {submit: flyd.stream()}
  , updates: {submit: submit} 
  , state:   {reasons: {pros:[], cons:[]}}
  }
}

function submit(ev, state) {
  ev.preventDefault()
  let reason = serialize(ev.target, {hash: true}).reason
  let proOrCon = reason[1] > 0 ? 'pros' : 'cons'
  return R.assocPath(['reasons', proOrCon], R.prepend(reason, state.reasons[proOrCon]), state) 
}

render(init(), view, container)

