!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.SwipeTable=e():"undefined"!=typeof global?global.SwipeTable=e():"undefined"!=typeof self&&(self.SwipeTable=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"__browserify_process":2}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
var when = require("./..\\..\\bower_components\\when\\when.js");

module.exports = function(dataProviderUrl, tableKeys, elem, options){
  "use strict";
  /**
   * Config
   *
   * Use the following format to call SwipeTable
   *----------------------------------------
   *  (function(root){
   *
   *    var restApiUrl = '/api';
   *    var keys = [
   *        "id", // this is the 'pinned' column
   *        "time",
   *        "time2",
   *        "location",
   *        "location2"
   *    ];
   *    var stElem = document.getElementsByClassName('swipe-table')[0];
   *
   *    root.SwipeTable = new SwipeTable(restApiUrl, keys, stElem);
   *
   *  }(this));
   *----------------------------------------
   */

  //=== Variables ===
  // Check and store parameters
  var dataProvider;
  var keys;
  var container;

  if(typeof dataProviderUrl === 'string'){
    dataProvider = dataProviderUrl;
  }
  else{
    throw new TypeError('First parameter is not a string');
  }

  if(tableKeys instanceof Array){
    keys = tableKeys;
  }
  else{
    throw new TypeError('Second parameter is not an array');
  }

  //TODO: Check element type in different browsers
  //Chrome: 'object'
  //Firefox:
  //IE:
  container = elem;

  var stWrap;
  var currentIndexElement;

  var swipeReference;
  var deferredContainer = {};
  deferredContainer.deferred = when.defer();

  var tableClass    = 'table';
  tableClass += ' table-condensed';
  var doneTables    = 0;
  var totalTables   = 0;
  var pageSize      = 1;
  var pageAmount;
  var headerHeight  = 50;
  var scrollbarHeight = 5;
  var controlHeight = 50;
  var sortAscending = true;
  var sortColumn;
  var timestamp;

  var headerScrollbar;
  var mainScrollbar;

  var controls;

  options = options || {};

  if(typeof options.fullscreen !== 'boolean'){
    // Use default
    options.fullscreen = true;
  }

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

  var slides, slidePos, width, length;

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

        // reset delta and end measurements
        delta = {};

        // attach touchmove and touchend listeners
        stWrap.addEventListener('touchmove', this, false);
        stWrap.addEventListener('touchend', this, false);

      },
      move: function(event) {

        // ensure swiping with one touch and not pinching
        if ( event.touches.length > 1 || event.scale && event.scale !== 1){
          return;
        }

        if (options.disableScroll){
          event.preventDefault();
        }

        var touches = event.touches[0];

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

                move(index-1, -width, 0);

              move(index, slidePos[index]-width, speed);
              updateMainScrollbar(index, -width, speed);
              move(circle(index+1), slidePos[circle(index+1)]-width, speed);
              index = circle(index+1);

            } else {
                move(index+1, width, 0);

              move(index, slidePos[index]+width, speed);
              updateMainScrollbar(index, width, speed);
              move(circle(index-1), slidePos[circle(index-1)]+width, speed);
              index = circle(index-1);

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
      }

    };

  }

  //=== Functions ===

  /**
   * Fetch the viewport size and set the
   * pageSize(num of rows) based on rowHeight
   */
  var init = function(){
    var tableHeight;
    var rowHeights;
    var dataDeferred = when.defer();
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

    rowHeights = testRowHeights();

    // Add margin for proper spacing of elements
    stWrap.style.marginTop = headerHeight - rowHeights.header + 'px';

    // Remove height for other elements
    tableHeight -= headerHeight;

    tableHeight -= scrollbarHeight;

    tableHeight -= controlHeight;

    pageSize = Math.floor(tableHeight / rowHeights.body);

    makeRequest(
      dataProvider,
      {},
      dataDeferred.resolver);

    var tablePromise = dataDeferred.promise.then(
      function(value){
        return fillTable(dataTable, value);
      }
    );

    tablePromise.then(
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
        stWrap.appendChild(value);

        // Fill with placeholders so that first and last will
        // function as expected. This also results in less calls
        // needed to swipeReference.setup()
        for (i = 1; i < pageAmount; i+=1){
          stWrap.appendChild(stTableWraps[i-1]);
        }

        tableDone();
        updateMainScrollbar(0);
        updateHeaderScrollbar();

        var headerStyles = container.querySelectorAll('.st-header .st-scrollable > div');
        console.log(headerStyles);
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

    createHeader();

    var doUpdateHeader = updateHeader.bind(this);
    var doUpdateHeaderScrollbar = updateHeaderScrollbar.bind(this);

    window.addEventListener('resize', function(){
      doUpdateHeader();
      doUpdateHeaderScrollbar();
    });

    mainScrollbar = createScrollbar();
    headerScrollbar = createScrollbar();

    container.appendChild(mainScrollbar);
    container.querySelector('.st-header .st-scrollable').appendChild(headerScrollbar);

    controls = createControls();

  };

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

  var testRowHeights = function(){
    var headHeight;
    var bodyHeight;
    var totalHeight;
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

    head.appendChild(text);
    row.appendChild(head);
    tHead.appendChild(row);
    table.appendChild(tHead);

    data.appendChild(text2);
    row2.appendChild(data);
    tBody.appendChild(row2);
    table.appendChild(tBody);

    stWrap.appendChild(table);

    headHeight = row.getBoundingClientRect().height;

    bodyHeight = row2.getBoundingClientRect().height;

    totalHeight = table.getBoundingClientRect().height;
    //TODO: Determine effects of borders on table size
    //
    stWrap.innerHTML = '';

    return {
      header : headHeight,
      body: bodyHeight,
      total: totalHeight
    };
  };

  var createHeader = function(){
    var i;
    var l;

    var header = document.createElement('div');
    header.className = 'st-header';

    var stScrollable = document.createElement("div");
    stScrollable.className = 'st-scrollable';
    var stScrollableWrap = stScrollable.cloneNode(true);
    stScrollableWrap.className += '-wrap';

    for (i = 1, l = keys.length; i < l; i+=1){
      var headerDiv = document.createElement("div");
      headerDiv.appendChild(document.createTextNode(keys[i]));
      stScrollable.appendChild(headerDiv);
    }

    var headerPinned = document.createElement("div");
    headerPinned.appendChild(document.createTextNode(keys[0]));
    headerPinned.className = 'st-pinned';

    stScrollableWrap.appendChild(stScrollable);

    header.appendChild(stScrollableWrap);
    header.appendChild(headerPinned);
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

    var buttonGlyphs  = ['<<', '<', '>', '>>'];
    var events = ['first', 'previous', 'next', 'last'];
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

  /**
   * Takes an object that contains:
   * REQ* server: address of the API
   * REQ* pageSize
   * REQ* table: container to attach the results to
   *    * page
   *    * timestamp
   *    * sortField
   *    * sortAsc
   * Items marked with REQ are required or the request will fail.
   *
   * Fetches according to parameters given
   * and gives results + table to parseResponse.
   * @param {Object}queries Object containing quieries
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
      executeRequest("GET",
                      server +
                        "?ps=" + pageSize,
                      resolver);
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

  /**
   * Creates a table with appropriate headers(thead).
   *
   * Increments totalTables.
   *
   * Returns a partial table.
   */
  var createTable = (function(){
    var tableInstance;

    return function(){

      if(tableInstance){
        totalTables += 1;
        var copy = tableInstance.cloneNode(true);
        return copy;
      }
      else{
        var i;
        var l;

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
        totalTables += 1;
        return table;
      }
    };
  }());

  /**
   * Goes through dataSet and attaches rows to
   * the table reference, then attaches the
   * table to the container in the DOM.
   *
   * Calls tableDone() when done.
   * @param table Partial table to fill
   * @param dataSet Parsed data to fill with
   */
  var fillTable = function(table, dataSet){
    timestamp = dataSet.timestamp;
    pageAmount = dataSet.pages;
    var numRows = dataSet.data.length;

    if(numRows === 0){
      return;
    }

    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    var i = 0;
    while (i < numRows){
      var col = dataSet.data[i];
      var tr = document.createElement("tr");
      var colCells = Object.keys(col).length;

      var j = 0;
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

    // Prestyle the table so everything fits nicely when insterted
    if(swipeReference !== undefined){
      // swipeReference.prepareForAddition(stTableWrap);
    }

    return when.resolve(stTableWrap);
  };

  /**
   *  Increments doneTables and executes if equal to totalTables.
   *  Checks if mySwipe is made and if it isn't,
   *  makes it and gives arguments to mySwipe.
   *  If it's the first table to be finished,
   *  sets up the next one to be fetched and placed,
   *  also updates the header.
   *
   *  If mySwipe was already made, calls mySwipe.setup.
   */
  var tableDone = function(){
    doneTables += 1;

    if (doneTables === totalTables){
      if(swipeReference === undefined){
        var doNextPage = nextPage.bind(this);
        var doPreviousPage = previousPage.bind(this);
        var doResolveTheResolver = resolveTheResolver.bind(this);

        swipeReference = new Swipe({
          callback: function(currentIndex, element){
            var nextElement = element.nextElementSibling;
            var previousElement = element.previousElementSibling;
            var nextOldElement;
            var prevOldElement;

            if(nextElement){

              if (nextElement.getAttribute('data-active') === 'false'){
                doNextPage();
              }

              nextOldElement = nextElement.nextElementSibling;

              if(nextOldElement){
                nextOldElement.setAttribute('data-active', 'false');
              }
            }

            if(previousElement){

              if (previousElement.getAttribute('data-active') === 'false'){
                doPreviousPage();
              }

              prevOldElement = previousElement.previousElementSibling;

              if(prevOldElement){
                prevOldElement.setAttribute('data-active', 'false');
              }
            }

          },
          transitionEnd: function(currentIndex, element){
            doResolveTheResolver([currentIndex, element]);
          }
        });

        if(doneTables === 1){
          nextPage();
          deferredContainer.deferred.resolver.resolve();
          updateHeader(container.querySelector('.st-table-wrap'));
        }
      }

    }
  };

  var resolveTheResolver = function(value){
    deferredContainer.deferred.resolver.resolve(value);
  };

  var nextPage = function(){
    var index = swipeReference.getPos();

    deferredContainer.deferred = when.defer();

    var pagePromise = getPageFromIndex(index + 1);

    when.all([pagePromise, deferredContainer.deferred.promise])
    .then(
      function(values){
        stWrap.children.item(index + 1).innerHTML = values[0].innerHTML;
        stWrap.children.item(index + 1).setAttribute('data-active', 'true');
        update(values[1][0],values[1][1]);
        tableDone();
      }
    );

  };

  var previousPage = function(){
    var index = swipeReference.getPos();

    deferredContainer.deferred = when.defer();

    var pagePromise = getPageFromIndex(index - 1);

    when.all([pagePromise, deferredContainer.deferred.promise])
    .then(
      function(values){
        stWrap.children.item(index - 1).innerHTML = values[0].innerHTML;
        stWrap.children.item(index - 1).setAttribute('data-active', 'true');
        update(values[1][0],values[1][1]);
        tableDone();
      }
    );

  };

  var goToPage = function(page){

    getPageFromIndex(page-1).then(
      function(value){
        stWrap.children.item(page-1).innerHTML = value.innerHTML;
        stWrap.children.item(page-1).setAttribute('data-active', 'true');
        return when.resolve();
      }
    ).then(
      function(){
        swipeReference.slide(page-1);
        deferredContainer.deferred.promise.then(
          function(value){
            update(value[0],value[1]);
          });
      }
    );

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

  /**
   * Read widths of given element and adjust header spacing
   * @param  {Object} element Element to read from
   */
  var updateHeader = function(element){
    var i;

    if (element){
      // Store element so we can reference on window.resize
      currentIndexElement = element;
    }

    // Select the first row of the element
    var tableRow = currentIndexElement.querySelector(".st-scrollable tr");
    var l = tableRow.children.length;
    var cellWidths = [];

    for (i=1; i < l; i+=1){
      var w = tableRow.children[i].getBoundingClientRect().width;
      w = parseInt(w, 10);
      cellWidths.push(w);
    }

    var scrollContainer = container.querySelector('.st-header .st-scrollable');

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

    indicator.style.width = ratio * 100 + '%';

    translate(null, position, 0, scrollbar);

    position = position * ratio;

    translate(null, position, 0, indicator);
  };

  var update = function(index, element){
    updateHeader(element);
    updateHeaderScrollbar();
    updateScroll.updateScrollables();
  };

  /**
   * Exposes scroll positions to the outside
   * and function to update all scrollables.
   */
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

  //=== Logic ===
  init();

  var methods = {
    // Expose test object to test inner functions
    test : {
      init : init,
      makeRequest : makeRequest,
      executeRequest :executeRequest,
      parseResponse : parseResponse,
      createTable : createTable,
      fillTable : fillTable,
      tableDone : tableDone,
      updateHeader : updateHeader,
      updateScroll: updateScroll
    },
    nextPage : nextPage,
    updateHeader : updateHeader,
    getScrollPosition : updateScroll.getPosition,
    setScrollPosition : updateScroll.setPosition,
    updateScrollables : updateScroll.updateScrollables,
    next : swipeFunc.next,
    prev : swipeFunc.prev
  };

  return methods;
};
/* exported SwipeTable */

},{"./..\\..\\bower_components\\when\\when.js":1}]},{},[3])
(3)
});
;