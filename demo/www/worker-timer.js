postMessage(Date.now());

setInterval(function() {
  postMessage(Date.now());
}, 100);
