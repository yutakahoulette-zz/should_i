import h from 'snabbdom/h'
import render from 'flimflam-render'
import R from 'ramda'
import flyd from 'flyd'
import serialize from 'form-serialize'

let container = document.getElementById('container')

function view(ctx) {
  return h('div', [
    h('ul.reasonsList.reasonsList--pros', 
      R.map(reasonsList, R.filter((x) => x[1] > 0, ctx.state.reasons))
    )
  , h('ul.reasonsList.reasonsList--cons', 
      R.map(reasonsList, R.filter((x) => x[1] < 0, ctx.state.reasons))
    )
  , h('form', {on: {submit: ctx.streams.submit}}
  , [ h('input', {props: {name: 'reason[0]', type: 'text', placeholder: 'Add pro or con'}})
      , h('input', {props: {name: 'reason[1]', type: 'number', placeholder: 'Add value'}})
      , h('button', {props: {type: 'submit'}}, 'Submit')
      ]
    )
  ])
}


function reasonsList(reason) {
  return h('li', `${reason[0]} gets ${reason[1]} points`)
}

function init(){
  return {
    streams: { submit: flyd.stream() }
  , updates: { submit: submit } 
  , state:   {reasons: [] }
  }
}

function submit(ev, state) {
  ev.preventDefault()
  let reason = serialize(ev.target, {hash: true}).reason
  return R.assoc('reasons', R.prepend(reason, state.reasons), state) 
}

render(init(), view, container)

