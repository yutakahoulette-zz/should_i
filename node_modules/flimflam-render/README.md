
# flimflam-render

Given a root flimflam component (an object with `.streams`, `.updates`, `.data`, and `.children`), a snabbdom view function, and a DOM Node container, render the component to the page. Continuously patch/update the page using the streams and updates from the component.

Use the very top-level, parent component for your page. You only need to call this function once per page.

In your flimflam components, you can leave out any of `.streams`, `.updates`, `.data`, and `.children`. They are all optional.

```js
import render from 'flimflam-render'

// import your app's parent component and view function...

render(component, viewFunc, domContainer, options)

// state: a flimflam state object (your app's root component for the page)
// viewFunc: snabbdom view function that takes a state object and returns a snabbdom VTree
// domContainer: an HTML Node from the actual web-page to render into (this node will be replaced with your view function's root node)
// options: an optional object of..
//     patch: your custom snabbdom patch function
//     debug: (Boolean) whether to log every new set of state data for debugging
```

