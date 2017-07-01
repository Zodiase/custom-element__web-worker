## v.NEXT

## v0.1.1

- Add missing dist files to npm package.
- Lock down dependencies.

## v0.1.0

- Add support for loading (dedicated) worker with the `web-worker` tag.

    ```HTML
    <web-worker id="worker" src="worker.js"></web-worker>
    ```

    - Changing the `src` attribute will terminate the active worker and load the new one. It does not, however, clear any event handlers such as `onmessage` and `onerror`.
    - The `id` attribute is not required but adding it could make it easier to reference the worker. In the above example, you could then use:

        ```JavaScript
        worker.postMessage("Hello World!");
        // ... is the same as:
        window.worker.postMessage("Hello World!");
        ```

    - To attach event handlers:

        ```JavaScript
        worker.onmessage = (e) => {
          console.log("Message received from worker", e.data);
        };
        // ... is the same as:
        worker.addEventListener("message", (e) => {
          console.log("Message received from worker", e.data);
        });
        ```
