function getWidth(str, el) {
  let tmp = document.createElement(el)
  tmp.innerHTML = str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  document.body.appendChild(tmp)
  let width = tmp.getBoundingClientRect().width
  document.body.removeChild(tmp)
  return width
}

module.exports = getWidth 
