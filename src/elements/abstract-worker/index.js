import {
  typeCheck
} from 'type-check';

import NS from 'namespace';

import BaseClass from '../base';

/**
 * Usage:
 * You don't use this directly.
 */
export default class HTMLAbstractWorker extends BaseClass {

  // Save reference to Worker class.
  static get Worker () {
    return NS.Worker;
  }

  constructor () {
    super();

    if (!NS.Worker) {
      throw new Error('User-Agent does not support Web Worker.');
    }

    // This property holds the active onerror callback.
    this.onerror_ = null;

    this.addEventListener('error', (e) => {
      if (this.onerror_) {
        this.onerror_(e);
      }
    });
  }

  /**
   * Getters and Setters (for properties).
   */

  // @property {function|null} onerror
  get onerror () {
    return this.onerror_;
  }
  set onerror (val) {
    if (!typeCheck('Function | Null', val)) {
      throw new TypeError('Worker error handler has to be a function.');
    }

    this.onerror_ = val;
  }

  /**
   * Customized public/private methods.
   */

} // HTMLAbstractWorker
