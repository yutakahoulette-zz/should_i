import h from 'snabbdom/h'
import R from 'ramda'
const mapIndexed = R.addIndex(R.map)

function rating(min, max, name, state) {
  let range = R.without([0], R.range(min, max + 1))
  return h('span.rating'
         , R.flatten(mapIndexed((r, i) =>  [
            h(`input${r < 0 ? '.neg' : '.pos'}`, {
              props: {type: 'radio', value: r, name: name, id: `${name}-${i}`}
            , style: {display: 'none'}})
          , h('label', {attrs: {for: `${name}-${i}`, rating: r}})
          ], range))
        )
}

module.exports = rating

