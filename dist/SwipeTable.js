!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.SwipeTable=e():"undefined"!=typeof global?global.SwipeTable=e():"undefined"!=typeof self&&(self.SwipeTable=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * v0.2.0
 * Copyright (c) 2013 Jarid Margolin
 * bouncefix.js is open sourced under the MIT license.
 */ 

;(function (name, context, definition) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = definition(); }
  else if (typeof define === 'function' && define.amd) { define(definition); }
  else { context[name] = definition(); }
})('bouncefix', this, function () {
// Define module
var bouncefix = {
  Fix: Fix,
  cache: {}
};  

//
// Add/Create new instance
//
bouncefix.add = function (className) {
  if (!this.cache[className]) {
    this.cache[className] = new this.Fix(className);
  }
};

//
// Delete/Remove instance
//
bouncefix.remove = function (className) {
  if (this.cache[className]) {
    this.cache[className].remove();
    delete this.cache[className];
  }
};
//
// Class Constructor - Called with new BounceFix(el)
// Responsible for setting up required instance
// variables, and listeners.
//
function Fix(className) {
  // If there is no element, then do nothing  
  if(!className) { return false; }
  this.className = className;

  // The engine
  this.startListener = new EventListener(document, {
    evt: 'touchstart',
    handler: this.touchStart,
    context: this
  }).add();

  // Cleanup
  this.endListener = new EventListener(document, {
    evt: 'touchend',
    handler: this.touchEnd,
    context: this
  }).add();
}

//
// touchstart handler
//
Fix.prototype.touchStart = function (evt) {
  this.target = utils.getTargetedEl(evt.target, this.className);
  if (this.target) {
    // If scrollable, adjust
    if (utils.isScrollable(this.target)) { return utils.scrollToEnd(this.target); }
    // Else block touchmove
    this.endListener = new EventListener(this.target, {
      evt: 'touchmove',
      handler: this.touchMove,
      context: this
    }).add();
  }
};

//
// If this event is called, we block scrolling
// by preventing default behavior.
//
Fix.prototype.touchMove = function (evt) {
  evt.preventDefault(); 
};

//
// On touchend we need to remove and listeners
// we may have added.
//
Fix.prototype.touchEnd = function (evt) {
  if (this.moveListener) {
    this.moveListener.remove();
  }
};

//
// touchend handler
//
Fix.prototype.remove = function () {
  this.startListener.remove();
  this.endListener.remove();
};
// Define module
var utils = {};

//
// Search nodes to find target el. Return if exists
//
utils.getTargetedEl = function (el, className) {
  while (true) {
    if (el.classList.contains(className)) { break; }
    if ((el = el.parentElement)) { continue; }
    break;
  }
  return el;
};

//
// Return true or false depending on if content
// is scrollable
//
utils.isScrollable = function (el) {
  return (el.scrollHeight > el.offsetHeight);
};

//
// Keep scrool from hitting end bounds
//
utils.scrollToEnd = function (el) {
  var curPos = el.scrollTop,
      height = el.offsetHeight,
      scroll = el.scrollHeight;
  
  // If at top, bump down 1px
  if(curPos <= 0) { el.scrollTop = 1; }

  // If at bottom, bump up 1px
  if(curPos + height >= scroll) {
    el.scrollTop = scroll - height - 1;
  }
};
//
// Class used to work with addEventListener. Allows
// context to be specified on handler, and provides
// a method for easy removal.
//
function EventListener(el, opts) {
  // Make args available to instance
  this.evt = opts.evt;
  this.el = el;
  // Default
  this.handler = opts.handler;
  // If context passed call with context
  if (opts.context) {
    this.handler = function (evt) {
      opts.handler.call(opts.context, evt);
    };
  }
}

//
// Add EventListener on instance el
//
EventListener.prototype.add = function () {
  this.el.addEventListener(this.evt, this.handler, false);
};

//
// Removes EventListener on instance el
//
EventListener.prototype.remove = function () {
  this.el.removeEventListener(this.evt, this.handler);
};

return bouncefix;

});
},{}],2:[function(require,module,exports){
/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 0.6.9
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/*jslint browser:true, node:true*/
/*global define, Event, Node*/


/**
 * Instantiate fast-clicking listeners on the specificed layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 */
function FastClick(layer) {
	'use strict';
	var oldOnClick, self = this;


	/**
	 * Whether a click is currently being tracked.
	 *
	 * @type boolean
	 */
	this.trackingClick = false;


	/**
	 * Timestamp for when when click tracking started.
	 *
	 * @type number
	 */
	this.trackingClickStart = 0;


	/**
	 * The element being tracked for a click.
	 *
	 * @type EventTarget
	 */
	this.targetElement = null;


	/**
	 * X-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartX = 0;


	/**
	 * Y-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartY = 0;


	/**
	 * ID of the last touch, retrieved from Touch.identifier.
	 *
	 * @type number
	 */
	this.lastTouchIdentifier = 0;


	/**
	 * Touchmove boundary, beyond which a click will be cancelled.
	 *
	 * @type number
	 */
	this.touchBoundary = 10;


	/**
	 * The FastClick layer.
	 *
	 * @type Element
	 */
	this.layer = layer;

	if (!layer || !layer.nodeType) {
		throw new TypeError('Layer must be a document node');
	}

	/** @type function() */
	this.onClick = function() { return FastClick.prototype.onClick.apply(self, arguments); };

	/** @type function() */
	this.onMouse = function() { return FastClick.prototype.onMouse.apply(self, arguments); };

	/** @type function() */
	this.onTouchStart = function() { return FastClick.prototype.onTouchStart.apply(self, arguments); };

	/** @type function() */
	this.onTouchMove = function() { return FastClick.prototype.onTouchMove.apply(self, arguments); };

	/** @type function() */
	this.onTouchEnd = function() { return FastClick.prototype.onTouchEnd.apply(self, arguments); };

	/** @type function() */
	this.onTouchCancel = function() { return FastClick.prototype.onTouchCancel.apply(self, arguments); };

	if (FastClick.notNeeded(layer)) {
		return;
	}

	// Set up event handlers as required
	if (this.deviceIsAndroid) {
		layer.addEventListener('mouseover', this.onMouse, true);
		layer.addEventListener('mousedown', this.onMouse, true);
		layer.addEventListener('mouseup', this.onMouse, true);
	}

	layer.addEventListener('click', this.onClick, true);
	layer.addEventListener('touchstart', this.onTouchStart, false);
	layer.addEventListener('touchmove', this.onTouchMove, false);
	layer.addEventListener('touchend', this.onTouchEnd, false);
	layer.addEventListener('touchcancel', this.onTouchCancel, false);

	// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
	// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
	// layer when they are cancelled.
	if (!Event.prototype.stopImmediatePropagation) {
		layer.removeEventListener = function(type, callback, capture) {
			var rmv = Node.prototype.removeEventListener;
			if (type === 'click') {
				rmv.call(layer, type, callback.hijacked || callback, capture);
			} else {
				rmv.call(layer, type, callback, capture);
			}
		};

		layer.addEventListener = function(type, callback, capture) {
			var adv = Node.prototype.addEventListener;
			if (type === 'click') {
				adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
					if (!event.propagationStopped) {
						callback(event);
					}
				}), capture);
			} else {
				adv.call(layer, type, callback, capture);
			}
		};
	}

	// If a handler is already declared in the element's onclick attribute, it will be fired before
	// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
	// adding it as listener.
	if (typeof layer.onclick === 'function') {

		// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
		// - the old one won't work if passed to addEventListener directly.
		oldOnClick = layer.onclick;
		layer.addEventListener('click', function(event) {
			oldOnClick(event);
		}, false);
		layer.onclick = null;
	}
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {

	// Don't send a synthetic click to disabled inputs (issue #62)
	case 'button':
	case 'select':
	case 'textarea':
		if (target.disabled) {
			return true;
		}

		break;
	case 'input':

		// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
		if ((this.deviceIsIOS && target.type === 'file') || target.disabled) {
			return true;
		}

		break;
	case 'label':
	case 'video':
		return true;
	}

	return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {
	case 'textarea':
	case 'select':
		return true;
	case 'input':
		switch (target.type) {
		case 'button':
		case 'checkbox':
		case 'file':
		case 'image':
		case 'radio':
		case 'submit':
			return false;
		}

		// No point in attempting to focus disabled inputs
		return !target.disabled && !target.readOnly;
	default:
		return (/\bneedsfocus\b/).test(target.className);
	}
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
	'use strict';
	var clickEvent, touch;

	// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
	if (document.activeElement && document.activeElement !== targetElement) {
		document.activeElement.blur();
	}

	touch = event.changedTouches[0];

	// Synthesise a click event, with an extra attribute so it can be tracked
	clickEvent = document.createEvent('MouseEvents');
	clickEvent.initMouseEvent('click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
	clickEvent.forwardedTouchEvent = true;
	targetElement.dispatchEvent(clickEvent);
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
	'use strict';
	var length;

	if (this.deviceIsIOS && targetElement.setSelectionRange) {
		length = targetElement.value.length;
		targetElement.setSelectionRange(length, length);
	} else {
		targetElement.focus();
	}
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
	'use strict';
	var scrollParent, parentElement;

	scrollParent = targetElement.fastClickScrollParent;

	// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
	// target element was moved to another parent.
	if (!scrollParent || !scrollParent.contains(targetElement)) {
		parentElement = targetElement;
		do {
			if (parentElement.scrollHeight > parentElement.offsetHeight) {
				scrollParent = parentElement;
				targetElement.fastClickScrollParent = parentElement;
				break;
			}

			parentElement = parentElement.parentElement;
		} while (parentElement);
	}

	// Always update the scroll top tracker if possible.
	if (scrollParent) {
		scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
	}
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
	'use strict';

	// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
	if (eventTarget.nodeType === Node.TEXT_NODE) {
		return eventTarget.parentNode;
	}

	return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
	'use strict';
	var targetElement, touch, selection;

	// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
	if (event.targetTouches.length > 1) {
		return true;
	}

	targetElement = this.getTargetElementFromEventTarget(event.target);
	touch = event.targetTouches[0];

	if (this.deviceIsIOS) {

		// Only trusted events will deselect text on iOS (issue #49)
		selection = window.getSelection();
		if (selection.rangeCount && !selection.isCollapsed) {
			return true;
		}

		if (!this.deviceIsIOS4) {

			// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
			// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
			// with the same identifier as the touch event that previously triggered the click that triggered the alert.
			// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
			// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
			if (touch.identifier === this.lastTouchIdentifier) {
				event.preventDefault();
				return false;
			}

			this.lastTouchIdentifier = touch.identifier;

			// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
			// 1) the user does a fling scroll on the scrollable layer
			// 2) the user stops the fling scroll with another tap
			// then the event.target of the last 'touchend' event will be the element that was under the user's finger
			// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
			// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
			this.updateScrollParent(targetElement);
		}
	}

	this.trackingClick = true;
	this.trackingClickStart = event.timeStamp;
	this.targetElement = targetElement;

	this.touchStartX = touch.pageX;
	this.touchStartY = touch.pageY;

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < 200) {
		event.preventDefault();
	}

	return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
	'use strict';
	var touch = event.changedTouches[0], boundary = this.touchBoundary;

	if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
		return true;
	}

	return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
	'use strict';
	if (!this.trackingClick) {
		return true;
	}

	// If the touch has moved, cancel the click tracking
	if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
		this.trackingClick = false;
		this.targetElement = null;
	}

	return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
	'use strict';

	// Fast path for newer browsers supporting the HTML5 control attribute
	if (labelElement.control !== undefined) {
		return labelElement.control;
	}

	// All browsers under test that support touch events also support the HTML5 htmlFor attribute
	if (labelElement.htmlFor) {
		return document.getElementById(labelElement.htmlFor);
	}

	// If no for attribute exists, attempt to retrieve the first labellable descendant element
	// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
	return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
	'use strict';
	var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

	if (!this.trackingClick) {
		return true;
	}

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < 200) {
		this.cancelNextClick = true;
		return true;
	}

	this.lastClickTime = event.timeStamp;

	trackingClickStart = this.trackingClickStart;
	this.trackingClick = false;
	this.trackingClickStart = 0;

	// On some iOS devices, the targetElement supplied with the event is invalid if the layer
	// is performing a transition or scroll, and has to be re-detected manually. Note that
	// for this to function correctly, it must be called *after* the event target is checked!
	// See issue #57; also filed as rdar://13048589 .
	if (this.deviceIsIOSWithBadTarget) {
		touch = event.changedTouches[0];

		// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
		targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
		targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
	}

	targetTagName = targetElement.tagName.toLowerCase();
	if (targetTagName === 'label') {
		forElement = this.findControl(targetElement);
		if (forElement) {
			this.focus(targetElement);
			if (this.deviceIsAndroid) {
				return false;
			}

			targetElement = forElement;
		}
	} else if (this.needsFocus(targetElement)) {

		// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
		// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
		if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
			this.targetElement = null;
			return false;
		}

		this.focus(targetElement);

		// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
		if (!this.deviceIsIOS4 || targetTagName !== 'select') {
			this.targetElement = null;
			event.preventDefault();
		}

		return false;
	}

	if (this.deviceIsIOS && !this.deviceIsIOS4) {

		// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
		// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
		scrollParent = targetElement.fastClickScrollParent;
		if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
			return true;
		}
	}

	// Prevent the actual click from going though - unless the target node is marked as requiring
	// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
	if (!this.needsClick(targetElement)) {
		event.preventDefault();
		this.sendClick(targetElement, event);
	}

	return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
	'use strict';
	this.trackingClick = false;
	this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
	'use strict';

	// If a target element was never set (because a touch event was never fired) allow the event
	if (!this.targetElement) {
		return true;
	}

	if (event.forwardedTouchEvent) {
		return true;
	}

	// Programmatically generated events targeting a specific element should be permitted
	if (!event.cancelable) {
		return true;
	}

	// Derive and check the target element to see whether the mouse event needs to be permitted;
	// unless explicitly enabled, prevent non-touch click events from triggering actions,
	// to prevent ghost/doubleclicks.
	if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

		// Prevent any user-added listeners declared on FastClick element from being fired.
		if (event.stopImmediatePropagation) {
			event.stopImmediatePropagation();
		} else {

			// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
			event.propagationStopped = true;
		}

		// Cancel the event
		event.stopPropagation();
		event.preventDefault();

		return false;
	}

	// If the mouse event is permitted, return true for the action to go through.
	return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
	'use strict';
	var permitted;

	// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
	if (this.trackingClick) {
		this.targetElement = null;
		this.trackingClick = false;
		return true;
	}

	// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
	if (event.target.type === 'submit' && event.detail === 0) {
		return true;
	}

	permitted = this.onMouse(event);

	// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
	if (!permitted) {
		this.targetElement = null;
	}

	// If clicks are permitted, return true for the action to go through.
	return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
	'use strict';
	var layer = this.layer;

	if (this.deviceIsAndroid) {
		layer.removeEventListener('mouseover', this.onMouse, true);
		layer.removeEventListener('mousedown', this.onMouse, true);
		layer.removeEventListener('mouseup', this.onMouse, true);
	}

	layer.removeEventListener('click', this.onClick, true);
	layer.removeEventListener('touchstart', this.onTouchStart, false);
	layer.removeEventListener('touchmove', this.onTouchMove, false);
	layer.removeEventListener('touchend', this.onTouchEnd, false);
	layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
	'use strict';
	var metaViewport;

	// Devices that don't support touch don't need FastClick
	if (typeof window.ontouchstart === 'undefined') {
		return true;
	}

	if ((/Chrome\/[0-9]+/).test(navigator.userAgent)) {

		// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
		if (FastClick.prototype.deviceIsAndroid) {
			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && metaViewport.content.indexOf('user-scalable=no') !== -1) {
				return true;
			}

		// Chrome desktop doesn't need FastClick (issue #15)
		} else {
			return true;
		}
	}

	// IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
	if (layer.style.msTouchAction === 'none') {
		return true;
	}

	return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.attach = function(layer) {
	'use strict';
	return new FastClick(layer);
};


if (typeof define !== 'undefined' && define.amd) {

	// AMD. Register as an anonymous module.
	define(function() {
		'use strict';
		return FastClick;
	});
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = FastClick.attach;
	module.exports.FastClick = FastClick;
} else {
	window.FastClick = FastClick;
}

},{}],3:[function(require,module,exports){
var process=require("__browserify_process");/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * A lightweight CommonJS Promises/A and when() implementation
 * when is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 * @version 2.6.0
 */
(function(define, global) { 'use strict';
define(function (require) {

	// Public API

	when.promise   = promise;    // Create a pending promise
	when.resolve   = resolve;    // Create a resolved promise
	when.reject    = reject;     // Create a rejected promise
	when.defer     = defer;      // Create a {promise, resolver} pair

	when.join      = join;       // Join 2 or more promises

	when.all       = all;        // Resolve a list of promises
	when.map       = map;        // Array.map() for promises
	when.reduce    = reduce;     // Array.reduce() for promises
	when.settle    = settle;     // Settle a list of promises

	when.any       = any;        // One-winner race
	when.some      = some;       // Multi-winner race

	when.isPromise = isPromiseLike;  // DEPRECATED: use isPromiseLike
	when.isPromiseLike = isPromiseLike; // Is something promise-like, aka thenable

	/**
	 * Register an observer for a promise or immediate value.
	 *
	 * @param {*} promiseOrValue
	 * @param {function?} [onFulfilled] callback to be called when promiseOrValue is
	 *   successfully fulfilled.  If promiseOrValue is an immediate value, callback
	 *   will be invoked immediately.
	 * @param {function?} [onRejected] callback to be called when promiseOrValue is
	 *   rejected.
	 * @param {function?} [onProgress] callback to be called when progress updates
	 *   are issued for promiseOrValue.
	 * @returns {Promise} a new {@link Promise} that will complete with the return
	 *   value of callback or errback or the completion value of promiseOrValue if
	 *   callback and/or errback is not supplied.
	 */
	function when(promiseOrValue, onFulfilled, onRejected, onProgress) {
		// Get a trusted promise for the input promiseOrValue, and then
		// register promise handlers
		return cast(promiseOrValue).then(onFulfilled, onRejected, onProgress);
	}

	function cast(x) {
		return x instanceof Promise ? x : resolve(x);
	}

	/**
	 * Trusted Promise constructor.  A Promise created from this constructor is
	 * a trusted when.js promise.  Any other duck-typed promise is considered
	 * untrusted.
	 * @constructor
	 * @param {function} sendMessage function to deliver messages to the promise's handler
	 * @param {function?} inspect function that reports the promise's state
	 * @name Promise
	 */
	function Promise(sendMessage, inspect) {
		this._message = sendMessage;
		this.inspect = inspect;
	}

	Promise.prototype = {
		/**
		 * Register handlers for this promise.
		 * @param [onFulfilled] {Function} fulfillment handler
		 * @param [onRejected] {Function} rejection handler
		 * @param [onProgress] {Function} progress handler
		 * @return {Promise} new Promise
		 */
		then: function(onFulfilled, onRejected, onProgress) {
			/*jshint unused:false*/
			var args, sendMessage;

			args = arguments;
			sendMessage = this._message;

			return _promise(function(resolve, reject, notify) {
				sendMessage('when', args, resolve, notify);
			}, this._status && this._status.observed());
		},

		/**
		 * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @return {Promise}
		 */
		otherwise: function(onRejected) {
			return this.then(undef, onRejected);
		},

		/**
		 * Ensures that onFulfilledOrRejected will be called regardless of whether
		 * this promise is fulfilled or rejected.  onFulfilledOrRejected WILL NOT
		 * receive the promises' value or reason.  Any returned value will be disregarded.
		 * onFulfilledOrRejected may throw or return a rejected promise to signal
		 * an additional error.
		 * @param {function} onFulfilledOrRejected handler to be called regardless of
		 *  fulfillment or rejection
		 * @returns {Promise}
		 */
		ensure: function(onFulfilledOrRejected) {
			return typeof onFulfilledOrRejected === 'function'
				? this.then(injectHandler, injectHandler)['yield'](this)
				: this;

			function injectHandler() {
				return resolve(onFulfilledOrRejected());
			}
		},

		/**
		 * Terminate a promise chain by handling the ultimate fulfillment value or
		 * rejection reason, and assuming responsibility for all errors.  if an
		 * error propagates out of handleResult or handleFatalError, it will be
		 * rethrown to the host, resulting in a loud stack track on most platforms
		 * and a crash on some.
		 * @param {function?} handleResult
		 * @param {function?} handleError
		 * @returns {undefined}
		 */
		done: function(handleResult, handleError) {
			this.then(handleResult, handleError).otherwise(crash);
		},

		/**
		 * Shortcut for .then(function() { return value; })
		 * @param  {*} value
		 * @return {Promise} a promise that:
		 *  - is fulfilled if value is not a promise, or
		 *  - if value is a promise, will fulfill with its value, or reject
		 *    with its reason.
		 */
		'yield': function(value) {
			return this.then(function() {
				return value;
			});
		},

		/**
		 * Runs a side effect when this promise fulfills, without changing the
		 * fulfillment value.
		 * @param {function} onFulfilledSideEffect
		 * @returns {Promise}
		 */
		tap: function(onFulfilledSideEffect) {
			return this.then(onFulfilledSideEffect)['yield'](this);
		},

		/**
		 * Assumes that this promise will fulfill with an array, and arranges
		 * for the onFulfilled to be called with the array as its argument list
		 * i.e. onFulfilled.apply(undefined, array).
		 * @param {function} onFulfilled function to receive spread arguments
		 * @return {Promise}
		 */
		spread: function(onFulfilled) {
			return this.then(function(array) {
				// array may contain promises, so resolve its contents.
				return all(array, function(array) {
					return onFulfilled.apply(undef, array);
				});
			});
		},

		/**
		 * Shortcut for .then(onFulfilledOrRejected, onFulfilledOrRejected)
		 * @deprecated
		 */
		always: function(onFulfilledOrRejected, onProgress) {
			return this.then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress);
		}
	};

	/**
	 * Returns a resolved promise. The returned promise will be
	 *  - fulfilled with promiseOrValue if it is a value, or
	 *  - if promiseOrValue is a promise
	 *    - fulfilled with promiseOrValue's value after it is fulfilled
	 *    - rejected with promiseOrValue's reason after it is rejected
	 * @param  {*} value
	 * @return {Promise}
	 */
	function resolve(value) {
		return promise(function(resolve) {
			resolve(value);
		});
	}

	/**
	 * Returns a rejected promise for the supplied promiseOrValue.  The returned
	 * promise will be rejected with:
	 * - promiseOrValue, if it is a value, or
	 * - if promiseOrValue is a promise
	 *   - promiseOrValue's value after it is fulfilled
	 *   - promiseOrValue's reason after it is rejected
	 * @param {*} promiseOrValue the rejected value of the returned {@link Promise}
	 * @return {Promise} rejected {@link Promise}
	 */
	function reject(promiseOrValue) {
		return when(promiseOrValue, rejected);
	}

	/**
	 * Creates a {promise, resolver} pair, either or both of which
	 * may be given out safely to consumers.
	 * The resolver has resolve, reject, and progress.  The promise
	 * has then plus extended promise API.
	 *
	 * @return {{
	 * promise: Promise,
	 * resolve: function:Promise,
	 * reject: function:Promise,
	 * notify: function:Promise
	 * resolver: {
	 *	resolve: function:Promise,
	 *	reject: function:Promise,
	 *	notify: function:Promise
	 * }}}
	 */
	function defer() {
		var deferred, pending, resolved;

		// Optimize object shape
		deferred = {
			promise: undef, resolve: undef, reject: undef, notify: undef,
			resolver: { resolve: undef, reject: undef, notify: undef }
		};

		deferred.promise = pending = promise(makeDeferred);

		return deferred;

		function makeDeferred(resolvePending, rejectPending, notifyPending) {
			deferred.resolve = deferred.resolver.resolve = function(value) {
				if(resolved) {
					return resolve(value);
				}
				resolved = true;
				resolvePending(value);
				return pending;
			};

			deferred.reject  = deferred.resolver.reject  = function(reason) {
				if(resolved) {
					return resolve(rejected(reason));
				}
				resolved = true;
				rejectPending(reason);
				return pending;
			};

			deferred.notify  = deferred.resolver.notify  = function(update) {
				notifyPending(update);
				return update;
			};
		}
	}

	/**
	 * Creates a new promise whose fate is determined by resolver.
	 * @param {function} resolver function(resolve, reject, notify)
	 * @returns {Promise} promise whose fate is determine by resolver
	 */
	function promise(resolver) {
		return _promise(resolver, monitorApi.PromiseStatus && monitorApi.PromiseStatus());
	}

	/**
	 * Creates a new promise, linked to parent, whose fate is determined
	 * by resolver.
	 * @param {function} resolver function(resolve, reject, notify)
	 * @param {Promise?} status promise from which the new promise is begotten
	 * @returns {Promise} promise whose fate is determine by resolver
	 * @private
	 */
	function _promise(resolver, status) {
		var self, value, consumers = [];

		self = new Promise(_message, inspect);
		self._status = status;

		// Call the provider resolver to seal the promise's fate
		try {
			resolver(promiseResolve, promiseReject, promiseNotify);
		} catch(e) {
			promiseReject(e);
		}

		// Return the promise
		return self;

		/**
		 * Private message delivery. Queues and delivers messages to
		 * the promise's ultimate fulfillment value or rejection reason.
		 * @private
		 * @param {String} type
		 * @param {Array} args
		 * @param {Function} resolve
		 * @param {Function} notify
		 */
		function _message(type, args, resolve, notify) {
			consumers ? consumers.push(deliver) : enqueue(function() { deliver(value); });

			function deliver(p) {
				p._message(type, args, resolve, notify);
			}
		}

		/**
		 * Returns a snapshot of the promise's state at the instant inspect()
		 * is called. The returned object is not live and will not update as
		 * the promise's state changes.
		 * @returns {{ state:String, value?:*, reason?:* }} status snapshot
		 *  of the promise.
		 */
		function inspect() {
			return value ? value.inspect() : toPendingState();
		}

		/**
		 * Transition from pre-resolution state to post-resolution state, notifying
		 * all listeners of the ultimate fulfillment or rejection
		 * @param {*|Promise} val resolution value
		 */
		function promiseResolve(val) {
			if(!consumers) {
				return;
			}

			var queue = consumers;
			consumers = undef;

			enqueue(function () {
				value = coerce(self, val);
				if(status) {
					updateStatus(value, status);
				}
				runHandlers(queue, value);
			});

		}

		/**
		 * Reject this promise with the supplied reason, which will be used verbatim.
		 * @param {*} reason reason for the rejection
		 */
		function promiseReject(reason) {
			promiseResolve(rejected(reason));
		}

		/**
		 * Issue a progress event, notifying all progress listeners
		 * @param {*} update progress event payload to pass to all listeners
		 */
		function promiseNotify(update) {
			if(consumers) {
				var queue = consumers;
				enqueue(function () {
					runHandlers(queue, progressed(update));
				});
			}
		}
	}

	/**
	 * Run a queue of functions as quickly as possible, passing
	 * value to each.
	 */
	function runHandlers(queue, value) {
		for (var i = 0; i < queue.length; i++) {
			queue[i](value);
		}
	}

	/**
	 * Creates a fulfilled, local promise as a proxy for a value
	 * NOTE: must never be exposed
	 * @param {*} value fulfillment value
	 * @returns {Promise}
	 */
	function fulfilled(value) {
		return near(
			new NearFulfilledProxy(value),
			function() { return toFulfilledState(value); }
		);
	}

	/**
	 * Creates a rejected, local promise with the supplied reason
	 * NOTE: must never be exposed
	 * @param {*} reason rejection reason
	 * @returns {Promise}
	 */
	function rejected(reason) {
		return near(
			new NearRejectedProxy(reason),
			function() { return toRejectedState(reason); }
		);
	}

	/**
	 * Creates a near promise using the provided proxy
	 * NOTE: must never be exposed
	 * @param {object} proxy proxy for the promise's ultimate value or reason
	 * @param {function} inspect function that returns a snapshot of the
	 *  returned near promise's state
	 * @returns {Promise}
	 */
	function near(proxy, inspect) {
		return new Promise(function (type, args, resolve) {
			try {
				resolve(proxy[type].apply(proxy, args));
			} catch(e) {
				resolve(rejected(e));
			}
		}, inspect);
	}

	/**
	 * Create a progress promise with the supplied update.
	 * @private
	 * @param {*} update
	 * @return {Promise} progress promise
	 */
	function progressed(update) {
		return new Promise(function (type, args, _, notify) {
			var onProgress = args[2];
			try {
				notify(typeof onProgress === 'function' ? onProgress(update) : update);
			} catch(e) {
				notify(e);
			}
		});
	}

	/**
	 * Coerces x to a trusted Promise
	 * @param {*} x thing to coerce
	 * @returns {*} Guaranteed to return a trusted Promise.  If x
	 *   is trusted, returns x, otherwise, returns a new, trusted, already-resolved
	 *   Promise whose resolution value is:
	 *   * the resolution value of x if it's a foreign promise, or
	 *   * x if it's a value
	 */
	function coerce(self, x) {
		if (x === self) {
			return rejected(new TypeError());
		}

		if (x instanceof Promise) {
			return x;
		}

		try {
			var untrustedThen = x === Object(x) && x.then;

			return typeof untrustedThen === 'function'
				? assimilate(untrustedThen, x)
				: fulfilled(x);
		} catch(e) {
			return rejected(e);
		}
	}

	/**
	 * Safely assimilates a foreign thenable by wrapping it in a trusted promise
	 * @param {function} untrustedThen x's then() method
	 * @param {object|function} x thenable
	 * @returns {Promise}
	 */
	function assimilate(untrustedThen, x) {
		return promise(function (resolve, reject) {
			fcall(untrustedThen, x, resolve, reject);
		});
	}

	/**
	 * Proxy for a near, fulfilled value
	 * @param {*} value
	 * @constructor
	 */
	function NearFulfilledProxy(value) {
		this.value = value;
	}

	NearFulfilledProxy.prototype.when = function(onResult) {
		return typeof onResult === 'function' ? onResult(this.value) : this.value;
	};

	/**
	 * Proxy for a near rejection
	 * @param {*} reason
	 * @constructor
	 */
	function NearRejectedProxy(reason) {
		this.reason = reason;
	}

	NearRejectedProxy.prototype.when = function(_, onError) {
		if(typeof onError === 'function') {
			return onError(this.reason);
		} else {
			throw this.reason;
		}
	};

	function updateStatus(value, status) {
		value.then(statusFulfilled, statusRejected);

		function statusFulfilled() { status.fulfilled(); }
		function statusRejected(r) { status.rejected(r); }
	}

	/**
	 * Determines if x is promise-like, i.e. a thenable object
	 * NOTE: Will return true for *any thenable object*, and isn't truly
	 * safe, since it may attempt to access the `then` property of x (i.e.
	 *  clever/malicious getters may do weird things)
	 * @param {*} x anything
	 * @returns {boolean} true if x is promise-like
	 */
	function isPromiseLike(x) {
		return x && typeof x.then === 'function';
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * howMany of the supplied promisesOrValues have resolved, or will reject when
	 * it becomes impossible for howMany to resolve, for example, when
	 * (promisesOrValues.length - howMany) + 1 input promises reject.
	 *
	 * @param {Array} promisesOrValues array of anything, may contain a mix
	 *      of promises and values
	 * @param howMany {number} number of promisesOrValues to resolve
	 * @param {function?} [onFulfilled] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onRejected] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onProgress] DEPRECATED, use returnedPromise.then()
	 * @returns {Promise} promise that will resolve to an array of howMany values that
	 *  resolved first, or will reject with an array of
	 *  (promisesOrValues.length - howMany) + 1 rejection reasons.
	 */
	function some(promisesOrValues, howMany, onFulfilled, onRejected, onProgress) {

		return when(promisesOrValues, function(promisesOrValues) {

			return promise(resolveSome).then(onFulfilled, onRejected, onProgress);

			function resolveSome(resolve, reject, notify) {
				var toResolve, toReject, values, reasons, fulfillOne, rejectOne, len, i;

				len = promisesOrValues.length >>> 0;

				toResolve = Math.max(0, Math.min(howMany, len));
				values = [];

				toReject = (len - toResolve) + 1;
				reasons = [];

				// No items in the input, resolve immediately
				if (!toResolve) {
					resolve(values);

				} else {
					rejectOne = function(reason) {
						reasons.push(reason);
						if(!--toReject) {
							fulfillOne = rejectOne = identity;
							reject(reasons);
						}
					};

					fulfillOne = function(val) {
						// This orders the values based on promise resolution order
						values.push(val);
						if (!--toResolve) {
							fulfillOne = rejectOne = identity;
							resolve(values);
						}
					};

					for(i = 0; i < len; ++i) {
						if(i in promisesOrValues) {
							when(promisesOrValues[i], fulfiller, rejecter, notify);
						}
					}
				}

				function rejecter(reason) {
					rejectOne(reason);
				}

				function fulfiller(val) {
					fulfillOne(val);
				}
			}
		});
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * any one of the supplied promisesOrValues has resolved or will reject when
	 * *all* promisesOrValues have rejected.
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onRejected] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onProgress] DEPRECATED, use returnedPromise.then()
	 * @returns {Promise} promise that will resolve to the value that resolved first, or
	 * will reject with an array of all rejected inputs.
	 */
	function any(promisesOrValues, onFulfilled, onRejected, onProgress) {

		function unwrapSingleResult(val) {
			return onFulfilled ? onFulfilled(val[0]) : val[0];
		}

		return some(promisesOrValues, 1, unwrapSingleResult, onRejected, onProgress);
	}

	/**
	 * Return a promise that will resolve only once all the supplied promisesOrValues
	 * have resolved. The resolution value of the returned promise will be an array
	 * containing the resolution values of each of the promisesOrValues.
	 * @memberOf when
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onRejected] DEPRECATED, use returnedPromise.then()
	 * @param {function?} [onProgress] DEPRECATED, use returnedPromise.then()
	 * @returns {Promise}
	 */
	function all(promisesOrValues, onFulfilled, onRejected, onProgress) {
		return _map(promisesOrValues, identity).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Joins multiple promises into a single returned promise.
	 * @return {Promise} a promise that will fulfill when *all* the input promises
	 * have fulfilled, or will reject when *any one* of the input promises rejects.
	 */
	function join(/* ...promises */) {
		return _map(arguments, identity);
	}

	/**
	 * Settles all input promises such that they are guaranteed not to
	 * be pending once the returned promise fulfills. The returned promise
	 * will always fulfill, except in the case where `array` is a promise
	 * that rejects.
	 * @param {Array|Promise} array or promise for array of promises to settle
	 * @returns {Promise} promise that always fulfills with an array of
	 *  outcome snapshots for each input promise.
	 */
	function settle(array) {
		return _map(array, toFulfilledState, toRejectedState);
	}

	/**
	 * Promise-aware array map function, similar to `Array.prototype.map()`,
	 * but input array may contain promises or values.
	 * @param {Array|Promise} array array of anything, may contain promises and values
	 * @param {function} mapFunc map function which may return a promise or value
	 * @returns {Promise} promise that will fulfill with an array of mapped values
	 *  or reject if any input promise rejects.
	 */
	function map(array, mapFunc) {
		return _map(array, mapFunc);
	}

	/**
	 * Internal map that allows a fallback to handle rejections
	 * @param {Array|Promise} array array of anything, may contain promises and values
	 * @param {function} mapFunc map function which may return a promise or value
	 * @param {function?} fallback function to handle rejected promises
	 * @returns {Promise} promise that will fulfill with an array of mapped values
	 *  or reject if any input promise rejects.
	 */
	function _map(array, mapFunc, fallback) {
		return when(array, function(array) {

			return _promise(resolveMap);

			function resolveMap(resolve, reject, notify) {
				var results, len, toResolve, i;

				// Since we know the resulting length, we can preallocate the results
				// array to avoid array expansions.
				toResolve = len = array.length >>> 0;
				results = [];

				if(!toResolve) {
					resolve(results);
					return;
				}

				// Since mapFunc may be async, get all invocations of it into flight
				for(i = 0; i < len; i++) {
					if(i in array) {
						resolveOne(array[i], i);
					} else {
						--toResolve;
					}
				}

				function resolveOne(item, i) {
					when(item, mapFunc, fallback).then(function(mapped) {
						results[i] = mapped;

						if(!--toResolve) {
							resolve(results);
						}
					}, reject, notify);
				}
			}
		});
	}

	/**
	 * Traditional reduce function, similar to `Array.prototype.reduce()`, but
	 * input may contain promises and/or values, and reduceFunc
	 * may return either a value or a promise, *and* initialValue may
	 * be a promise for the starting value.
	 *
	 * @param {Array|Promise} promise array or promise for an array of anything,
	 *      may contain a mix of promises and values.
	 * @param {function} reduceFunc reduce function reduce(currentValue, nextValue, index, total),
	 *      where total is the total number of items being reduced, and will be the same
	 *      in each call to reduceFunc.
	 * @returns {Promise} that will resolve to the final reduced value
	 */
	function reduce(promise, reduceFunc /*, initialValue */) {
		var args = fcall(slice, arguments, 1);

		return when(promise, function(array) {
			var total;

			total = array.length;

			// Wrap the supplied reduceFunc with one that handles promises and then
			// delegates to the supplied.
			args[0] = function (current, val, i) {
				return when(current, function (c) {
					return when(val, function (value) {
						return reduceFunc(c, value, i, total);
					});
				});
			};

			return reduceArray.apply(array, args);
		});
	}

	// Snapshot states

	/**
	 * Creates a fulfilled state snapshot
	 * @private
	 * @param {*} x any value
	 * @returns {{state:'fulfilled',value:*}}
	 */
	function toFulfilledState(x) {
		return { state: 'fulfilled', value: x };
	}

	/**
	 * Creates a rejected state snapshot
	 * @private
	 * @param {*} x any reason
	 * @returns {{state:'rejected',reason:*}}
	 */
	function toRejectedState(x) {
		return { state: 'rejected', reason: x };
	}

	/**
	 * Creates a pending state snapshot
	 * @private
	 * @returns {{state:'pending'}}
	 */
	function toPendingState() {
		return { state: 'pending' };
	}

	//
	// Internals, utilities, etc.
	//

	var reduceArray, slice, fcall, nextTick, handlerQueue,
		setTimeout, funcProto, call, arrayProto, monitorApi,
		cjsRequire, MutationObserver, undef;

	cjsRequire = require;

	//
	// Shared handler queue processing
	//
	// Credit to Twisol (https://github.com/Twisol) for suggesting
	// this type of extensible queue + trampoline approach for
	// next-tick conflation.

	handlerQueue = [];

	/**
	 * Enqueue a task. If the queue is not currently scheduled to be
	 * drained, schedule it.
	 * @param {function} task
	 */
	function enqueue(task) {
		if(handlerQueue.push(task) === 1) {
			nextTick(drainQueue);
		}
	}

	/**
	 * Drain the handler queue entirely, being careful to allow the
	 * queue to be extended while it is being processed, and to continue
	 * processing until it is truly empty.
	 */
	function drainQueue() {
		runHandlers(handlerQueue);
		handlerQueue = [];
	}

	// capture setTimeout to avoid being caught by fake timers
	// used in time based tests
	setTimeout = global.setTimeout;

	// Allow attaching the monitor to when() if env has no console
	monitorApi = typeof console !== 'undefined' ? console : when;

	// Sniff "best" async scheduling option
	// Prefer process.nextTick or MutationObserver, then check for
	// vertx and finally fall back to setTimeout
	/*global process*/
	if (typeof process === 'object' && process.nextTick) {
		nextTick = process.nextTick;
	} else if(MutationObserver = global.MutationObserver || global.WebKitMutationObserver) {
		nextTick = (function(document, MutationObserver, drainQueue) {
			var el = document.createElement('div');
			new MutationObserver(drainQueue).observe(el, { attributes: true });

			return function() {
				el.setAttribute('x', 'x');
			};
		}(document, MutationObserver, drainQueue));
	} else {
		try {
			// vert.x 1.x || 2.x
			nextTick = cjsRequire('vertx').runOnLoop || cjsRequire('vertx').runOnContext;
		} catch(ignore) {
			nextTick = function(t) { setTimeout(t, 0); };
		}
	}

	//
	// Capture/polyfill function and array utils
	//

	// Safe function calls
	funcProto = Function.prototype;
	call = funcProto.call;
	fcall = funcProto.bind
		? call.bind(call)
		: function(f, context) {
			return f.apply(context, slice.call(arguments, 2));
		};

	// Safe array ops
	arrayProto = [];
	slice = arrayProto.slice;

	// ES5 reduce implementation if native not available
	// See: http://es5.github.com/#x15.4.4.21 as there are many
	// specifics and edge cases.  ES5 dictates that reduce.length === 1
	// This implementation deviates from ES5 spec in the following ways:
	// 1. It does not check if reduceFunc is a Callable
	reduceArray = arrayProto.reduce ||
		function(reduceFunc /*, initialValue */) {
			/*jshint maxcomplexity: 7*/
			var arr, args, reduced, len, i;

			i = 0;
			arr = Object(this);
			len = arr.length >>> 0;
			args = arguments;

			// If no initialValue, use first item of array (we know length !== 0 here)
			// and adjust i to start at second item
			if(args.length <= 1) {
				// Skip to the first real element in the array
				for(;;) {
					if(i in arr) {
						reduced = arr[i++];
						break;
					}

					// If we reached the end of the array without finding any real
					// elements, it's a TypeError
					if(++i >= len) {
						throw new TypeError();
					}
				}
			} else {
				// If initialValue provided, use it
				reduced = args[1];
			}

			// Do the actual reduce
			for(;i < len; ++i) {
				if(i in arr) {
					reduced = reduceFunc(reduced, arr[i], i, arr);
				}
			}

			return reduced;
		};

	function identity(x) {
		return x;
	}

	function crash(fatalError) {
		if(typeof monitorApi.reportUnhandled === 'function') {
			monitorApi.reportUnhandled();
		} else {
			enqueue(function() {
				throw fatalError;
			});
		}

		throw fatalError;
	}

	return when;
});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }, this);

},{"__browserify_process":4}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],5:[function(require,module,exports){
var when = require("./..\\..\\bower_components\\when\\when.js");
var attachFastClick = require("./..\\..\\bower_components\\fastclick\\lib\\fastclick.js");
//TODO: Find a better way to require bouncefix
var bouncefix = require('./../../bower_components/bouncefix.js/lib/bouncefix.js');

module.exports = function(dataProviderUrl, tableKeys, elem, options){
  "use strict";

  /*---------------- Vars ----------------*\
  \*----------------      ----------------*/

  var dataProvider = dataProviderUrl,
      keys         = tableKeys,
      container    = elem;

  var stWrap,
      currentIndexElement,
      swipeReference,
      deferredContainer = [];

  var pageSize,
      pageAmount,
      headerHeight    = 50,
      scrollbarHeight =  5,
      controlHeight   = 50,
      rowSizes;

  var sortAscending   = true,
      sortColumn,
      timestamp,
      newItems;

  var headerScrollbar,
      mainScrollbar;

  var controls;

  var boundEvents = {};

  options = options || {};

  if(typeof options.fullscreen !== 'boolean'){
    // Use default
    options.fullscreen = true;
  }

  if(options.fullscreen){
    container.className+= ' st-fullscreen';
  }
  else{
    container.className+= ' st-not-fullscreen';
  }

  options.demo == options.demo || false;

  var tableClass = options.tableClass || 'table table-condensed';

  var slides, slidePos, width, length;

  /*---------------- Init ----------------*\
   Test element heights, create UI elements,
   get the first page and prep the next one
  \*----------------      ----------------*/

  var init = function(){
    if(swipeReference){
      swipeReference.kill();
      window.removeEventListener('orientationchange', boundEvents.init);
      window.removeEventListener('resize', boundEvents.update);
    }
    // Remove everything inside the container
    container.innerHTML = '';

    var tableHeight;
    var requestDeferred = when.defer();
    var dataTable = createTable();

    stWrap = document.createElement("div");
    stWrap.className = "st-wrap";
    container.appendChild(stWrap);

    if(options.fullscreen){
      document.body.parentElement.style.height = '100%';
      document.body.style.height = '100%';
      container.style.height = '100%';
      tableHeight = viewportHeight();
    }
    else{
      tableHeight = parseInt(container.getBoundingClientRect().height, 10);
    }

    rowSizes = testSizes();

    // Add margin for proper spacing of elements
    stWrap.style.marginTop = headerHeight - rowSizes.headerHeight + 'px';

    // Remove height for other elements
    tableHeight -= headerHeight;
    tableHeight -= scrollbarHeight;
    tableHeight -= controlHeight;

    pageSize = Math.floor(tableHeight / rowSizes.bodyHeight);

    // Make the request for the first page
    if (options.demo){
      makeRequest(
        dataProvider,
        {demo: true},
        requestDeferred.resolver);
      options.demo = false;
    }
    else{
      makeRequest(
        dataProvider,
        {},
        requestDeferred.resolver);
    }

    createHeader();

    var doUpdateHeader = updateHeader.bind(this);
    var doUpdateHeaderScrollbar = updateHeaderScrollbar.bind(this);

    boundEvents.update = function(){
      doUpdateHeader();
      doUpdateHeaderScrollbar();
    };

    window.addEventListener('resize', boundEvents.update);

    boundEvents.init = init.bind(this);

    window.addEventListener('orientationchange', boundEvents.init);

    mainScrollbar   = createScrollbar();
    headerScrollbar = createScrollbar();

    container.appendChild(mainScrollbar);
    container.querySelector('.st-header .st-scrollable').appendChild(headerScrollbar);

    controls = createControls();

    requestDeferred.promise.then(
      function(value){
        return fillTable(dataTable, value);
      }

    ).then(
      function(value){
        var stTableWraps = [];
        var i;

        var stTableWrap = document.createElement('div');
        stTableWrap.className = 'st-table-wrap';
        stTableWrap.setAttribute('data-active', 'false');

        stTableWrap.appendChild(document.createTextNode('placeholder'));

        for (i = 1; i < pageAmount; i+=1){
          stTableWraps.push(stTableWrap.cloneNode(true));
        }

        value.setAttribute('data-active', 'true');
        value.setAttribute('data-timestamp', timestamp);
        stWrap.appendChild(value);

        // Fill with placeholders so that first and last will
        // function as expected. This also results in less calls
        // needed to swipeReference.setup()
        for (i = 1; i < pageAmount; i+=1){
          stWrap.appendChild(stTableWraps[i-1]);
        }

        createSwipe();

        nextPage();
        resolveTheResolver(1); // So nextPage's promise passes
        updateHeader(container.querySelector('.st-table-wrap'));

        updateMainScrollbar(0);
        updateHeaderScrollbar();

        var headerStyles = container.querySelectorAll('.st-header .st-scrollable th');
        for (var l = 0; l < headerStyles.length; l+=1 ) {
          var style = headerStyles.item(l).style;

          style.webkitTransition =
          style.MozTransition =
          style.msTransition =
          style.OTransition =
          style.transition = 'width 300ms';
        }
      }
    );

    // Remove click delay for mobile
    attachFastClick(container);

    // Fixes iOs vertical bouncing on scroll
    if(options.fullscreen){
      bouncefix.add('swipe-table');
    }
  };

  /*---------------- Test ----------------*\
  \*----------------      ----------------*/

  var viewportHeight = function(){
    // responsejs.com/labs/dimensions/
    var matchMedia = window.matchMedia || window.msMatchMedia;
    var viewportH = (function(win, docElem, mM) {
      var client = docElem.clientHeight,
          inner = win.innerHeight;
      if (mM && client < inner && true === mM('(min-height:' + inner + 'px)').matches){
        return win.innerHeight;
      }
      else{
        return docElem.clientHeight;
      }
    }(window, document.documentElement, matchMedia));

    return viewportH;
  };

  var testSizes = function(){
    var headerHeight,
        headerCellWidth,
        headerCellPadding,
        bodyHeight,
        bodyCellWidth,
        bodyCellPadding,
        totalHeight;

    var table = document.createElement('table');
    var tHead = document.createElement('thead');
    var tBody = document.createElement('tbody');
    var row   = document.createElement('tr');
    var row2  = document.createElement('tr');
    var head  = document.createElement('th');
    var data  = document.createElement('td');
    var text  = document.createTextNode('text');
    var text2 = document.createTextNode('text');

    table.className = tableClass;
    table.style.visibility = 'hidden';
    table.style.width = '40px';
    table.style.tableLayout = 'fixed';

    head.appendChild(text);
    head.style.width = '80px';
    row.appendChild(head);
    tHead.appendChild(row);
    table.appendChild(tHead);

    data.appendChild(text2);
    data.style.width = '80px';
    row2.appendChild(data);
    tBody.appendChild(row2);
    table.appendChild(tBody);

    stWrap.appendChild(table);

    headerHeight = row.getBoundingClientRect().height;
    headerCellWidth = head.getBoundingClientRect().width;

    bodyHeight = row2.getBoundingClientRect().height;
    bodyCellWidth = data.getBoundingClientRect().width;

    totalHeight = table.getBoundingClientRect().height;

    head.style.padding = '0';
    data.style.padding = '0';
    headerCellPadding = headerCellWidth - head.getBoundingClientRect().width;
    bodyCellPadding = bodyCellWidth - data.getBoundingClientRect().width;

    //TODO: Determine effects of borders on table size
    //
    stWrap.innerHTML = '';

    return {
      headerHeight      : headerHeight,
      headerCellWidth   : headerCellWidth,
      headerCellPadding : headerCellPadding,
      bodyHeight        : bodyHeight,
      bodyCellWidth     : bodyCellWidth,
      bodyCellPadding   : bodyCellPadding,
      totalHeight       : totalHeight,

    };
  };

  /*--------------- Create ---------------*\
  \*---------------        ---------------*/

  var createHeader = function(){
    var i;
    var l;

    var header = document.createElement('div');
    header.className = 'st-header';

    var table = document.createElement('table');
    var tHead = document.createElement('thead');
    var row   = document.createElement('tr');

    var tableClone = table.cloneNode(true);
    var tHeadClone = tHead.cloneNode(true);
    var rowClone = row.cloneNode(true);

    var pinnedClone;

    var stScrollable = document.createElement("div");
    stScrollable.className = 'st-scrollable';
    var stScrollableWrap = stScrollable.cloneNode(true);
    stScrollableWrap.className += '-wrap';

    for (i = 0, l = keys.length; i < l; i+=1){
      var head = document.createElement("th");
      head.appendChild(document.createTextNode(keys[i]));

      if(i === 0){
        pinnedClone = head.cloneNode(true);
      }

      row.appendChild(head);
    }

    tHead.appendChild(row);
    table.appendChild(tHead);
    table.className = tableClass;

    rowClone.appendChild(pinnedClone);
    tHeadClone.appendChild(rowClone);
    tableClone.appendChild(tHeadClone);
    tableClone.className = tableClass;

    var stPinned = document.createElement("div");
    stPinned.appendChild(tableClone);
    stPinned.className = 'st-pinned';

    stScrollable.appendChild(table);
    stScrollableWrap.appendChild(stScrollable);

    header.appendChild(stScrollableWrap);
    header.appendChild(stPinned);
    container.appendChild(header);

    updateScroll.setPosition(0);
  };

  var createScrollbar = function(){
    var bar = document.createElement('div');
    var indicator = document.createElement('div');
    bar.className = 'st-scrollbar';
    bar.appendChild(indicator);
    return bar;
  };

  var createControls = function(){
    var i,l;

    var buttonGlyphs  = ['<<', '<', 'R', '>', '>>'];
    var events = ['first', 'previous', 'refresh', 'next', 'last'];
    var buttons = [];

    var stControls = document.createElement('div');
    stControls.className = 'st-controls';

    var eventHandlers = {
      first: function(element){
        var clickEvent = function(){
          goToPage(1);
        };

        var doClickEvent = clickEvent.bind(this);

        element.addEventListener('click', function(){
          doClickEvent();
        });
      },
      previous: function(element){
        var doClickEvent = swipeFunc.prev.bind(this);

        element.addEventListener('click', function(){
          doClickEvent();
        });
      },
      refresh: function(element){
        var clickEvent = function(){
          if (newItems > 0){
            //TODO: Proper refresh
            init();
          }
        };

        var doClickEvent = clickEvent.bind(this);

        element.addEventListener('click', function(){
          doClickEvent();
        });
      },
      next: function(element){
        var doClickEvent = swipeFunc.next.bind(this);

        element.addEventListener('click', function(){
          doClickEvent();
        });
      },
      last: function(element){
        var clickEvent = function(){
          goToPage(pageAmount);
        };

        var doClickEvent = clickEvent.bind(this);

        element.addEventListener('click', function(){
          doClickEvent();
        });
      }
    };

    var createButton = function(glyph){
      var button = document.createElement('div');
      button.appendChild(document.createTextNode(glyph));
      buttons.push(button);
    };

    var attachButton = function(index){
      stControls.appendChild(buttons[index]);
    };

    var attachEvent = function(index){
      eventHandlers[ events[index] ]( buttons[index] );
    };

    for(i = 0, l = buttonGlyphs.length; i < l; i+=1){
      createButton(buttonGlyphs[i]);
      attachButton(i);
    }

    container.appendChild(stControls);

    for(i = 0, l = buttonGlyphs.length; i < l; i+=1){
      attachEvent(i);
    }
  };

  /*--------------- Request ---------------*\
  \*---------------         ---------------*/

  /**
   * Figures out the request based on parameters given in the queries object.
   *
   * The queries object can contain:
   *    * page
   *    * timestamp
   *    * sortField
   *    * sortAsc
   *
   * @param  {String} server   [description]
   * @param  {Object} queries  Request parameter queries
   * @param  {Function} resolver Deferred resolver
   */
  var makeRequest = function (server, queries, resolver){
    if(typeof server !== 'string'){
      // No server provided, nothing to do here.
      return;
    }
    if(queries.timestamp){

      // If there's a sort parameter, both must be given
      if(queries.sortField || queries.sortAsc){
        if(!queries.sortField || !queries.sortAsc){
          return;
        }

        // If there's a page given, it's a sorted page request
        if(queries.page){
          executeRequest("GET",
                          server +
                            "?p=" + queries.page +
                            "&ps=" + pageSize +
                            "&ts=" + queries.timestamp +
                            "&sort[field]=" + queries.sortField +
                            "&sort[asc]=" + queries.sortAsc,
                          resolver);
        }
        // Else, it's a sorted and timestamped first page equest
        else{
          executeRequest("GET",
                          server +
                            "?ps=" + pageSize +
                            "&ts=" + queries.timestamp +
                            "&sort[field]=" + queries.sortField +
                            "&sort[asc]=" + queries.sortAsc,
                          resolver);
        }
      }
      // So we have timestamp, but no sorting
      else{
        // We need a page parameter to continue
        if(!queries.page){
          // Spec requires a page, nothing more to do here
          return;
        }
        // Make a page request
        executeRequest("GET",
                        server +
                          "?p=" + queries.page +
                          "&ps=" + pageSize +
                          "&ts=" + queries.timestamp,
                        resolver);
      }
    }
    else{
      // No timestamp given, it's a fresh page request
      if (queries.demo){
        executeRequest("GET",
                        server +
                          "?ps=" + pageSize +
                          "&demo=true",
                        resolver);
      }
      else{
        executeRequest("GET",
                        server +
                          "?ps=" + pageSize,
                        resolver);
      }
    }
  };

  /**
   * Executes a request with method, parameters and the table give to next function
   * @param  {String} method Valid HTTP method eg. GET, POST
   * @param  {String} url Complete url string (server + parameters)
   * @param  {Object} table Partial table object
   */
  var executeRequest = function(method, url, resolver){
    var r = new XMLHttpRequest();
    r.open(method, url, true);
    r.onreadystatechange = function(){
      if(r.readyState !== 4 || r.status !== 200){
        return;
      }
      parseResponse(r.responseText, resolver);
    };
    r.send(null);
  };

  // parseResponse(table, response)
  //  Calls fillTable with table and JSON.parse
  //TODO: Work parseResponse into appropriate function
  var parseResponse = function(response, resolver){
    resolver.resolve(JSON.parse(response));
  };

  /*--------------- Tables ---------------*\
  \*---------------        ---------------*/

  /**
   * Creates a table with appropriate headers(thead).
   *
   * Returns a partial table.
   */
  var createTable = (function(){
    var tableInstance;

    return function(){

      if(tableInstance){
        var copy = tableInstance.cloneNode(true);
        return copy;
      }
      else{
        var i, l;

        var table = document.createElement("table");
        table.className = tableClass;
        var thead = document.createElement("thead");
        var tr = document.createElement("tr");

        for (i = 0, l = keys.length; i < l; i+=1){
          var th = document.createElement("th");
          th.appendChild(document.createTextNode(keys[i]));
          tr.appendChild(th);
        }

        thead.appendChild(tr);
        table.appendChild(thead);
        tableInstance = table.cloneNode(true);
        return table;
      }
    };
  }());

  var fillTable = function(table, dataSet){
    var i, j;
    newItems = dataSet.newItems;
    timestamp = dataSet.timestamp;
    pageAmount = dataSet.pages;
    var numRows = dataSet.data.length;

    if(numRows === 0){
      return;
    }

    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    i = 0;
    while (i < numRows){
      var col = dataSet.data[i];
      var tr = document.createElement("tr");
      var colCells = Object.keys(col).length;

      j = 0;
      while (j < colCells){
        var td = document.createElement("td");
        td.appendChild(document.createTextNode(col[keys[j]]));
        tr.appendChild(td);
        j+=1;
      }

      tbody.appendChild(tr);
      i+=1;
    }

    // Make a table container to hold the split elements
    var stTableWrap = document.createElement('div');
    // Cloning an element is faster than creating more
    var stScrollable = stTableWrap.cloneNode(true);
    var stScrollableWrap = stTableWrap.cloneNode(true);
    var stPinned = stTableWrap.cloneNode(true);

    // Add classes to the containers
    stTableWrap.className = 'st-table-wrap';
    stScrollable.className = 'st-scrollable';
    stScrollableWrap.className = 'st-scrollable-wrap';
    stPinned.className = 'st-pinned';

    // Clone data and attach both to st-pinned and st-scrollable
    var cloned = table.cloneNode(true);
    stScrollable.appendChild(table);
    stScrollableWrap.appendChild(stScrollable);
    stPinned.appendChild(cloned);

    // Attach to parent
    stTableWrap.appendChild(stScrollableWrap);
    stTableWrap.appendChild(stPinned);

    return when.resolve(stTableWrap);
  };

  /*--------------- Swipe ---------------*\
  \*---------------       ---------------*/

  function translate(index, dist, speed, direct) {
    var slide;
    if (direct){
      slide = direct;
    }
    else{
      slide = slides[index];
    }

    var style = slide && slide.style;

    if (!style){
      return;
    }

    style.webkitTransitionDuration =
    style.MozTransitionDuration =
    style.msTransitionDuration =
    style.OTransitionDuration =
    style.transitionDuration = speed + 'ms';

    style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
    style.msTransform =
    style.MozTransform =
    style.OTransform = 'translateX(' + dist + 'px)';
  }

  function Swipe(options) {

    // utilities
    var noop = function() {}; // simple no operation function
    var offloadFn = function(fn) { setTimeout(fn || noop, 0); }; // offload a functions execution

    // check browser capabilities
    var browser = {
      addEventListener: !!window.addEventListener,
      touch: ('ontouchstart' in window),
      transitions: (function(temp) {
        var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
        for ( var i in props ){
          if (temp.style[ props[i] ] !== undefined){
            return true;
          }
          return false;
        }
      })(document.createElement('swipetable'))
    };

    var headerScroll = container.querySelector('.st-header .st-scrollable');

    var index = parseInt(options.startSlide, 10) || 0;
    var speed = options.speed || 300;

    function setup() {

      // cache slides
      slides = stWrap.children;
      length = slides.length;


      // create an array to store current positions of each slide
      slidePos = new Array(slides.length);

      // determine width of each slide
      width = container.getBoundingClientRect().width || container.offsetWidth;

      stWrap.style.width = (slides.length * width) + 'px';

      // stack elements
      var pos = slides.length;
      while(pos--) {

        var slide = slides[pos];

        slide.style.width = width + 'px';
        slide.setAttribute('data-index', pos);

        if (browser.transitions) {
          slide.style.left = (pos * -width) + 'px';
          move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
        }

      }


      if (!browser.transitions){
        stWrap.style.left = (index * -width) + 'px';
      }

      updateMainScrollbar(index, 0, 0);

      container.style.visibility = 'visible';

    }

    function prev() {

      if (index){
        slide(index-1);
      }
    }

    function next() {

      if (index < slides.length - 1){
        slide(index+1);
      }
    }

    function circle(index) {

      // a simple positive modulo using slides.length
      return (slides.length + (index % slides.length)) % slides.length;

    }

    function slide(to, slideSpeed) {

      // do nothing if already on requested slide
      if (index == to){
        return;
      }

      if (browser.transitions) {

        var direction = Math.abs(index-to) / (index-to); // 1: backward, -1: forward

        var diff = Math.abs(index-to) - 1;

        // move all the slides between index and to in the right direction
        while (diff--){
          move( circle((to > index ? to : index) - diff - 1), width * direction, 0);
        }

        to = circle(to);

        move(index, width * direction, slideSpeed || speed);
        move(to, 0, slideSpeed || speed);
        updateMainScrollbar(to, 0, speed);

      } else {

        to = circle(to);
        animate(index * -width, to * -width, slideSpeed || speed);
        //no fallback for a circular continuous if the browser does not accept transitions
      }

      index = to;
      offloadFn(options.callback && options.callback(index, slides[index]));
    }

    function move(index, dist, speed) {

      translate(index, dist, speed);
      slidePos[index] = dist;

    }

    function animate(from, to, speed) {

      // if not an animation, just reposition
      if (!speed) {

        stWrap.style.left = to + 'px';
        return;

      }

      var start = Date.now();

      var timer = setInterval(function() {

        var timeElap = Date.now() - start;

        if (timeElap > speed) {

          stWrap.style.left = to + 'px';

          options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

          clearInterval(timer);
          return;

        }

        stWrap.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

      }, 4);

    }

    // setup initial vars
    var start = {};
    var delta = {};
    var twoTouches;
    var isScrolling;

    // setup event capturing
    var events = {

      handleEvent: function(event) {

        switch (event.type) {
          case 'touchstart': this.start(event); break;
          case 'touchmove': this.move(event); break;
          case 'touchend': offloadFn(this.end(event)); break;
          case 'webkitTransitionEnd':
          case 'msTransitionEnd':
          case 'oTransitionEnd':
          case 'otransitionend':
          case 'transitionend': offloadFn(this.transitionEnd(event)); break;
          case 'resize': offloadFn(setup.call()); break;
        }

        if (options.stopPropagation){
          event.stopPropagation();
        }

      },
      start: function(event) {

        var touches = event.touches[0];

        // measure start values
        start = {

          // get initial touch coords
          x: touches.pageX,
          y: touches.pageY,

          // store time to determine touch duration
          time: Date.now()

        };

        // used for testing first move event
        isScrolling = undefined;

        twoTouches = undefined;

        // reset delta and end measurements
        delta = {};

        // attach touchmove and touchend listeners
        stWrap.addEventListener('touchmove', this, false);
        stWrap.addEventListener('touchend', this, false);

      },
      move: function(event) {

        // ensure swiping with one touch and not pinching
        if ( event.touches.length > 2){
          return;
        }

        if (options.disableScroll){
          event.preventDefault();
        }

        var touches = event.touches[0];

        if (event.touches.length === 2){
          twoTouches = true;
        }

        // measure change in x and y
        delta = {
          x: touches.pageX - start.x,
          y: touches.pageY - start.y
        };

        // determine if scrolling test has run - one time test
        if ( typeof isScrolling == 'undefined') {
          isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
        }

        // if user is not trying to scroll vertically
        if (!isScrolling) {

          // prevent native scrolling
          event.preventDefault();

          // increase resistance if first or last slide

            delta.x =
              delta.x /
                ( (!index && delta.x > 0 ||           // if first slide and sliding left
                    index == slides.length - 1 &&     // or if last slide and sliding right
                    delta.x < 0                       // and if sliding at all
                ) ?
                ( Math.abs(delta.x) / width + 1 )      // determine resistance level
                : 1 );                                 // no resistance if false

            // translate 1:1
            translate(index-1, delta.x + slidePos[index-1], 0);
            translate(index, delta.x + slidePos[index], 0);
            translate(index+1, delta.x + slidePos[index+1], 0);
            updateMainScrollbar(index, delta.x + slidePos[index], 0);

        }

      },
      end: function() {

        // measure duration
        var duration = Date.now() - start.time;

        // determine if slide attempt triggers next/prev slide
        var isValidSlide =
              Number(duration) < 250 &&         // if slide duration is less than 250ms
              Math.abs(delta.x) > 20 ||         // and if slide amt is greater than 20px
              Math.abs(delta.x) > width/2;      // or if slide amt is greater than half the width

        // determine if slide attempt is past start and end
        var isPastBounds =
              !index && delta.x > 0 ||                       // if first slide and slide amt is greater than 0
               index == slides.length - 1 && delta.x < 0;    // or if last slide and slide amt is less than 0

        // determine direction of swipe (true:right, false:left)
        var direction = delta.x < 0;

        // if not scrolling vertically
        if (!isScrolling) {

          if (isValidSlide && !isPastBounds) {

            if (direction) {

              if(twoTouches){
                goToPage(pageAmount);
              }
              else{
                move(index-1, -width, 0);

                move(index, slidePos[index]-width, speed);
                updateMainScrollbar(index, -width, speed);
                move(circle(index+1), slidePos[circle(index+1)]-width, speed);
                index = circle(index+1);
              }

            } else {

              if(twoTouches){
                goToPage(1);
              }
              else{
                move(index+1, width, 0);

                move(index, slidePos[index]+width, speed);
                updateMainScrollbar(index, width, speed);
                move(circle(index-1), slidePos[circle(index-1)]+width, speed);
                index = circle(index-1);
              }
            }

            options.callback && options.callback(index, slides[index]);

          } else {

              move(index-1, -width, speed);
              move(index, 0, speed);
              updateMainScrollbar(index, 0, speed);
              move(index+1, width, speed);

          }

        }

        // kill touchmove and touchend event listeners until touchstart called again
        stWrap.removeEventListener('touchmove', events, false);
        stWrap.removeEventListener('touchend', events, false);

      },
      transitionEnd: function(event) {

        if (parseInt(event.target.getAttribute('data-index'), 10) == index) {

          options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

        }

      }

    };

    var scrollStart = {};
    var scrollDelta = {};
    var scrollOffset;
    var scrollIsScrolling;

    // setup scroll event capturing
    var scrollEvents = {

      handleEvent: function(event) {

        switch (event.type) {
          case 'touchstart': this.start(event); break;
          case 'touchmove': this.move(event); break;
          case 'touchend': offloadFn(this.end(event)); break;
        }

        if (options.stopPropagation){
          event.stopPropagation();
        }

      },
      start: function(event) {

        event.preventDefault();

        var touches = event.touches[0];

        // measure start values
        scrollStart = {

          // get initial touch coords
          x: touches.pageX,
          y: touches.pageY,

          // store time to determine touch duration
          time: Date.now()

        };

        // used for testing first move event
        scrollIsScrolling = undefined;

        // reset delta and end measurements
        scrollDelta = {};

        scrollOffset = updateScroll.getPosition();

        // attach touchmove and touchend listeners
        headerScroll.addEventListener('touchmove', this, false);
        headerScroll.addEventListener('touchend', this, false);

      },
      move: function(event) {

        var scrollTotal;

        // ensure swiping with one touch and not pinching
        if ( event.touches.length > 1 || event.scale && event.scale !== 1){
          return;
        }

        // prevent native scrolling
        event.preventDefault();

        var touches = event.touches[0];

        // measure change in x and y
        scrollDelta = {
          x: touches.pageX - scrollStart.x,
          y: touches.pageY - scrollStart.y
        };

        // determine if scrolling test has run - one time test
        if ( typeof scrollIsScrolling == 'undefined') {
          scrollIsScrolling = !!( scrollIsScrolling || Math.abs(scrollDelta.x) < Math.abs(scrollDelta.y) );
        }

        // if user is not trying to scroll vertically
        if (!scrollIsScrolling) {

          // increase resistance if first or last slide

            scrollTotal = -scrollDelta.x + scrollOffset;

            if (scrollTotal < 0){
              scrollTotal = 0;
            }
            else if (scrollTotal > headerScroll.scrollWidth - headerScroll.getBoundingClientRect().width){
              scrollTotal = headerScroll.scrollWidth - headerScroll.getBoundingClientRect().width;
            }

            updateScroll.setPosition(scrollTotal);
            translate(null, -scrollTotal, 0, headerScroll);
            updateScroll.update();

        }

      },
      end: function() {

        event.preventDefault();

        // kill touchmove and touchend event listeners until touchstart called again
        headerScroll.removeEventListener('touchmove', scrollEvents, false);
        headerScroll.removeEventListener('touchend', scrollEvents, false);

      }

    };

    // trigger setup
    setup();


    // add event listeners
    if (browser.addEventListener) {

      // set touchstart event on element
      if (browser.touch){
        stWrap.addEventListener('touchstart', events, false);
        headerScroll.addEventListener('touchstart', scrollEvents, false);
      }

      if (browser.transitions) {
        stWrap.addEventListener('webkitTransitionEnd', events, false);
        stWrap.addEventListener('msTransitionEnd', events, false);
        stWrap.addEventListener('oTransitionEnd', events, false);
        stWrap.addEventListener('otransitionend', events, false);
        stWrap.addEventListener('transitionend', events, false);
      }

      // set resize event on window
      window.addEventListener('resize', events, false);

    } else {

      window.onresize = function () { setup(); }; // to play nice with old IE

    }

    // expose the Swipe API
    return {
      setup: function() {

        setup();

      },
      slide: function(to, speed) {

        slide(to, speed);

      },
      prev: function() {

        prev();

      },
      next: function() {

        next();

      },
      getPos: function() {

        // return current index position
        return index;

      },
      getNumSlides: function() {

        // return total number of slides
        return length;
      },
      prepareForAddition: function(newElement) {

        // style an addition to the slides
        translate(null, width , 0, newElement);
        newElement.style.width = width + 'px';
        newElement.style.left = (length * -width) + 'px';

        stWrap.style.width = (function(){
          var w = parseInt(stWrap.style.width, 10) / length;
          w *= (length + 1);
          return (w + 'px');
        }());
      },
      kill: function() {

        // reset element
        stWrap.style.width = 'auto';
        stWrap.style.left = 0;

        // reset slides
        var pos = slides.length;
        while(pos--) {

          var slide = slides[pos];
          slide.style.width = '100%';
          slide.style.left = 0;

          if (browser.transitions) {
            translate(pos, 0, 0);
          }

        }

        // removed event listeners
        if (browser.addEventListener) {

          // remove current event listeners
          stWrap.removeEventListener('touchstart', events, false);
          headerScroll.removeEventListener('touchstart', scrollEvents, false);
          stWrap.removeEventListener('webkitTransitionEnd', events, false);
          stWrap.removeEventListener('msTransitionEnd', events, false);
          stWrap.removeEventListener('oTransitionEnd', events, false);
          stWrap.removeEventListener('otransitionend', events, false);
          stWrap.removeEventListener('transitionend', events, false);
          window.removeEventListener('resize', events, false);

        }
        else {

          window.onresize = null;

        }

      }

    };
  }

  var createSwipe = function(){

    var doNextPage = nextPage.bind(this);
    var doPreviousPage = previousPage.bind(this);
    var doResolveTheResolver = resolveTheResolver.bind(this);
    var doPushDeferred = pushDeferred.bind(this);
    var doUpdateHeader = updateHeader.bind(this);
    var doUpdate = update.bind(this);

    swipeReference = new Swipe({
      callback: function(currentIndex, element){
        var nextElement = element.nextElementSibling;
        var previousElement = element.previousElementSibling;
        var nextOldElement;
        var prevOldElement;

        if(nextElement){

          doNextPage();

          nextOldElement = nextElement.nextElementSibling;

          if(nextOldElement){
            nextOldElement.setAttribute('data-active', 'false');
          }
        }

        if(previousElement){

          doPreviousPage();

          prevOldElement = previousElement.previousElementSibling;

          if(prevOldElement){
            prevOldElement.setAttribute('data-active', 'false');
          }
        }

        if(!nextElement || !previousElement){
          doPushDeferred(currentIndex).then(
            function(value){
              doUpdate(value[0],value[1]);
            }
          );
        }

        doUpdateHeader(element);
      },
      transitionEnd: function(currentIndex, element){
        doResolveTheResolver(currentIndex, element);
      }
    });
  };

  var resolveTheResolver = function(theIndex, theValue){
    deferredContainer.forEach(function(value, index){
      deferredContainer[index].resolver.resolve([theIndex, theValue]);
    });
  };

  var pushDeferred = function(index){
    deferredContainer[index] = when.defer();
    return deferredContainer[index].promise;
  };

  /*-------------- Navigate --------------*\
  \*--------------          --------------*/

  var nextPage = function(){
    var index = swipeReference.getPos();

    deferredContainer[index + 1] = when.defer();

    if (stWrap.children.item(index + 1).getAttribute('data-timestamp') == timestamp){

      deferredContainer[index + 1].promise.then(
          function(value){
          stWrap.children.item(index + 1).setAttribute('data-active', 'true');
          update(value[0],value[1]);
          }
        );
    }
    else{

      var pagePromise = getPageFromIndex(index + 1);

      when.all([pagePromise, deferredContainer[index + 1].promise])
      .then(
        function(values){
          stWrap.children.item(index + 1).innerHTML = values[0].innerHTML;
          stWrap.children.item(index + 1).setAttribute('data-active', 'true');
          stWrap.children.item(index + 1).setAttribute('data-timestamp', timestamp);
          update(values[1][0],values[1][1]);
        }
      );
    }
  };

  var previousPage = function(){
    var index = swipeReference.getPos();

    deferredContainer[index - 1] = when.defer();

    if (stWrap.children.item(index - 1).getAttribute('data-timestamp') == timestamp){

      deferredContainer[index - 1].promise.then(
          function(value){
          stWrap.children.item(index - 1).setAttribute('data-active', 'true');
          update(value[0],value[1]);
          }
        );
    }
    else{

      var pagePromise = getPageFromIndex(index - 1);

      when.all([pagePromise, deferredContainer[index - 1].promise])
      .then(
        function(values){
          stWrap.children.item(index - 1).innerHTML = values[0].innerHTML;
          stWrap.children.item(index - 1).setAttribute('data-active', 'true');
          stWrap.children.item(index - 1).setAttribute('data-timestamp', timestamp);
          update(values[1][0],values[1][1]);
        }
      );
    }
  };

  var goToPage = function(page){

    deferredContainer[page - 1] = when.defer();

    if (stWrap.children.item(page - 1).getAttribute('data-timestamp') == timestamp){

      swipeReference.slide(page-1);
      deferredContainer[page - 1].promise.then(
          function(value){
            stWrap.children.item(page - 1).setAttribute('data-active', 'true');
            update(value[0],value[1]);
          }
        );
    }
    else{

      getPageFromIndex(page-1).then(
        function(value){
          stWrap.children.item(page-1).innerHTML = value.innerHTML;
          stWrap.children.item(page-1).setAttribute('data-active', 'true');
          stWrap.children.item(page-1).setAttribute('data-timestamp', timestamp);
          return when.resolve();
        }
      ).then(
        function(){
          swipeReference.slide(page-1);
          deferredContainer[page - 1].promise.then(
            function(value){
              update(value[0],value[1]);
            });
        }
      );
    }
  };

  var getPageFromIndex = function(index){

    var dataDeferred = when.defer();
    var table;

    if(sortColumn === undefined){
      makeRequest(
        dataProvider,
        {
          page: index + 1,
          timestamp: timestamp
        },
        dataDeferred.resolver
      );
    }
    else{
      makeRequest(
        dataProvider,
        {
          page: index + 1,
          sortField: sortColumn,
          sortAsc: sortAscending
        },
        dataDeferred.resolver
      );
    }

    table = createTable();

    var tablePromise = dataDeferred.promise.then(
      function(value){
        return fillTable(table, value);
      }
    );

    return tablePromise;
  };

  /*--------------- Update ---------------*\
  \*---------------        ---------------*/

  var update = function(index, element){
    updateHeader(element);
    updateHeaderScrollbar();
    updateScroll.updateScrollables();
  };

  /**
   * Read widths of given element and adjust header spacing
   * @param  {Object} element Element to read from
   */
  var updateHeader = function(element){
    var i, l;

    if (element){
      // Store element so we can reference on window.resize
      currentIndexElement = element;
    }

    // Select the first row of the element
    var tableRow = currentIndexElement.querySelector(".st-scrollable tr");
    l = tableRow.children.length;
    var cellWidths = [];

    for (i=0; i < l; i+=1){
      var w = tableRow.children[i].getBoundingClientRect().width;
      w = parseInt(w, 10);
      w -= rowSizes.bodyCellPadding;
      cellWidths.push(w);
    }

    var scrollContainer = container.querySelector('.st-header .st-scrollable tr');

    cellWidths.forEach(function(value, index){
      scrollContainer.children[index].style.width = value + 'px';
    });
  };

  var updateMainScrollbar = function(index, dist, speed){
    var style = mainScrollbar.firstChild.style;
    var indicator = mainScrollbar.firstChild;

    if (dist !== undefined){

      dist /= pageAmount;
      dist *= -1;
      dist += (index * width)/pageAmount;

      translate(null, dist, speed, indicator);
    }

    style.width = ( 100 / pageAmount) + '%';
  };

  var updateHeaderScrollbar = function(){
    var scrollbar = headerScrollbar;
    var indicator = headerScrollbar.firstChild;
    var parent = headerScrollbar.parentElement;

    var ratio = parent.getBoundingClientRect().width / parent.scrollWidth;
    var position = updateScroll.getPosition();

    var stScrollableWrap = container.querySelector('.st-header .st-scrollable-wrap');

    if (ratio > 0.99){
      scrollbar.style.visibility =
      indicator.style.visibility = 'hidden';
      stScrollableWrap.className = 'st-scrollable-wrap';
    }
    else{
      scrollbar.style.visibility =
      indicator.style.visibility = 'visible';
      stScrollableWrap.className = 'st-scrollable-wrap st-shadow';
    }

    indicator.style.width = ratio * 100 + '%';

    translate(null, position, 0, scrollbar);

    position = position * ratio;

    translate(null, position, 0, indicator);
  };

  var updateScroll = (function(){
    var position;
    var frameRequested = false;

    return {
      getPosition : function(){
        return position;
      },
      setPosition : function(newPos){
        position = newPos;
      },
      update : function(){
        if(!frameRequested){
          var doUpdateScrollables = updateScroll.updateScrollables.bind(this);
          var doUpdateHeaderScrollbar = updateHeaderScrollbar.bind(this);
          var doFrameRequested = updateScroll.frameRequested.bind(this);
          frameRequested = true;

          window.requestAnimationFrame(function(){
            doUpdateHeaderScrollbar();
            doUpdateScrollables();
            doFrameRequested(false);
          });
        }
      },
      updateScrollables : function(){
        var targets = container.querySelector('.st-wrap').querySelectorAll('.st-table-wrap[data-active=true] .st-scrollable');

        var i = 0;
        for(i;i<targets.length;i+=1){
          translate(null, -position, 0, targets[i]);
        }
      },
      frameRequested : function(isRequested){
        if (typeof isRequested !== 'undefined' && typeof isRequested === 'boolean'){
          frameRequested = isRequested;
        }
        return frameRequested;
      }
    };
  }());

  var swipeFunc = {
    next : function(){
      if (swipeReference !== undefined)
      {
        swipeReference.next();
      }
    },
    prev : function(){
      if (swipeReference !== undefined)
      {
        swipeReference.prev();
      }
    }
  };

  init();
};

},{"./../../bower_components/bouncefix.js/lib/bouncefix.js":1,"./..\\..\\bower_components\\fastclick\\lib\\fastclick.js":2,"./..\\..\\bower_components\\when\\when.js":3}]},{},[5])
(5)
});
;