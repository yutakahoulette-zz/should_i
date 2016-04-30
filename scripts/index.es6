import h from 'snabbdom/h'
import render from 'flimflam-render'
import R from 'ramda'
import flyd from 'flyd'
import serialize from 'form-serialize'

const container = document.getElementById('container')
const mapIndexed = R.addIndex(R.map)

function view(ctx) {
  return h('div.container', [
    h('h1.title', ['Should I ', h('span', {props: {contentEditable: 'true'}}, 'asdf')])
  ,
    h('ul.reasonsList.reasonsList--pros', 
      reasonsList(ctx.state.reasons.pros)
    )
  , h('ul.reasonsList.reasonsList--cons', 
      reasonsList(ctx.state.reasons.cons)
    )
  , h('form.reasonsForm', {on: {submit: ctx.streams.submit}}
  , [ h('input', {props: {name: 'reason[0]', type: 'text', placeholder: 'Add pro or con'}})
      // , h('input', {props: {name: 'reason[1]', type: 'range', step: '1', min: '-10', max: '10'}})
      , ratingInput({range: [-10, 10], name: 'reason[1]'})
      , h('button', {props: {type: 'submit'}}, 'Submit')
      ]
    )
  ])
}

function ratingInput(obj) {
  let range = R.without([0], R.range.apply(this, [].concat(obj.range[0], obj.range[1] + 1)))
  return h('span.ff-rating', mapIndexed((r, i) =>  h(`span.${r > 1 ? 'ff-rating--pos' : 'ff-rating--neg'}`, [
          h('input', {props: {type: 'radio', value: r, name: obj.name, id: `${obj.name}-${i}`}
            , style: {display: 'none'}})
        , h('label' , {attrs: {for: `${obj.name}-${i}`}})
      ]), range)
  )
}

function reasonsList(reasons) {
  return mapIndexed((reason, i) => h('li', {
    attrs: {index: i, text: reason[0], rating: reason[1]}
  , style: { height: `${Math.abs(reason[1]) * 1}em`}
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
  let form = ev.target
  let reason = serialize(form, {hash: true}).reason
  let proOrCon = reason[1] > 0 ? 'pros' : 'cons'
  form.reset()
  return R.assocPath(['reasons', proOrCon], R.prepend(reason, state.reasons[proOrCon]), state) 
}

render(init(), view, container)

