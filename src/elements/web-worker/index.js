import concat from 'lodash.concat';
import {
  typeCheck
} from 'type-check';

import BaseClass from '../abstract-worker';

const elementName = 'web-worker';

/**
 * Usage:
 * <web-worker
 *   // ID of the worker. Optional.
 *   id="{string}"
 *   // Url of the worker script.
 *   src="{string}"
 * ></web-worker>
 */
export default class HTMLWebWorker extends BaseClass {

  // @override
  static observedAttributes = concat(BaseClass.observedAttributes, [
    'src',
  ]);

  constructor () {
    super();

    // This property holds the active onmessage callback.
    this.onmessage_ = null;

    // This property holds the active src value.
    this.src_ = null;

    // This property will hold the worker instance.
    this.worker_ = null;

    this.addEventListener('message', (e) => {
      if (this.onmessage_) {
        this.onmessage_(e);
      }
    });
  }

  /**
   * Getters and Setters (for properties).
   */

  // @property {string|null} src
  get src () {
    return this.src_;
  }
  set src (val) {
    if (!typeCheck('String | Null', val)) {
      throw new TypeError('Worker source has to be a string.');
    }

    const _val = typeCheck('String', val) ? val.trim() : val;

    // Update internal models.
    const oldVal = this.src_;
    if (!this.isIdenticalPropertyValue_('src', oldVal, _val)) {
      this.loadNewWorker_(_val);
    }

    // Update attributes.
    this.updateAttributeByProperty_(this.constructor.getAttributeNameByPropertyName_('src'), _val);
  }

  // @property {function|null} onmessage
  get onmessage () {
    return this.onmessage_;
  }
  set onmessage (val) {
    if (!typeCheck('Function | Null', val)) {
      throw new TypeError('Worker message handler has to be a function.');
    }

    this.onmessage_ = val;
  }

  /**
   * Customized public/private methods.
   */

  /**
   * Terminates the active worker and clears all related data.
   */
  unloadWorker_ () {
    if (this.worker_) {
      this.log_('terminating active worker');
      this.worker_.terminate();
      this.log_('active worker terminated');
    }

    this.worker_ = this.src_ = null;
  }

  loadNewWorker_ (source) {
    this.log_('loading new worker', source);

    this.unloadWorker_();

    this.src_ = source;
    this.worker_ = new BaseClass.Worker(this.src_);

    // Bubble all error events and message events to element.
    this.worker_.onerror = this.worker_.onmessage = (e) => {
      this.dispatchEvent(new e.constructor(e.type, e));
    };

    this.log_('new worker ready', this.worker_);
  }

  /**
   * Proxy to Worker.postMessage().
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage}
   */
  postMessage (aMessage, transferList) {
    if (!this.worker_) {
      throw new Error('Worker not initialized yet.');
    }

    return this.worker_.postMessage(aMessage, transferList);
  }

  /**
   * Proxy to Worker.terminate().
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate}
   */
  terminate () {
    if (this.worker_) {
      this.worker_.terminate();
    }
  }

} // HTMLWebWorker

customElements.define(elementName, HTMLWebWorker);
