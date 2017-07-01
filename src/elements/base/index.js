/**
 * Attribute change flow:
 * - attribute on change
 * - parse attribute to property
 * - if fails
 *   - error and revert attribute to the old value
 * - else
 *   - update property (with property setter, throw if error)
 *     - fill default values
 *     - verify new property
 *     - update internal models
 *     - silent update attribute with new property
 *   - if fails
 *     - error and revert attribute to the old value
 *   - else
 *     - dispatch change event
 *     - if canceled
 *       - revert attribute to the old value
 *     - else
 *       - done!
 */

/*eslint no-bitwise: "off", no-console: "off"*/
/*global HTMLElement, CustomEvent*/

export default class HTMLMapBaseClass extends HTMLElement {

  /**
   * Lifecycle:
   * - constructor
   * - attributeChangedCallback
   * - connectedCallback
   * - (instantiate children)
   * - [attributeChangedCallback]
   * - [disconnectedCallback]
   * - [connectedCallback]
   * - [...]
   */

  /**
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements#Observed_attributes}
   * Child classes should extend this.
   * @property {Array.<string>} observedAttributes
   * @readonly
   * @static
   */
  static observedAttributes = [];

  /**
   * Mapping used to convert attribute names to property names.
   * Keys are attribute names.
   * Values are property names.
   * Child classes should extend this.
   * @property {Object.<string>} attributeNameToPropertyNameMapping
   * @readonly
   * @static
   */
  static attributeNameToPropertyNameMapping = {};

  /**
   * Mapping used to convert property names to attribute names.
   * Keys are property names.
   * Values are attribute names.
   * Child classes should extend this.
   * @property {Object.<string>} propertyNameToAttributeNameMapping
   * @readonly
   * @static
   */
  static propertyNameToAttributeNameMapping = {};

  /**
   * A map of functions for converting attribute values to property values.
   * Keys are attribute names.
   * Values are functions that convert attribute configs to property values.
   * Child classes should extend this.
   * @property {Object.<isSet: boolean, val: string -> *>} attributeToPropertyConverters
   * @readonly
   * @static
   */
  static attributeToPropertyConverters = {};

  /**
   * A map of functions for converting property values to attribute values.
   * Keys are attribute names.
   * Values are functions that convert property values to attribute configs.
   * Child classes should extend this.
   * @property {Object.<* -> {isSet: boolean, value: string}>}
   * @readonly
   * @static
   */
  static propertyToAttributeConverters = {};

  /**
   * A map of functions for comparing two property values.
   * Keys are property names.
   * Values are functions that compare two property values and return whether they are considered identical.
   * Child classes should extend this.
   * @property {Object.<a: *, b: * -> boolean>}
   * @readonly
   * @static
   */
  static propertyComparators = {};

  /**
   * string -> string
   * @private
   */
  static getPropertyNameByAttributeName_ (attrName) {
    return this.attributeNameToPropertyNameMapping[attrName] || attrName;
  }

  /**
   * string -> string
   * @private
   */
  static getAttributeNameByPropertyName_ (propName) {
    return this.propertyNameToAttributeNameMapping[propName] || propName;
  }

  /**
   * NodeList -> Array.<Node>
   */
  static getArrayFromNodeList (nodeList) {
    return Array.from(nodeList);
  }

  /**
   * An instance of the element is created or upgraded. Useful for initializing state, settings up event listeners, or creating shadow dom. See the spec for restrictions on what you can do in the constructor.
   */
  constructor () {
    super(); // always call super() first in the ctor.

    // `this` is the container HTMLElement.
    // It has no attributes or children at construction time.

    // Indicate whether this custom element is in DOM or not.
    this.connected_ = false;

    // This namespace stores flags indicating what attributes are being changed.
    this.changingAttributes_ = {};

    // This namespace stores flags indicating if the old values of some attributes were working.
    this.hasWorkingAttributes_ = {};

    // Used by `this.setTimeout`.
    this.timeoutIDs_ = new Set();

    // Setup logging functions.
    this.log_ = this.logInfo_ = () => { /*NOOP*/ };
    if (VERBOSE) {
      this.log_ = console.log.bind(console, `${this.constructor.name}_${this.id}`);
      this.logInfo_ = console.info.bind(console, `${this.constructor.name}_${this.id}`);
    }
    this.logWarn_ = console.warn.bind(console, `${this.constructor.name}_${this.id}`);
    this.logError_ = console.error.bind(console, `${this.constructor.name}_${this.id}`);
  } // constructor

  /**
   * Called every time the element is inserted into the DOM. Useful for running setup code, such as fetching resources or rendering. Generally, you should try to delay work until this time.
   */
  connectedCallback () {
    this.log_('connected');
    this.connected_ = true;
  }

  /**
   * Called every time the element is removed from the DOM. Useful for running clean up code (removing event listeners, etc.).
   */
  disconnectedCallback () {
    this.log_('disconnected');

    // Clear all timers.
    this.forEachTimeoutID_((id) => {
      this.clearTimeout(id);
    });

    this.connected_ = false;
  }

  /**
   * An attribute was added, removed, updated, or replaced. Also called for initial values when an element is created by the parser, or upgraded. Note: only attributes listed in the observedAttributes property will receive this callback.
   */
  attributeChangedCallback (attrName, oldVal, newVal) {
    // Only care about the attributes in the observed list.
    if (this.constructor.observedAttributes.indexOf(attrName) === -1) {
      return;
    }

    // If this attribute is already being updated, do not trigger a reaction again.
    if (this.isUpdating_(attrName)) {
      return;
    }

    this.log_('attributeChangedCallback', {
      attrName,
      oldVal,
      newVal
    });

    let cancelled = false;

    try {
      // Mark the attribute as being updated so changing its value during the process doesn't cause another reaction (and dead loop).
      this.setUpdateFlag_(attrName);

      const propName = this.constructor.getPropertyNameByAttributeName_(attrName),
            eventName = `changed:${propName}`,
            oldPropVal = this.getPropertyValueFromAttribute_(attrName, oldVal !== null, oldVal), //this[propName],
            newPropVal = this.getPropertyValueFromAttribute_(attrName, newVal !== null, newVal);

      if (this.isIdenticalPropertyValue_(propName, oldPropVal, newPropVal)) {
        this.log_(eventName, 'no change', {
          oldPropVal,
          newPropVal
        });
      } else {
        // Setter should verify new property value and throw if needed.
        this[propName] = newPropVal;

        this.log_(eventName, {
          oldVal: oldPropVal,
          newVal: newPropVal
        });

        // Dispatch change event.
        const event = new CustomEvent(eventName, {
          bubbles: true,
          cancelable: true,
          scoped: false,
          composed: false,
          detail: {
            property: propName,
            newValue: newPropVal
          }
        });

        cancelled = !this.dispatchEvent(event);
      }
    } catch (error) {
      this.logError_(`Failed to handle attribute change. ${error.message}`, {
        attrName,
        oldVal,
        newVal
      });

      //! Handle the error better?
      cancelled = true;
    } finally {
      this.clearUpdateFlag_(attrName);

      if (cancelled) {
        // Either cancelled or errored.
        if (this.hasWorkingAttributes_[attrName]) {
          // Revert the attribute to the old value.
          if (oldVal === null) {
            this.removeAttribute(attrName);
          } else {
            this.setAttribute(attrName, oldVal);
          }
        } else {
          this.logWarn_('No acceptable value to revert to.', {
            attrName,
            oldVal,
            newVal
          });
        }
      } else {
        // No error and not cancelled.
        this.hasWorkingAttributes_[attrName] = true;
      }
    }
  } // attributeChangedCallback

  /**
   * The custom element has been moved into a new document (e.g. someone called document.adoptNode(el)).
   */
  adoptedCallback () {
    //! Not sure what to do.
  }

  /**
   * Getters and Setters (for properties).
   */

  /**
   * Customized public/private methods.
   */

  /**
   * string, *, * -> boolean
   * @private
   */
  isIdenticalPropertyValue_ (propName, val1, val2) {
    const comparator = this.constructor.propertyComparators[propName];
    return comparator ? comparator(val1, val2) : false;
  }

  /**
   * Convert attribute to property.
   * @param {string} attrName
   * @param {boolean} [hasAttr] - Optional. If provided, will use this value for conversion.
   * @param {string} [attrVal] - Optional. If provided, will use this value for conversion.
   * @returns {*}
   */
  getPropertyValueFromAttribute_ (attrName, hasAttr, attrVal) {
    const _hasAttr = !(typeof hasAttr === 'undefined') ? hasAttr : this.hasAttribute(attrName);
    const _attrVal = !(typeof attrVal === 'undefined') ? attrVal : this.getAttribute(attrName);

    const converter = this.constructor.attributeToPropertyConverters[attrName];

    if (converter) {
      return converter(_hasAttr, _attrVal);
    } else {
      return _hasAttr ? _attrVal : null;
    }
  }

  /**
   * Convert property to attribute.
   * @param {string} attrName
   * @param {*} propVal
   * @returns {string}
   */
  updateAttributeByProperty_ (attrName, propVal) {
    const converter = this.constructor.propertyToAttributeConverters[attrName];

    if (converter) {
      const {
        isSet,
        value
      } = converter(propVal);

      if (isSet) {
        this.setAttribute(attrName, value);
      } else {
        this.removeAttribute(attrName);
      }
    } else {
      this.setAttribute(attrName, String(propVal));
    }

    return this.getAttribute(attrName);
  }

  // Helpers for getting/setting/clearing update flags.
  // @private
  setUpdateFlag_ (attrName) {
    this.changingAttributes_[attrName] = true;
  }
  // @private
  clearUpdateFlag_ (attrName) {
    this.changingAttributes_[attrName] = false;
  }
  // @private
  isUpdating_ (attrName) {
    return this.changingAttributes_[attrName] === true;
  }

  /**
   * Helper function for manipulating internal storage for `setTimeout`.
   */
  addTimeoutID_ (id) {
    return this.timeoutIDs_.add(id);
  }
  /**
   * Helper function for manipulating internal storage for `setTimeout`.
   */
  removeTimeoutID_ (id) {
    return this.timeoutIDs_.delete(id);
  }
  /**
   * Helper function for iterating internal storage for `setTimeout`.
   * @param {function} func
   * @param {Object|null} context
   */
  forEachTimeoutID_ (func, context) {
    this.timeoutIDs_.forEach(func, context);
  }

  /**
   * `global.setTimeout` wrapped for safety.
   * The timeouts registered with this will all be cancelled if the element is disconnected.
   * @param {function} func
   * @param {number} [delay=0]
   * @param {Array.<*>} [params]
   * @returns {number}
   */
  setTimeout (func, delay = 0, ...params) {
    const timerID = setTimeout((..._params) => {

      this.removeTimeoutID_(timerID);

      func(..._params);

    }, delay, ...params);

    this.addTimeoutID_(timerID);

    return timerID;
  }

  /**
   * `global.clearTimeout` wrapped for safety.
   * Does the reverse of `this.setTimeout`.
   * @param {number} timerID
   */
  clearTimeout (timerID) {
    clearTimeout(timerID);

    this.removeTimeoutID_(timerID);
  }

} // HTMLMapBaseClass
