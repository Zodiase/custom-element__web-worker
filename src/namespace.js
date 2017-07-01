// Define the namespace for this library.
const webWorkerComponents = {
  setWorker (newWorker) {
    this.Worker = newWorker;
  },
  // Reference the Worker in global if possible.
  Worker: window.Worker || null,
};

// Attach it to global.
window.webWorkerComponents = webWorkerComponents;

export default webWorkerComponents;
