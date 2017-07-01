# Web Worker Components

Custom elements for running Web Workers.

See `Developer.md` for implementation decisions and details.

See `Roadmap.md` for upcoming features.

## Demo

The `demo` directory contains demo pages for various example usages. Run `npm run demo` to launch the demo site at `localhost:5000`.

But before the demo site is usable, the project distribution files have to be built first.

## Install & Use

Download the release bundle or build it from the source, then include the needed files in your project.

### Simple example

`parent.html`

```HTML
<script src="web-worker-components.js"></script>
<web-worker id="worker" src="worker.js"></web-worker>
<script>
worker.onmessage = (e) => {
  console.log("Message received from worker", e.data);
};
worker.postMessage("Hello World!");
</script>
```

`worker.js`

```JavaScript
onmessage = function(e) {
  console.log('Message received from main script', e.data);
  postMessage(e.data);
}
```

## Building

Run `npm install && npm run build` to build the distribution files to `dist` directory.

## Dependencies

This library requires browser support for [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements).

It also requires `native-shim` [available here](https://github.com/webcomponents/custom-elements/blob/master/src/native-shim.js) to allow use of Custom Elements in transpiled ES5 code.

The polyfills are already bundled in `web-worker-components.js`. Use `web-worker-components-lite.js` if the polyfills are provided separately.

## Versions

This project follows [Semantic Versioning](http://semver.org/). See `History.md` for release changes.
