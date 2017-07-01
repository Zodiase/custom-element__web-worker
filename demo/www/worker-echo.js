onmessage = function(e) {
  console.log('Message received from main script', e.data);
  postMessage(e.data);
}
