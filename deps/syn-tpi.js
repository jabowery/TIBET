/**
 * Syn - 0.0.2
 * 
 * @copyright 2017 Bitovi
 * Tue, 19 Dec 2017 22:30:50 GMT
 * @license MIT
 */

!function(window) {

// ## src/synthetic.js
var __m2 = (function () {
	//allow for configuration of Syn
	var opts = window.Syn ? window.Syn : {};

	var extend = function (d, s) {
		var p;
		for (p in s) {
			d[p] = s[p];
		}
		return d;
	},
		// only uses browser detection for key events
		browser = {
			msie: !! (window.attachEvent && !window.opera),
			opera: !! window.opera,
			webkit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
			safari: navigator.userAgent.indexOf('AppleWebKit/') > -1 && navigator.userAgent.indexOf('Chrome/') === -1,
			gecko: navigator.userAgent.indexOf('Gecko') > -1,
			mobilesafari: !! navigator.userAgent.match(/Apple.*Mobile.*Safari/),
			rhino: navigator.userAgent.match(/Rhino/) && true
		},
		createEventObject = function (type, options, element) {
			var event = element.ownerDocument.createEventObject();
			return extend(event, options);
		},
		data = {},
		id = 1,
		expando = "_synthetic" + new Date()
			.getTime(),
		bind, unbind, schedule, key = /keypress|keyup|keydown/,
		page = /load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll/,
		//this is maintained so we can click on html and blur the active element
		activeElement,

		/**
		 * @class Syn
		 * @download funcunit/dist/syn.js
		 * @test funcunit/synthetic/qunit.html
		 * Syn is used to simulate user actions.  It creates synthetic events and
		 * performs their default behaviors.
		 * 
		 * <h2>Basic Use</h2>
		 * The following clicks an input element with <code>id='description'</code>
		 * and then types <code>'Hello World'</code>.
		 * 
		 @codestart
		 Syn.click({},'description')
		 .type("Hello World")
		 @codeend
		 * <h2>User Actions and Events</h2>
		 * <p>Syn is typically used to simulate user actions as opposed to triggering events. Typing characters
		 * is an example of a user action.  The keypress that represents an <code>'a'</code>
		 * character being typed is an example of an event. 
		 * </p>
		 * <p>
		 *   While triggering events is supported, it's much more useful to simulate actual user behavior.  The 
		 *   following actions are supported by Syn:
		 * </p>
		 * <ul>
		 *   <li><code>[Syn.prototype.click click]</code> - a mousedown, focus, mouseup, and click.</li>
		 *   <li><code>[Syn.prototype.dblclick dblclick]</code> - two <code>click!</code> events followed by a <code>dblclick</code>.</li>
		 *   <li><code>[Syn.prototype.key key]</code> - types a single character (keydown, keypress, keyup).</li>
		 *   <li><code>[Syn.prototype.type type]</code> - types multiple characters into an element.</li>
		 *   <li><code>[Syn.prototype.move move]</code> - moves the mouse from one position to another (triggering mouseover / mouseouts).</li>
		 *   <li><code>[Syn.prototype.drag drag]</code> - a mousedown, followed by mousemoves, and a mouseup.</li>
		 * </ul>
		 * All actions run asynchronously.  
		 * Click on the links above for more 
		 * information on how to use the specific action.
		 * <h2>Asynchronous Callbacks</h2>
		 * Actions don't complete immediately. This is almost 
		 * entirely because <code>focus()</code> 
		 * doesn't run immediately in IE.
		 * If you provide a callback function to Syn, it will 
		 * be called after the action is completed.
		 * <br/>The following checks that "Hello World" was entered correctly: 
		 @codestart
		 Syn.click({},'description')
		 .type("Hello World", function(){
		 
		 ok("Hello World" == document.getElementById('description').value)  
		 })
		 @codeend
		 <h2>Asynchronous Chaining</h2>
		 <p>You might have noticed the [Syn.prototype.then then] method.  It provides chaining
		 so you can do a sequence of events with a single (final) callback.
		 </p><p>
		 If an element isn't provided to then, it uses the previous Syn's element.
		 </p>
		 The following does a lot of stuff before checking the result:
		 @codestart
		 Syn.type('ice water','title')
		 .type('ice and water','description')
		 .click({},'create')
		 .drag({to: 'favorites'},'newRecipe',
		 function(){
		 ok($('#newRecipe').parents('#favorites').length);
		 })
		 @codeend
		 
		 <h2>jQuery Helper</h2>
		 If jQuery is present, Syn adds a triggerSyn helper you can use like:
		 @codestart
		 $("#description").triggerSyn("type","Hello World");
		 @codeend
		 * <h2>Key Event Recording</h2>
		 * <p>Every browser has very different rules for dispatching key events.  
		 * As there is no way to feature detect how a browser handles key events,
		 * synthetic uses a description of how the browser behaves generated
		 * by a recording application.  </p>
		 * <p>
		 * If you want to support a browser not currently supported, you can
		 * record that browser's key event description and add it to
		 * <code>Syn.key.browsers</code> by it's navigator agent.
		 * </p>
		 @codestart
		 Syn.key.browsers["Envjs\ Resig/20070309 PilotFish/1.2.0.10\1.6"] = {
		 'prevent':
		 {"keyup":[],"keydown":["char","keypress"],"keypress":["char"]},
		 'character':
		 { ... }
		 }
		 @codeend
		 * <h2>Limitations</h2>
		 * Syn fully supports IE 6+, FF 3+, Chrome, Safari, Opera 10+.
		 * With FF 1+, drag / move events are only partially supported. They will
		 * not trigger mouseover / mouseout events.<br/>
		 * Safari crashes when a mousedown is triggered on a select.  Syn will not 
		 * create this event.
		 * <h2>Contributing to Syn</h2>
		 * Have we missed something? We happily accept patches.  The following are 
		 * important objects and properties of Syn:
		 * <ul>
		 * <li><code>Syn.create</code> - contains methods to setup, convert options, and create an event of a specific type.</li>
		 *  <li><code>Syn.defaults</code> - default behavior by event type (except for keys).</li>
		 *  <li><code>Syn.key.defaults</code> - default behavior by key.</li>
		 *  <li><code>Syn.keycodes</code> - supported keys you can type.</li>
		 * </ul>
		 * <h2>Roll Your Own Functional Test Framework</h2>
		 * <p>Syn is really the foundation of JavaScriptMVC's functional testing framework - [FuncUnit].
		 *   But, we've purposely made Syn work without any dependencies in the hopes that other frameworks or 
		 *   testing solutions can use it as well.
		 * </p>
		 * @constructor
		 * @signature `Syn(type, options, element, callback)`
		 * Creates a synthetic event on the element.
		 * @param {Object} type
		 * @param {Object} options
		 * @param {Object} element
		 * @param {Object} callback
		 * @return {Syn} returns the Syn object.
		 */
		Syn = function (type, options, element, callback) {
			return (new Syn.init(type, options, element, callback));
		};

	Syn.config = opts;

	// helper for supporting IE8 and below:
	// focus will throw in some circumnstances, like element being invisible
	Syn.__tryFocus = function tryFocus(element) {
		try {
			element.focus();
		} catch (e) {}
	};

	bind = function (el, ev, f) {
		return el.addEventListener ? el.addEventListener(ev, f, false) : el.attachEvent("on" + ev, f);
	};
	unbind = function (el, ev, f) {
		return el.addEventListener ? el.removeEventListener(ev, f, false) : el.detachEvent("on" + ev, f);
	};

	schedule = Syn.config.schedule || function (fn, ms) {
		setTimeout(fn, ms);
	};
	/**
	 * @Static
	 */
	extend(Syn, {
		/**
		 * Creates a new synthetic event instance
		 * @hide
		 * @param {Object} type
		 * @param {Object} options
		 * @param {Object} element
		 * @param {Object} callback
		 */
		init: function (type, options, element, callback) {
			var args = Syn.args(options, element, callback),
				self = this;
			this.queue = [];
			this.element = args.element;

			//run event
			if (typeof this[type] === "function") {
				this[type](args.options, args.element, function (defaults, el) {
					if (args.callback) {
						args.callback.apply(self, arguments);
					}
					self.done.apply(self, arguments);
				});
			} else {
				this.result = Syn.trigger(type, args.options, args.element);
				if (args.callback) {
					args.callback.call(this, args.element, this.result);
				}
			}
		},
		jquery: function (el, fast) {
			if (window.FuncUnit && window.FuncUnit.jQuery) {
				return window.FuncUnit.jQuery;
			}
			if (el) {
				return Syn.helpers.getWindow(el)
					.jQuery || window.jQuery;
			} else {
				return window.jQuery;
			}
		},
		/**
		 * Returns an object with the args for a Syn.
		 * @hide
		 * @return {Object}
		 */
		args: function () {
			var res = {},
				i = 0;
			for (; i < arguments.length; i++) {
				if (typeof arguments[i] === 'function') {
					res.callback = arguments[i];
				} else if (arguments[i] && arguments[i].jquery) {
					res.element = arguments[i][0];
				} else if (arguments[i] && arguments[i].nodeName) {
					res.element = arguments[i];
				} else if (res.options && typeof arguments[i] === 'string') { //we can get by id
					res.element = document.getElementById(arguments[i]);
				} else if (arguments[i]) {
					res.options = arguments[i];
				}
			}
			return res;
		},
		click: function (options, element, callback) {
			Syn('click!', options, element, callback);
		},
		/**
		 * @hide
		 * @attribute defaults
		 * Default actions for events.  Each default function is called with this as its
		 * element.  It should return true if a timeout
		 * should happen after it.  If it returns an element, a timeout will happen
		 * and the next event will happen on that element.
		 */
		defaults: {
			focus: function focus() {
				if (!Syn.support.focusChanges) {
					var element = this,
						nodeName = element.nodeName.toLowerCase();
					Syn.data(element, "syntheticvalue", element.value);

					//TODO, this should be textarea too
					//and this might be for only text style inputs ... hmmmmm ....
					if (nodeName === "input" || nodeName === "textarea") {
						bind(element, "blur", function () {
							if (Syn.data(element, "syntheticvalue") !== element.value) {

								Syn.trigger("change", {}, element);
							}
							unbind(element, "blur", focus);
						});

					}
				}
			},
			submit: function () {
				Syn.onParents(this, function (el) {
					if (el.nodeName.toLowerCase() === 'form') {
						el.submit();
						return false;
					}
				});
			}
		},
		changeOnBlur: function (element, prop, value) {

			bind(element, "blur", function onblur() {
				if (value !== element[prop]) {
					Syn.trigger("change", {}, element);
				}
				unbind(element, "blur", onblur);
			});

		},
		/**
		 * Returns the closest element of a particular type.
		 * @hide
		 * @param {Object} el
		 * @param {Object} type
		 */
		closest: function (el, type) {
			while (el && el.nodeName.toLowerCase() !== type.toLowerCase()) {
				el = el.parentNode;
			}
			return el;
		},
		/**
		 * adds jQuery like data (adds an expando) and data exists FOREVER :)
		 * @hide
		 * @param {Object} el
		 * @param {Object} key
		 * @param {Object} value
		 */
		data: function (el, key, value) {
			var d;
			if (!el[expando]) {
				el[expando] = id++;
			}
			if (!data[el[expando]]) {
				data[el[expando]] = {};
			}
			d = data[el[expando]];
			if (value) {
				data[el[expando]][key] = value;
			} else {
				return data[el[expando]][key];
			}
		},
		/**
		 * Calls a function on the element and all parents of the element until the function returns
		 * false.
		 * @hide
		 * @param {Object} el
		 * @param {Object} func
		 */
		onParents: function (el, func) {
			var res;
			while (el && res !== false) {
				res = func(el);
				el = el.parentNode;
			}
			return el;
		},
		//regex to match focusable elements
		focusable: /^(a|area|frame|iframe|label|input|select|textarea|button|html|object)$/i,
		/**
		 * Returns if an element is focusable
		 * @hide
		 * @param {Object} elem
		 */
		isFocusable: function (elem) {
			var attributeNode;

			// IE8 Standards doesn't like this on some elements
			if (elem.getAttributeNode) {
				attributeNode = elem.getAttributeNode("tabIndex");
			}

			return this.focusable.test(elem.nodeName) ||
				(attributeNode && attributeNode.specified) &&
				Syn.isVisible(elem);
		},
		/**
		 * Returns if an element is visible or not
		 * @hide
		 * @param {Object} elem
		 */
		isVisible: function (elem) {
			return (elem.offsetWidth && elem.offsetHeight) || (elem.clientWidth && elem.clientHeight);
		},
		/**
		 * Gets the tabIndex as a number or null
		 * @hide
		 * @param {Object} elem
		 */
		tabIndex: function (elem) {
			var attributeNode = elem.getAttributeNode("tabIndex");
			return attributeNode && attributeNode.specified && (parseInt(elem.getAttribute('tabIndex')) || 0);
		},
		bind: bind,
		unbind: unbind,
		/**
		 * @function Syn.schedule schedule()
		 * @param {Function} fn Function to be ran
		 * @param {Number} ms Milliseconds to way before calling fn
		 * @signature `Syn.schedule(fn, ms)`
		 * @parent config
		 *
		 * Schedules a function to be ran later.
		 * Must be registered prior to Syn loading, otherwise `setTimeout` will be
		 * used as the scheduler.
		 * @codestart
		 * Syn = {
		 *   schedule: function(fn, ms) {
		 *     Platform.run.later(fn, ms);
		 *   }
		 * };
		 * @codeend
		 */
		schedule: schedule,
		browser: browser,
		//some generic helpers
		helpers: {
			createEventObject: createEventObject,
			createBasicStandardEvent: function (type, defaults, doc) {
				var event;
				try {
					event = doc.createEvent("Events");
				} catch (e2) {
					event = doc.createEvent("UIEvents");
				} finally {
					event.initEvent(type, true, true);
					extend(event, defaults);
				}
				return event;
			},
			inArray: function (item, array) {
				var i = 0;
				for (; i < array.length; i++) {
					if (array[i] === item) {
						return i;
					}
				}
				return -1;
			},
			getWindow: function (element) {
				if (element.ownerDocument) {
					return element.ownerDocument.defaultView || element.ownerDocument.parentWindow;
				}
			},
			extend: extend,
			scrollOffset: function (win, set) {
				var doc = win.document.documentElement,
					body = win.document.body;
				if (set) {
					window.scrollTo(set.left, set.top);

				} else {
					return {
						left: (doc && doc.scrollLeft || body && body.scrollLeft || 0) + (doc.clientLeft || 0),
						top: (doc && doc.scrollTop || body && body.scrollTop || 0) + (doc.clientTop || 0)
					};
				}

			},
			scrollDimensions: function (win) {
				var doc = win.document.documentElement,
					body = win.document.body,
					docWidth = doc.clientWidth,
					docHeight = doc.clientHeight,
					compat = win.document.compatMode === "CSS1Compat";

				return {
					height: compat && docHeight ||
						body.clientHeight || docHeight,
					width: compat && docWidth ||
						body.clientWidth || docWidth
				};
			},
			addOffset: function (options, el) {
				var jq = Syn.jquery(el),
					off;
				if (typeof options === 'object' && options.clientX === undefined && options.clientY === undefined && options.pageX === undefined && options.pageY === undefined && jq) {
					el = jq(el);
					off = el.offset();
					options.pageX = off.left + el.width() / 2;
					options.pageY = off.top + el.height() / 2;
				}
			}
		},
		// place for key data
		key: {
			ctrlKey: null,
			altKey: null,
			shiftKey: null,
			metaKey: null
		},
		//triggers an event on an element, returns true if default events should be run
		/**
		 * Dispatches an event and returns true if default events should be run.
		 * @hide
		 * @param {Object} event
		 * @param {Object} element
		 * @param {Object} type
		 * @param {Object} autoPrevent
		 */
		dispatch: function (event, element, type, autoPrevent) {

			// dispatchEvent doesn't always work in IE (mostly in a popup)
			if (element.dispatchEvent && event) {
				var preventDefault = event.preventDefault,
					prevents = autoPrevent ? -1 : 0;

				//automatically prevents the default behavior for this event
				//this is to protect agianst nasty browser freezing bug in safari
				if (autoPrevent) {
					bind(element, type, function ontype(ev) {
						ev.preventDefault();
						unbind(this, type, ontype);
					});
				}

				event.preventDefault = function () {
					prevents++;
					if (++prevents > 0) {
						preventDefault.apply(this, []);
					}
				};
				element.dispatchEvent(event);
				return prevents <= 0;
			} else {
				try {
					window.event = event;
				} catch (e) {}
				//source element makes sure element is still in the document
				return element.sourceIndex <= 0 || (element.fireEvent && element.fireEvent('on' + type, event));
			}
		},
		/**
		 * @attribute
		 * @hide
		 * An object of eventType -> function that create that event.
		 */
		create: {
			//-------- PAGE EVENTS ---------------------
			page: {
				event: function (type, options, element) {
					var doc = Syn.helpers.getWindow(element)
						.document || document,
						event;
					if (doc.createEvent) {
						event = doc.createEvent("Events");

						event.initEvent(type, true, true);
						return event;
					} else {
						try {
							event = createEventObject(type, options, element);
						} catch (e) {}
						return event;
					}
				}
			},
			// unique events
			focus: {
				event: function (type, options, element) {
					Syn.onParents(element, function (el) {
						if (Syn.isFocusable(el)) {
							if (el.nodeName.toLowerCase() !== 'html') {
								Syn.__tryFocus(el);
								activeElement = el;
							} else if (activeElement) {
								// TODO: The HTML element isn't focasable in IE, but it is
								// in FF.  We should detect this and do a true focus instead
								// of just a blur
								var doc = Syn.helpers.getWindow(element)
									.document;
								if (doc !== window.document) {
									return false;
								} else if (doc.activeElement) {
									doc.activeElement.blur();
									activeElement = null;
								} else {
									activeElement.blur();
									activeElement = null;
								}

							}
							return false;
						}
					});
					return true;
				}
			}
		},
		/**
		 * @attribute support
		 * @hide
		 *
		 * Feature detected properties of a browser's event system.
		 * Support has the following properties:
		 *
		 *   - `backspaceWorks` - typing a backspace removes a character
		 *   - `clickChanges` - clicking on an option element creates a change event.
		 *   - `clickSubmits` - clicking on a form button submits the form.
		 *   - `focusChanges` - focus/blur creates a change event.
		 *   - `keypressOnAnchorClicks` - Keying enter on an anchor triggers a click.
		 *   - `keypressSubmits` - enter key submits
		 *   - `keyCharacters` - typing a character shows up
		 *   - `keysOnNotFocused` - enters keys when not focused.
		 *   - `linkHrefJS` - An achor's href JavaScript is run.
		 *   - `mouseDownUpClicks` - A mousedown followed by mouseup creates a click event.
		 *   - `mouseupSubmits` - a mouseup on a form button submits the form.
		 *   - `radioClickChanges` - clicking a radio button changes the radio.
		 *   - `tabKeyTabs` - A tab key changes tabs.
		 *   - `textareaCarriage` - a new line in a textarea creates a carriage return.
		 *
		 *
		 */
		support: {
			clickChanges: false,
			clickSubmits: false,
			keypressSubmits: false,
			mouseupSubmits: false,
			radioClickChanges: false,
			focusChanges: false,
			linkHrefJS: false,
			keyCharacters: false,
			backspaceWorks: false,
			mouseDownUpClicks: false,
			tabKeyTabs: false,
			keypressOnAnchorClicks: false,
			optionClickBubbles: false,
			ready: 0
		},
		/**
		 * @function Syn.trigger trigger()
		 * @parent actions
		 * @signature `Syn.trigger(type, options, element)`
		 * Creates a synthetic event and dispatches it on the element.
		 * This will run any default actions for the element.
		 * Typically you want to use Syn, but if you want the return value, use this.
		 * @param {String} type
		 * @param {Object} options
		 * @param {HTMLElement} element
		 * @return {Boolean} true if default events were run, false if otherwise.
		 */
		trigger: function (type, options, element) {
			if (!options) {
				options = {};
			}

			var create = Syn.create,
				setup = create[type] && create[type].setup,
				kind = key.test(type) ? 'key' : (page.test(type) ? "page" : "mouse"),
				createType = create[type] || {},
				createKind = create[kind],
				event, ret, autoPrevent, dispatchEl = element;

			//any setup code?
			if (Syn.support.ready === 2 && setup) {
				setup(type, options, element);
			}

			autoPrevent = options._autoPrevent;
			//get kind
			delete options._autoPrevent;

			if (createType.event) {
				ret = createType.event(type, options, element);
			} else {
				//convert options
				options = createKind.options ? createKind.options(type, options, element) : options;

				if (!Syn.support.changeBubbles && /option/i.test(element.nodeName)) {
					dispatchEl = element.parentNode; //jQuery expects clicks on select
				}

				//create the event
				event = createKind.event(type, options, dispatchEl);

				//send the event
				ret = Syn.dispatch(event, dispatchEl, type, autoPrevent);
			}

			if (ret && Syn.support.ready === 2 && Syn.defaults[type]) {
				Syn.defaults[type].call(element, options, autoPrevent);
			}
			return ret;
		},
		eventSupported: function (eventName) {
			var el = document.createElement("div");
			eventName = "on" + eventName;

			var isSupported = (eventName in el);
			if (!isSupported) {
				el.setAttribute(eventName, "return;");
				isSupported = typeof el[eventName] === "function";
			}
			el = null;

			return isSupported;
		}

	});
	/**
	 * @Prototype
	 */
	extend(Syn.init.prototype, {
		/**
		 * @function Syn.then then()
		 * @parent chained
		 * <p>
		 * Then is used to chain a sequence of actions to be run one after the other.
		 * This is useful when many asynchronous actions need to be performed before some
		 * final check needs to be made.
		 * </p>
		 * <p>The following clicks and types into the <code>id='age'</code> element and then checks that only numeric characters can be entered.</p>
		 * <h3>Example</h3>
		 * @codestart
		 * Syn('click',{},'age')
		 *   .then('type','I am 12',function(){
		 *   equals($('#age').val(),"12")
		 * })
		 * @codeend
		 * If the element argument is undefined, then the last element is used.
		 *
		 * @param {String} type The type of event or action to create: "_click", "_dblclick", "_drag", "_type".
		 * @param {Object} options Optiosn to pass to the event.
		 * @param {String|HTMLElement} [element] A element's id or an element.  If undefined, defaults to the previous element.
		 * @param {Function} [callback] A function to callback after the action has run, but before any future chained actions are run.
		 */
		then: function (type, options, element, callback) {
			if (Syn.autoDelay) {
				this.delay();
			}
			var args = Syn.args(options, element, callback),
				self = this;

			//if stack is empty run right away
			//otherwise ... unshift it
			this.queue.unshift(function (el, prevented) {

				if (typeof this[type] === "function") {
					this.element = args.element || el;
					this[type](args.options, this.element, function (defaults, el) {
						if (args.callback) {
							args.callback.apply(self, arguments);
						}
						self.done.apply(self, arguments);
					});
				} else {
					this.result = Syn.trigger(type, args.options, args.element);
					if (args.callback) {
						args.callback.call(this, args.element, this.result);
					}
					return this;
				}
			});
			return this;
		},
		/**
		 * @function Syn.delay delay()
		 * @parent chained
		 * Delays the next command a set timeout.
		 * @param {Number} [timeout]
		 * @param {Function} [callback]
		 */
		delay: function (timeout, callback) {
			if (typeof timeout === 'function') {
				callback = timeout;
				timeout = null;
			}
			timeout = timeout || 600;
			var self = this;
			this.queue.unshift(function () {
				schedule(function () {
					if (callback) {
						callback.apply(self, []);
					}
					self.done.apply(self, arguments);
				}, timeout);
			});
			return this;
		},
		done: function (defaults, el) {
			if (el) {
				this.element = el;
			}
			if (this.queue.length) {
				this.queue.pop()
					.call(this, this.element, defaults);
			}

		},
		/**
		 * @function Syn.click click()
		 * @parent mouse
		 * @signature `Syn.click(options, element, callback, force)`
		 * Clicks an element by triggering a mousedown,
		 * mouseup,
		 * and a click event.
		 * <h3>Example</h3>
		 * @codestart
		 * Syn.click({},'create',function(){
		 *   //check something
		 * })
		 * @codeend
		 * You can also provide the coordinates of the click.
		 * If jQuery is present, it will set clientX and clientY
		 * for you.  Here's how to set it yourself:
		 * @codestart
		 * Syn.click(
		 *     {clientX: 20, clientY: 100},
		 *     'create',
		 *     function(){
		 *       //check something
		 *     })
		 * @codeend
		 * You can also provide pageX and pageY and Syn will convert it for you.
		 * @param {Object} options
		 * @param {HTMLElement} element
		 * @param {Function} callback
		 */
		"_click": function (options, element, callback, force) {
			Syn.helpers.addOffset(options, element);
			Syn.trigger("mousedown", options, element);

			//timeout is b/c IE is stupid and won't call focus handlers
			schedule(function () {
				Syn.trigger("mouseup", options, element);
				if (!Syn.support.mouseDownUpClicks || force) {
					Syn.trigger("click", options, element);
					callback(true);
				} else {
					//we still have to run the default (presumably)
					Syn.create.click.setup('click', options, element);
					Syn.defaults.click.call(element);
					//must give time for callback
					schedule(function () {
						callback(true);
					}, 1);
				}

			}, 1);
		},
		/**
		 * @function Syn.rightClick rightClick()
		 * @parent mouse
		 * @signature `Syn.rightClick(options, element, callback)`
		 * Right clicks in browsers that support it (everyone but opera).
		 * @param {Object} options
		 * @param {Object} element
		 * @param {Object} callback
		 */
		"_rightClick": function (options, element, callback) {
			Syn.helpers.addOffset(options, element);
			var mouseopts = extend(extend({}, Syn.mouse.browser.right.mouseup), options);

			Syn.trigger("mousedown", mouseopts, element);

			//timeout is b/c IE is stupid and won't call focus handlers
			schedule(function () {
				Syn.trigger("mouseup", mouseopts, element);
				if (Syn.mouse.browser.right.contextmenu) {
					Syn.trigger("contextmenu", extend(extend({}, Syn.mouse.browser.right.contextmenu), options), element);
				}
				callback(true);
			}, 1);
		},
		/**
		 * @function Syn.dblclick dblclick()
		 * @parent mouse
		 * @signature `Syn.dblclick(options, element, callback)`
		 * Dblclicks an element.  This runs two [Syn.click click] events followed by
		 * a dblclick on the element.
		 * <h3>Example</h3>
		 * @codestart
		 * Syn.dblclick({},'open')
		 * @codeend
		 * @param {Object} options
		 * @param {HTMLElement} element
		 * @param {Function} callback
		 */
		"_dblclick": function (options, element, callback) {
			Syn.helpers.addOffset(options, element);
			var self = this;
			this._click(options, element, function () {
				schedule(function () {
					self._click(options, element, function () {
						Syn.trigger("dblclick", options, element);
						callback(true);
					}, true);
				}, 2);

			});
		}
	});

	var actions = ["click", "dblclick", "move", "drag", "key", "type", 'rightClick'],
		makeAction = function (name) {
			Syn[name] = function (options, element, callback) {
				return Syn("_" + name, options, element, callback);
			};
			Syn.init.prototype[name] = function (options, element, callback) {
				return this.then("_" + name, options, element, callback);
			};
		},
		i = 0;

	for (; i < actions.length; i++) {
		makeAction(actions[i]);
	}

	return Syn;
})();

// ## src/mouse.js
var __m4 = (function (Syn) {
	//handles mosue events

	var h = Syn.helpers,
		getWin = h.getWindow;

	Syn.mouse = {};
	h.extend(Syn.defaults, {
		mousedown: function (options) {
			Syn.trigger("focus", {}, this);
		},
		click: function () {
			// prevents the access denied issue in IE if the click causes the element to be destroyed
			var element = this,
				href, type, createChange, radioChanged, nodeName, scope;
			try {
				href = element.href;
				type = element.type;
				createChange = Syn.data(element, "createChange");
				radioChanged = Syn.data(element, "radioChanged");
				scope = getWin(element);
				nodeName = element.nodeName.toLowerCase();
			} catch (e) {
				return;
			}
			//get old values

			//this code was for restoring the href attribute to prevent popup opening
			//if ((href = Syn.data(element, "href"))) {
			//	element.setAttribute('href', href)
			//}

			//run href javascript
			if (!Syn.support.linkHrefJS && /^\s*javascript:/.test(href)) {
				//eval js
				var code = href.replace(/^\s*javascript:/, "");

				//try{
				if (code !== "//" && code.indexOf("void(0)") === -1) {
					if (window.selenium) {
						eval("with(selenium.browserbot.getCurrentWindow()){" + code + "}");
					} else {
						eval("with(scope){" + code + "}");
					}
				}
			}

			//submit a form
			if (!(Syn.support.clickSubmits) && (nodeName === "input" &&
					type === "submit") ||
				nodeName === 'button') {

				var form = Syn.closest(element, "form");
				if (form) {
					Syn.trigger("submit", {}, form);
				}

			}
			//follow a link, probably needs to check if in an a.
			if (nodeName === "a" && element.href && !/^\s*javascript:/.test(href)) {
				scope.location.href = href;

			}

			//change a checkbox
			if (nodeName === "input" && type === "checkbox") {

				//if(!Syn.support.clickChecks && !Syn.support.changeChecks){
				//	element.checked = !element.checked;
				//}
				if (!Syn.support.clickChanges) {
					Syn.trigger("change", {}, element);
				}
			}

			//change a radio button
			if (nodeName === "input" && type === "radio") { // need to uncheck others if not checked
				if (radioChanged && !Syn.support.radioClickChanges) {
					Syn.trigger("change", {}, element);
				}
			}
			// change options
			if (nodeName === "option" && createChange) {
				Syn.trigger("change", {}, element.parentNode); //does not bubble
				Syn.data(element, "createChange", false);
			}
		}
	});

	//add create and setup behavior for mosue events
	h.extend(Syn.create, {
		mouse: {
			options: function (type, options, element) {
				var doc = document.documentElement,
					body = document.body,
					center = [options.pageX || 0, options.pageY || 0],
					//browser might not be loaded yet (doing support code)
					left = Syn.mouse.browser && Syn.mouse.browser.left[type],
					right = Syn.mouse.browser && Syn.mouse.browser.right[type];
				return h.extend({
					bubbles: true,
					cancelable: true,
					view: window,
					detail: 1,
					screenX: 1,
					screenY: 1,
					clientX: options.clientX || center[0] - (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc.clientLeft || 0),
					clientY: options.clientY || center[1] - (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc.clientTop || 0),
					ctrlKey: !! Syn.key.ctrlKey,
					altKey: !! Syn.key.altKey,
					shiftKey: !! Syn.key.shiftKey,
					metaKey: !! Syn.key.metaKey,
					button: left && left.button !== null ? left.button : right && right.button || (type === 'contextmenu' ? 2 : 0),
					relatedTarget: document.documentElement
				}, options);
			},
			event: function (type, defaults, element) { //Everyone Else
				var doc = getWin(element)
					.document || document,
					event;
				if (doc.createEvent) {
					try {
						event = doc.createEvent('MouseEvents');
						event.initMouseEvent(type, defaults.bubbles, defaults.cancelable,
							defaults.view, defaults.detail,
							defaults.screenX, defaults.screenY,
							defaults.clientX, defaults.clientY,
							defaults.ctrlKey, defaults.altKey,
							defaults.shiftKey, defaults.metaKey,
							defaults.button, defaults.relatedTarget);
					} catch (e) {
						event = h.createBasicStandardEvent(type, defaults, doc);
					}
					event.synthetic = true;
					return event;
				} else {
					try {
						event = h.createEventObject(type, defaults, element);
					} catch (e) {}

					return event;
				}

			}
		},
		click: {
			setup: function (type, options, element) {
				var nodeName = element.nodeName.toLowerCase();

				//we need to manually 'check' in browser that can't check
				//so checked has the right value
				if (!Syn.support.clickChecks && !Syn.support.changeChecks && nodeName === "input") {
					type = element.type.toLowerCase(); //pretty sure lowercase isn't needed
					if (type === 'checkbox') {
						element.checked = !element.checked;
					}
					if (type === "radio") {
						//do the checks manually 
						if (!element.checked) { //do nothing, no change
							try {
								Syn.data(element, "radioChanged", true);
							} catch (e) {}
							element.checked = true;
						}
					}
				}

				if (nodeName === "a" && element.href && !/^\s*javascript:/.test(element.href)) {

					//save href
					Syn.data(element, "href", element.href);

					//remove b/c safari/opera will open a new tab instead of changing the page
					// this has been removed because newer versions don't have this problem
					//element.setAttribute('href', 'javascript://')
					//however this breaks scripts using the href
					//we need to listen to this and prevent the default behavior
					//and run the default behavior ourselves. Boo!
				}
				//if select or option, save old value and mark to change
				if (/option/i.test(element.nodeName)) {
					var child = element.parentNode.firstChild,
						i = -1;
					while (child) {
						if (child.nodeType === 1) {
							i++;
							if (child === element) {
								break;
							}
						}
						child = child.nextSibling;
					}
					if (i !== element.parentNode.selectedIndex) {
						//shouldn't this wait on triggering
						//change?
						element.parentNode.selectedIndex = i;
						Syn.data(element, "createChange", true);
					}
				}

			}
		},
		mousedown: {
			setup: function (type, options, element) {
				var nn = element.nodeName.toLowerCase();
				//we have to auto prevent default to prevent freezing error in safari
				if (Syn.browser.safari && (nn === "select" || nn === "option")) {
					options._autoPrevent = true;
				}
			}
		}
	});

	return Syn;
})(__m2);

// ## src/mouse.support.js
var __m3 = (function checkSupport(Syn) {

	if (!document.body) {
		Syn.schedule(function () {
			checkSupport(Syn);
		}, 1);
		return;
	}

	window.__synthTest = function () {
		Syn.support.linkHrefJS = true;
	};

	var div = document.createElement("div"),
		checkbox, submit, form, select;

	div.innerHTML = "<form id='outer'>" + "<input name='checkbox' type='checkbox'/>" + "<input name='radio' type='radio' />" + "<input type='submit' name='submitter'/>" + "<input type='input' name='inputter'/>" + "<input name='one'>" + "<input name='two'/>" + "<a href='javascript:__synthTest()' id='synlink'></a>" + "<select><option></option></select>" + "</form>";
	document.documentElement.appendChild(div);
	form = div.firstChild;
	checkbox = form.childNodes[0];
	submit = form.childNodes[2];
	select = form.getElementsByTagName('select')[0];

	//trigger click for linkHrefJS support, childNodes[6] === anchor
	Syn.trigger('click', {}, form.childNodes[6]);

	checkbox.checked = false;
	checkbox.onchange = function () {
		Syn.support.clickChanges = true;
	};

	Syn.trigger("click", {}, checkbox);
	Syn.support.clickChecks = checkbox.checked;

	checkbox.checked = false;

	Syn.trigger("change", {}, checkbox);

	Syn.support.changeChecks = checkbox.checked;

	form.onsubmit = function (ev) {
		if (ev.preventDefault) {
			ev.preventDefault();
		}
		Syn.support.clickSubmits = true;
		return false;
	};
	Syn.trigger("click", {}, submit);

	form.childNodes[1].onchange = function () {
		Syn.support.radioClickChanges = true;
	};
	Syn.trigger("click", {}, form.childNodes[1]);

	Syn.bind(div, 'click', function onclick() {
		Syn.support.optionClickBubbles = true;
		Syn.unbind(div, 'click', onclick);
	});
	Syn.trigger("click", {}, select.firstChild);

	Syn.support.changeBubbles = Syn.eventSupported('change');

	//test if mousedown followed by mouseup causes click (opera), make sure there are no clicks after this
	div.onclick = function () {
		Syn.support.mouseDownUpClicks = true;
	};
	Syn.trigger("mousedown", {}, div);
	Syn.trigger("mouseup", {}, div);

	document.documentElement.removeChild(div);

	//check stuff
	Syn.support.ready++;
})(__m2, __m4);

// ## src/browsers.js
var __m5 = (function (Syn) {
	Syn.key.browsers = {
		webkit: {
			'prevent': {
				"keyup": [],
				"keydown": ["char", "keypress"],
				"keypress": ["char"]
			},
			'character': {
				"keydown": [0, "key"],
				"keypress": ["char", "char"],
				"keyup": [0, "key"]
			},
			'specialChars': {
				"keydown": [0, "char"],
				"keyup": [0, "char"]
			},
			'navigation': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'special': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'tab': {
				"keydown": [0, "char"],
				"keyup": [0, "char"]
			},
			'pause-break': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'caps': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'escape': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'num-lock': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'scroll-lock': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'print': {
				"keyup": [0, "key"]
			},
			'function': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'\r': {
				"keydown": [0, "key"],
				"keypress": ["char", "key"],
				"keyup": [0, "key"]
			}
		},
		gecko: {
			'prevent': {
				"keyup": [],
				"keydown": ["char"],
				"keypress": ["char"]
			},
			'character': {
				"keydown": [0, "key"],
				"keypress": ["char", 0],
				"keyup": [0, "key"]
			},
			'specialChars': {
				"keydown": [0, "key"],
				"keypress": [0, "key"],
				"keyup": [0, "key"]
			},
			'navigation': {
				"keydown": [0, "key"],
				"keypress": [0, "key"],
				"keyup": [0, "key"]
			},
			'special': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'\t': {
				"keydown": [0, "key"],
				"keypress": [0, "key"],
				"keyup": [0, "key"]
			},
			'pause-break': {
				"keydown": [0, "key"],
				"keypress": [0, "key"],
				"keyup": [0, "key"]
			},
			'caps': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'escape': {
				"keydown": [0, "key"],
				"keypress": [0, "key"],
				"keyup": [0, "key"]
			},
			'num-lock': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'scroll-lock': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'print': {
				"keyup": [0, "key"]
			},
			'function': {
				"keydown": [0, "key"],
				"keyup": [0, "key"]
			},
			'\r': {
				"keydown": [0, "key"],
				"keypress": [0, "key"],
				"keyup": [0, "key"]
			}
		},
		msie: {
			'prevent': {
				"keyup": [],
				"keydown": ["char", "keypress"],
				"keypress": ["char"]
			},
			'character': {
				"keydown": [null, "key"],
				"keypress": [null, "char"],
				"keyup": [null, "key"]
			},
			'specialChars': {
				"keydown": [null, "char"],
				"keyup": [null, "char"]
			},
			'navigation': {
				"keydown": [null, "key"],
				"keyup": [null, "key"]
			},
			'special': {
				"keydown": [null, "key"],
				"keyup": [null, "key"]
			},
			'tab': {
				"keydown": [null, "char"],
				"keyup": [null, "char"]
			},
			'pause-break': {
				"keydown": [null, "key"],
				"keyup": [null, "key"]
			},
			'caps': {
				"keydown": [null, "key"],
				"keyup": [null, "key"]
			},
			'escape': {
				"keydown": [null, "key"],
				"keypress": [null, "key"],
				"keyup": [null, "key"]
			},
			'num-lock': {
				"keydown": [null, "key"],
				"keyup": [null, "key"]
			},
			'scroll-lock': {
				"keydown": [null, "key"],
				"keyup": [null, "key"]
			},
			'print': {
				"keyup": [null, "key"]
			},
			'function': {
				"keydown": [null, "key"],
				"keyup": [null, "key"]
			},
			'\r': {
				"keydown": [null, "key"],
				"keypress": [null, "key"],
				"keyup": [null, "key"]
			}
		},
		opera: {
			'prevent': {
				"keyup": [],
				"keydown": [],
				"keypress": ["char"]
			},
			'character': {
				"keydown": [null, "key"],
				"keypress": [null, "char"],
				"keyup": [null, "key"]
			},
			'specialChars': {
				"keydown": [null, "char"],
				"keypress": [null, "char"],
				"keyup": [null, "char"]
			},
			'navigation': {
				"keydown": [null, "key"],
				"keypress": [null, "key"]
			},
			'special': {
				"keydown": [null, "key"],
				"keypress": [null, "key"],
				"keyup": [null, "key"]
			},
			'tab': {
				"keydown": [null, "char"],
				"keypress": [null, "char"],
				"keyup": [null, "char"]
			},
			'pause-break': {
				"keydown": [null, "key"],
				"keypress": [null, "key"],
				"keyup": [null, "key"]
			},
			'caps': {
				"keydown": [null, "key"],
				"keyup": [null, "key"]
			},
			'escape': {
				"keydown": [null, "key"],
				"keypress": [null, "key"]
			},
			'num-lock': {
				"keyup": [null, "key"],
				"keydown": [null, "key"],
				"keypress": [null, "key"]
			},
			'scroll-lock': {
				"keydown": [null, "key"],
				"keypress": [null, "key"],
				"keyup": [null, "key"]
			},
			'print': {},
			'function': {
				"keydown": [null, "key"],
				"keypress": [null, "key"],
				"keyup": [null, "key"]
			},
			'\r': {
				"keydown": [null, "key"],
				"keypress": [null, "key"],
				"keyup": [null, "key"]
			}
		}
	};

	Syn.mouse.browsers = {
		webkit: {
			"right": {
				"mousedown": {
					"button": 2,
					"which": 3
				},
				"mouseup": {
					"button": 2,
					"which": 3
				},
				"contextmenu": {
					"button": 2,
					"which": 3
				}
			},
			"left": {
				"mousedown": {
					"button": 0,
					"which": 1
				},
				"mouseup": {
					"button": 0,
					"which": 1
				},
				"click": {
					"button": 0,
					"which": 1
				}
			}
		},
		opera: {
			"right": {
				"mousedown": {
					"button": 2,
					"which": 3
				},
				"mouseup": {
					"button": 2,
					"which": 3
				}
			},
			"left": {
				"mousedown": {
					"button": 0,
					"which": 1
				},
				"mouseup": {
					"button": 0,
					"which": 1
				},
				"click": {
					"button": 0,
					"which": 1
				}
			}
		},
		msie: {
			"right": {
				"mousedown": {
					"button": 2
				},
				"mouseup": {
					"button": 2
				},
				"contextmenu": {
					"button": 0
				}
			},
			"left": {
				"mousedown": {
					"button": 1
				},
				"mouseup": {
					"button": 1
				},
				"click": {
					"button": 0
				}
			}
		},
		chrome: {
			"right": {
				"mousedown": {
					"button": 2,
					"which": 3
				},
				"mouseup": {
					"button": 2,
					"which": 3
				},
				"contextmenu": {
					"button": 2,
					"which": 3
				}
			},
			"left": {
				"mousedown": {
					"button": 0,
					"which": 1
				},
				"mouseup": {
					"button": 0,
					"which": 1
				},
				"click": {
					"button": 0,
					"which": 1
				}
			}
		},
		gecko: {
			"left": {
				"mousedown": {
					"button": 0,
					"which": 1
				},
				"mouseup": {
					"button": 0,
					"which": 1
				},
				"click": {
					"button": 0,
					"which": 1
				}
			},
			"right": {
				"mousedown": {
					"button": 2,
					"which": 3
				},
				"mouseup": {
					"button": 2,
					"which": 3
				},
				"contextmenu": {
					"button": 2,
					"which": 3
				}
			}
		}
	};

	//set browser
	Syn.key.browser =
		(function () {
		if (Syn.key.browsers[window.navigator.userAgent]) {
			return Syn.key.browsers[window.navigator.userAgent];
		}
		for (var browser in Syn.browser) {
			if (Syn.browser[browser] && Syn.key.browsers[browser]) {
				return Syn.key.browsers[browser];
			}
		}
		return Syn.key.browsers.gecko;
	})();

	Syn.mouse.browser =
		(function () {
		if (Syn.mouse.browsers[window.navigator.userAgent]) {
			return Syn.mouse.browsers[window.navigator.userAgent];
		}
		for (var browser in Syn.browser) {
			if (Syn.browser[browser] && Syn.mouse.browsers[browser]) {
				return Syn.mouse.browsers[browser];
			}
		}
		return Syn.mouse.browsers.gecko;
	})();
	return Syn;
})(__m2, __m4);

// ## src/typeable.js
var __m8 = (function (Syn) {
	// Holds functions that test for typeability
	var typeables = [];

	// IE <= 8 doesn't implement [].indexOf.
	// This shim was extracted from CoffeeScript:
	var __indexOf = [].indexOf || function (item) {
			for (var i = 0, l = this.length; i < l; i++) {
				if (i in this && this[i] === item) {
					return i;
				}
			}
			return -1;
		};

	/*
	 * @function typeable
	 * Registers a function that is used to determine if an
	 * element can be typed into. The user can define as many
	 * test functions as needed. By default there are 2 typeable
	 * functions, one for inputs and textareas, and another
	 * for contenteditable elements.
	 *
	 * @param {Function} fn Function to register.
	 */
	Syn.typeable = function (fn) {
		if (__indexOf.call(typeables, fn) === -1) {
			typeables.push(fn);
		}
	};

	/*
	 * @function test
	 * Tests whether an element can be typed into using the test
	 * functions registered by [Syn.typeable typeable]. If any of the
	 * test functions returns true, `test` will return true and allow
	 * the element to be typed into.
	 *
	 * @param {HTMLElement} el the element to test.
	 * @return {Boolean} true if the element can be typed into.
	 */
	Syn.typeable.test = function (el) {
		for (var i = 0, len = typeables.length; i < len; i++) {
			if (typeables[i](el)) {
				return true;
			}
		}
		return false;
	};

	var type = Syn.typeable;

	// Inputs and textareas
	var typeableExp = /input|textarea/i;
	type(function (el) {
		return typeableExp.test(el.nodeName);
	});

	// Content editable
	type(function (el) {
		return __indexOf.call(["", "true"], el.getAttribute("contenteditable")) !== -1;
	});

	return Syn;
})(__m2);

// ## src/key.js
var __m7 = (function (Syn) {
	var h = Syn.helpers,

		// gets the selection of an input or textarea
		getSelection = function (el) {
			var real, r, start;

			// use selectionStart if we can
			if (el.selectionStart !== undefined) {
				// this is for opera, so we don't have to focus to type how we think we would
				if (document.activeElement && document.activeElement !== el &&
					el.selectionStart === el.selectionEnd && el.selectionStart === 0) {
					return {
						start: el.value.length,
						end: el.value.length
					};
				}
				return {
					start: el.selectionStart,
					end: el.selectionEnd
				};
			} else {
				//check if we aren't focused
				try {
					//try 2 different methods that work differently (IE breaks depending on type)
					if (el.nodeName.toLowerCase() === 'input') {
						real = h.getWindow(el)
							.document.selection.createRange();
						r = el.createTextRange();
						r.setEndPoint("EndToStart", real);

						start = r.text.length;
						return {
							start: start,
							end: start + real.text.length
						};
					} else {
						real = h.getWindow(el)
							.document.selection.createRange();
						r = real.duplicate();
						var r2 = real.duplicate(),
							r3 = real.duplicate();
						r2.collapse();
						r3.collapse(false);
						r2.moveStart('character', -1);
						r3.moveStart('character', -1);
						//select all of our element
						r.moveToElementText(el);
						//now move our endpoint to the end of our real range
						r.setEndPoint('EndToEnd', real);
						start = r.text.length - real.text.length;
						var end = r.text.length;
						if (start !== 0 && r2.text === "") {
							start += 2;
						}
						if (end !== 0 && r3.text === "") {
							end += 2;
						}
						//if we aren't at the start, but previous is empty, we are at start of newline
						return {
							start: start,
							end: end
						};
					}
				} catch (e) {
					var prop = formElExp.test(el.nodeName) ? "value" : "textContent";

					return {
						start: el[prop].length,
						end: el[prop].length
					};
				}
			}
		},
		// gets all focusable elements
		getFocusable = function (el) {
			var document = h.getWindow(el)
				.document,
				res = [];

			var els = document.getElementsByTagName('*'),
				len = els.length;

			for (var i = 0; i < len; i++) {
				if (Syn.isFocusable(els[i]) && els[i] !== document.documentElement) {
					res.push(els[i]);
				}
			}
			return res;
		},
		formElExp = /input|textarea/i,
		textProperty = (function(){
			var el = document.createElement("span");
			return el.textContent != null ? 'textContent' : 'innerText';
		})(),

		// Get the text from an element.
		getText = function (el) {
			if (formElExp.test(el.nodeName)) {
				return el.value;
			}
			return el[textProperty];
		},
		// Set the text of an element.
		setText = function (el, value) {
			if (formElExp.test(el.nodeName)) {
				el.value = value;
			} else {
				el[textProperty] = value;
			}
		};

	/**
	 *
	 */
	h.extend(Syn, {
		/**
		 * @attribute
		 * @parent keys
		 * A list of the keys and their keycodes codes you can type.
		 * You can add type keys with
		 * @codestart
		 * Syn('key','delete','title');
		 *
		 * //or
		 *
		 * Syn('type','One Two Three[left][left][delete]','title')
		 * @codeend
		 *
		 * The following are a list of keys you can type:
		 * @codestart text
		 * \b        - backspace
		 * \t        - tab
		 * \r        - enter
		 * ' '       - space
		 * a-Z 0-9   - normal characters
		 * /!@#$*,.? - All other typeable characters
		 * page-up   - scrolls up
		 * page-down - scrolls down
		 * end       - scrolls to bottom
		 * home      - scrolls to top
		 * insert    - changes how keys are entered
		 * delete    - deletes the next character
		 * left      - moves cursor left
		 * right     - moves cursor right
		 * up        - moves the cursor up
		 * down      - moves the cursor down
		 * f1-12     - function buttons
		 * shift, ctrl, alt - special keys
		 * pause-break      - the pause button
		 * scroll-lock      - locks scrolling
		 * caps      - makes caps
		 * escape    - escape button
		 * num-lock  - allows numbers on keypad
		 * print     - screen capture
		 * subtract  - subtract (keypad) -
		 * dash      - dash -
		 * divide    - divide (keypad) /
		 * forward-slash - forward slash /
		 * decimal   - decimal (keypad) .
		 * period    - period .
		 * @codeend
		 */
		keycodes: {
			//backspace
			'\b': 8,

			//tab
			'\t': 9,

			//enter
			'\r': 13,

			//special
			'shift': 16,
			'ctrl': 17,
			'alt': 18,

			//weird
			'pause-break': 19,
			'caps': 20,
			'escape': 27,
			'num-lock': 144,
			'scroll-lock': 145,
			'print': 44,

			//navigation
			'page-up': 33,
			'page-down': 34,
			'end': 35,
			'home': 36,
			'left': 37,
			'up': 38,
			'right': 39,
			'down': 40,
			'insert': 45,
			'delete': 46,

			//normal characters
			' ': 32,
			'0': 48,
			'1': 49,
			'2': 50,
			'3': 51,
			'4': 52,
			'5': 53,
			'6': 54,
			'7': 55,
			'8': 56,
			'9': 57,
			'a': 65,
			'b': 66,
			'c': 67,
			'd': 68,
			'e': 69,
			'f': 70,
			'g': 71,
			'h': 72,
			'i': 73,
			'j': 74,
			'k': 75,
			'l': 76,
			'm': 77,
			'n': 78,
			'o': 79,
			'p': 80,
			'q': 81,
			'r': 82,
			's': 83,
			't': 84,
			'u': 85,
			'v': 86,
			'w': 87,
			'x': 88,
			'y': 89,
			'z': 90,
			//normal-characters, numpad
			'num0': 96,
			'num1': 97,
			'num2': 98,
			'num3': 99,
			'num4': 100,
			'num5': 101,
			'num6': 102,
			'num7': 103,
			'num8': 104,
			'num9': 105,
			'*': 106,
			'+': 107,
			'subtract': 109,
			'decimal': 110,
			//normal-characters, others
			'divide': 111,
			';': 186,
			'=': 187,
			',': 188,
			'dash': 189,
			'-': 189,
			'period': 190,
			'.': 190,
			'forward-slash': 191,
			'/': 191,
			'`': 192,
			'[': 219,
			'\\': 220,
			']': 221,
			"'": 222,

			//ignore these, you shouldn't use them
			'left window key': 91,
			'right window key': 92,
			'select key': 93,

			'f1': 112,
			'f2': 113,
			'f3': 114,
			'f4': 115,
			'f5': 116,
			'f6': 117,
			'f7': 118,
			'f8': 119,
			'f9': 120,
			'f10': 121,
			'f11': 122,
			'f12': 123
		},

		// selects text on an element
		selectText: function (el, start, end) {
			if (el.setSelectionRange) {
				if (!end) {
					Syn.__tryFocus(el);
					el.setSelectionRange(start, start);
				} else {
					el.selectionStart = start;
					el.selectionEnd = end;
				}
			} else if (el.createTextRange) {
				//Syn.__tryFocus(el);
				var r = el.createTextRange();
				r.moveStart('character', start);
				end = end || start;
				r.moveEnd('character', end - el.value.length);

				r.select();
			}
		},
		getText: function (el) {
			//first check if the el has anything selected ..
			if (Syn.typeable.test(el)) {
				var sel = getSelection(el);
				return el.value.substring(sel.start, sel.end);
			}
			//otherwise get from page
			var win = Syn.helpers.getWindow(el);
			if (win.getSelection) {
				return win.getSelection()
					.toString();
			} else if (win.document.getSelection) {
				return win.document.getSelection()
					.toString();
			} else {
				return win.document.selection.createRange()
					.text;
			}
		},
		getSelection: getSelection
	});

	h.extend(Syn.key, {
		// retrieves a description of what events for this character should look like
		data: function (key) {
			//check if it is described directly
			if (Syn.key.browser[key]) {
				return Syn.key.browser[key];
			}
			for (var kind in Syn.key.kinds) {
				if (h.inArray(key, Syn.key.kinds[kind]) > -1) {
					return Syn.key.browser[kind];
				}
			}
			return Syn.key.browser.character;
		},

		//returns the special key if special
		isSpecial: function (keyCode) {
			var specials = Syn.key.kinds.special;
			for (var i = 0; i < specials.length; i++) {
				if (Syn.keycodes[specials[i]] === keyCode) {
					return specials[i];
				}
			}
		},
		/**
		 * @hide
		 * gets the options for a key and event type ...
		 * @param {Object} key
		 * @param {Object} event
		 */
		options: function (key, event) {
			var keyData = Syn.key.data(key);

			if (!keyData[event]) {
				//we shouldn't be creating this event
				return null;
			}

			var charCode = keyData[event][0],
				keyCode = keyData[event][1],
				result = {};

			if (keyCode === 'key') {
				result.keyCode = Syn.keycodes[key];
			} else if (keyCode === 'char') {
				result.keyCode = key.charCodeAt(0);
			} else {
				result.keyCode = keyCode;
			}

			if (charCode === 'char') {
				result.charCode = key.charCodeAt(0);
			} else if (charCode !== null) {
				result.charCode = charCode;
			}

			// all current browsers have which property to normalize keyCode/charCode
			if (result.keyCode) {
				result.which = result.keyCode;
			} else {
				result.which = result.charCode;
			}

			return result;
		},
		//types of event keys
		kinds: {
			special: ["shift", 'ctrl', 'alt', 'caps'],
			specialChars: ["\b"],
			navigation: ["page-up", 'page-down', 'end', 'home', 'left', 'up', 'right', 'down', 'insert', 'delete'],
			'function': ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12']
		},
		//returns the default function
		// some keys have default functions
		// some 'kinds' of keys have default functions
		getDefault: function (key) {
			//check if it is described directly
			if (Syn.key.defaults[key]) {
				return Syn.key.defaults[key];
			}
			for (var kind in Syn.key.kinds) {
				if (h.inArray(key, Syn.key.kinds[kind]) > -1 && Syn.key.defaults[kind]) {
					return Syn.key.defaults[kind];
				}
			}
			return Syn.key.defaults.character;
		},
		// default behavior when typing
		defaults: {
			'character': function (options, scope, key, force, sel) {
				if (/num\d+/.test(key)) {
					key = key.match(/\d+/)[0];
				}

				if (force || (!Syn.support.keyCharacters && Syn.typeable.test(this))) {
					var current = getText(this),
						before = current.substr(0, sel.start),
						after = current.substr(sel.end),
						character = key;

					setText(this, before + character + after);
					//handle IE inserting \r\n
					var charLength = character === "\n" && Syn.support.textareaCarriage ? 2 : character.length;
					Syn.selectText(this, before.length + charLength);
				}
			},
			'c': function (options, scope, key, force, sel) {
				if (Syn.key.ctrlKey) {
					Syn.key.clipboard = Syn.getText(this);
				} else {
					Syn.key.defaults.character.apply(this, arguments);
				}
			},
			'v': function (options, scope, key, force, sel) {
				if (Syn.key.ctrlKey) {
					Syn.key.defaults.character.call(this, options, scope, Syn.key.clipboard, true, sel);
				} else {
					Syn.key.defaults.character.apply(this, arguments);
				}
			},
			'a': function (options, scope, key, force, sel) {
				if (Syn.key.ctrlKey) {
					Syn.selectText(this, 0, getText(this)
						.length);
				} else {
					Syn.key.defaults.character.apply(this, arguments);
				}
			},
			'home': function () {
				Syn.onParents(this, function (el) {
					if (el.scrollHeight !== el.clientHeight) {
						el.scrollTop = 0;
						return false;
					}
				});
			},
			'end': function () {
				Syn.onParents(this, function (el) {
					if (el.scrollHeight !== el.clientHeight) {
						el.scrollTop = el.scrollHeight;
						return false;
					}
				});
			},
			'page-down': function () {
				//find the first parent we can scroll
				Syn.onParents(this, function (el) {
					if (el.scrollHeight !== el.clientHeight) {
						var ch = el.clientHeight;
						el.scrollTop += ch;
						return false;
					}
				});
			},
			'page-up': function () {
				Syn.onParents(this, function (el) {
					if (el.scrollHeight !== el.clientHeight) {
						var ch = el.clientHeight;
						el.scrollTop -= ch;
						return false;
					}
				});
			},
			'\b': function (options, scope, key, force, sel) {
				//this assumes we are deleting from the end
				if (!Syn.support.backspaceWorks && Syn.typeable.test(this)) {
					var current = getText(this),
						before = current.substr(0, sel.start),
						after = current.substr(sel.end);

					if (sel.start === sel.end && sel.start > 0) {
						//remove a character
						setText(this, before.substring(0, before.length - 1) + after);
						Syn.selectText(this, sel.start - 1);
					} else {
						setText(this, before + after);
						Syn.selectText(this, sel.start);
					}

					//set back the selection
				}
			},
			'delete': function (options, scope, key, force, sel) {
				if (!Syn.support.backspaceWorks && Syn.typeable.test(this)) {
					var current = getText(this),
						before = current.substr(0, sel.start),
						after = current.substr(sel.end);
					if (sel.start === sel.end && sel.start <= getText(this)
						.length - 1) {
						setText(this, before + after.substring(1));
					} else {
						setText(this, before + after);
					}
					Syn.selectText(this, sel.start);
				}
			},
			'\r': function (options, scope, key, force, sel) {

				var nodeName = this.nodeName.toLowerCase();
				// submit a form
				if (nodeName === 'input') {
					Syn.trigger("change", {}, this);
				}

				if (!Syn.support.keypressSubmits && nodeName === 'input') {
					var form = Syn.closest(this, "form");
					if (form) {
						Syn.trigger("submit", {}, form);
					}

				}
				//newline in textarea
				if (!Syn.support.keyCharacters && nodeName === 'textarea') {
					Syn.key.defaults.character.call(this, options, scope, "\n",
						undefined, sel);
				}
				// 'click' hyperlinks
				if (!Syn.support.keypressOnAnchorClicks && nodeName === 'a') {
					Syn.trigger("click", {}, this);
				}
			},
			// 
			// Gets all focusable elements.  If the element (this)
			// doesn't have a tabindex, finds the next element after.
			// If the element (this) has a tabindex finds the element 
			// with the next higher tabindex OR the element with the same
			// tabindex after it in the document.
			// @return the next element
			// 
			'\t': function (options, scope) {
				// focusable elements
				var focusEls = getFocusable(this),
					// will be set to our guess for the next element
					current = null,
					i = 0,
					el,
					//the tabindex of the tabable element we are looking at
					firstNotIndexed,
					orders = [];
				for (; i < focusEls.length; i++) {
					orders.push([focusEls[i], i]);
				}
				var sort = function (order1, order2) {
					var el1 = order1[0],
						el2 = order2[0],
						tab1 = Syn.tabIndex(el1) || 0,
						tab2 = Syn.tabIndex(el2) || 0;
					if (tab1 === tab2) {
						return order1[1] - order2[1];
					} else {
						if (tab1 === 0) {
							return 1;
						} else if (tab2 === 0) {
							return -1;
						} else {
							return tab1 - tab2;
						}
					}
				};
				orders.sort(sort);
				//now find current
				for (i = 0; i < orders.length; i++) {
					el = orders[i][0];
					if (this === el) {
						if (!Syn.key.shiftKey) {
							if (i === orders.length - 1 || !(current = orders[i + 1][0])) {
								current = orders[0][0];
							}
						} else {
							if (i === 0 || !(current = orders[i - 1][0])) {
								current = orders[focusEls.length - 1][0];
							}
						}
					}
				}

				//restart if we didn't find anything
				if (!current) {
					current = firstNotIndexed;
				} else {
					Syn.__tryFocus(current);
				}
				return current;
			},
			'left': function (options, scope, key, force, sel) {
				if (Syn.typeable.test(this)) {
					if (Syn.key.shiftKey) {
						Syn.selectText(this, sel.start === 0 ? 0 : sel.start - 1, sel.end);
					} else {
						Syn.selectText(this, sel.start === 0 ? 0 : sel.start - 1);
					}
				}
			},
			'right': function (options, scope, key, force, sel) {
				if (Syn.typeable.test(this)) {
					if (Syn.key.shiftKey) {
						Syn.selectText(this, sel.start, sel.end + 1 > getText(this)
							.length ? getText(this)
							.length : sel.end + 1);
					} else {
						Syn.selectText(this, sel.end + 1 > getText(this)
							.length ? getText(this)
							.length : sel.end + 1);
					}
				}
			},
			'up': function () {
				if (/select/i.test(this.nodeName)) {

					this.selectedIndex = this.selectedIndex ? this.selectedIndex - 1 : 0;
					//set this to change on blur?
				}
			},
			'down': function () {
				if (/select/i.test(this.nodeName)) {
					Syn.changeOnBlur(this, "selectedIndex", this.selectedIndex);
					this.selectedIndex = this.selectedIndex + 1;
					//set this to change on blur?
				}
			},
			'shift': function () {
				return null;
			},
			'ctrl': function () {
				return null;
			}
		}
	});

	h.extend(Syn.create, {
		keydown: {
			setup: function (type, options, element) {
				if (h.inArray(options, Syn.key.kinds.special) !== -1) {
					Syn.key[options + "Key"] = element;
				}
			}
		},
		keypress: {
			setup: function (type, options, element) {
				// if this browsers supports writing keys on events
				// but doesn't write them if the element isn't focused
				// focus on the element (ignored if already focused)
				if (Syn.support.keyCharacters && !Syn.support.keysOnNotFocused) {
					Syn.__tryFocus(element);
				}
			}
		},
		keyup: {
			setup: function (type, options, element) {
				if (h.inArray(options, Syn.key.kinds.special) !== -1) {
					Syn.key[options + "Key"] = null;
				}
			}
		},
		key: {
			// return the options for a key event
			options: function (type, options, element) {
				//check if options is character or has character
				options = typeof options !== "object" ? {
					character: options
				} : options;

				//don't change the orignial
				options = h.extend({}, options);
				if (options.character) {
					h.extend(options, Syn.key.options(options.character, type));
					delete options.character;
				}

				options = h.extend({
					ctrlKey: !! Syn.key.ctrlKey,
					altKey: !! Syn.key.altKey,
					shiftKey: !! Syn.key.shiftKey,
					metaKey: !! Syn.key.metaKey
				}, options);

				return options;
			},
			// creates a key event
			event: function (type, options, element) { //Everyone Else
				var doc = h.getWindow(element)
					.document || document,
					event;
				if (doc.createEvent) {
					try {
						event = doc.createEvent("KeyEvents");
						event.initKeyEvent(type, true, true, window, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.keyCode, options.charCode);
					} catch (e) {
						event = h.createBasicStandardEvent(type, options, doc);
					}
					event.synthetic = true;
					return event;
				} else {
					try {
						event = h.createEventObject.apply(this, arguments);
						h.extend(event, options);
					} catch (e) {}

					return event;
				}
			}
		}
	});

	var convert = {
		"enter": "\r",
		"backspace": "\b",
		"tab": "\t",
		"space": " "
	};

	/**
	 * 
	 */
	h.extend(Syn.init.prototype, {
		/**
		 * @function Syn.key key()
		 * @parent keys
		 * @signature `Syn.key(options, element, callback)`
		 * Types a single key.  The key should be
		 * a string that matches a
		 * [Syn.static.keycodes].
		 *
		 * The following sends a carridge return
		 * to the 'name' element.
		 * @codestart
		 * Syn.key('\r','name')
		 * @codeend
		 * For each character, a keydown, keypress, and keyup is triggered if
		 * appropriate.
		 * @param {String|Number} options
		 * @param {HTMLElement} [element]
		 * @param {Function} [callback]
		 * @return {HTMLElement} the element currently focused.
		 */
		_key: function (options, element, callback) {
			//first check if it is a special up
			if (/-up$/.test(options) && h.inArray(options.replace("-up", ""),
				Syn.key.kinds.special) !== -1) {
				Syn.trigger('keyup', options.replace("-up", ""), element);
				return callback(true, element);
			}

			// keep reference to current activeElement
			var activeElement = h.getWindow(element)
				.document.activeElement,
				caret = Syn.typeable.test(element) && getSelection(element),
				key = convert[options] || options,
				// should we run default events
				runDefaults = Syn.trigger('keydown', key, element),

				// a function that gets the default behavior for a key
				getDefault = Syn.key.getDefault,

				// how this browser handles preventing default events
				prevent = Syn.key.browser.prevent,

				// the result of the default event
				defaultResult,

				keypressOptions = Syn.key.options(key, 'keypress');

			if (runDefaults) {
				//if the browser doesn't create keypresses for this key, run default
				if (!keypressOptions) {
					defaultResult = getDefault(key)
						.call(element, keypressOptions, h.getWindow(element),
							key, undefined, caret);
				} else {
					//do keypress
					// check if activeElement changed b/c someone called focus in keydown
					if (activeElement !== h.getWindow(element)
						.document.activeElement) {
						element = h.getWindow(element)
							.document.activeElement;
					}

					runDefaults = Syn.trigger('keypress', keypressOptions, element);
					if (runDefaults) {
						defaultResult = getDefault(key)
							.call(element, keypressOptions, h.getWindow(element),
								key, undefined, caret);
					}
				}
			} else {
				//canceled ... possibly don't run keypress
				if (keypressOptions && h.inArray('keypress', prevent.keydown) === -1) {
					// check if activeElement changed b/c someone called focus in keydown
					if (activeElement !== h.getWindow(element)
						.document.activeElement) {
						element = h.getWindow(element)
							.document.activeElement;
					}

					Syn.trigger('keypress', keypressOptions, element);
				}
			}
			if (defaultResult && defaultResult.nodeName) {
				element = defaultResult;
			}

			if (defaultResult !== null) {
				Syn.schedule(function () {
					if (Syn.support.oninput) {
						Syn.trigger('input', Syn.key.options(key, 'input'), element);
					}
					Syn.trigger('keyup', Syn.key.options(key, 'keyup'), element);
					callback(runDefaults, element);
				}, 1);
			} else {
				callback(runDefaults, element);
			}

			//do mouseup
			return element;
			// is there a keypress? .. if not , run default
			// yes -> did we prevent it?, if not run ...
		},
		/**
		 * @function Syn.type type()
		 * @parent keys
		 * @signature `Syn.type(options, element, callback)`
		 * Types sequence of [Syn.key key actions].  Each
		 * character is typed, one at a type.
		 * Multi-character keys like 'left' should be
		 * enclosed in square brackents.
		 *
		 * The following types 'JavaScript MVC' then deletes the space.
		 * @codestart
		 * Syn.type('JavaScript MVC[left][left][left]\b','name')
		 * @codeend
		 *
		 * Type is able to handle (and move with) tabs (\t).
		 * The following simulates tabing and entering values in a form and
		 * eventually submitting the form.
		 * @codestart
		 * Syn.type("Justin\tMeyer\t27\tjustinbmeyer@gmail.com\r")
		 * @codeend
		 * @param {String} options the text to type
		 * @param {HTMLElement} [element] an element or an id of an element
		 * @param {Function} [callback] a function to callback
		 */
		_type: function (options, element, callback) {
			//break it up into parts ...
			//go through each type and run
            var parts;
            if (Array.isArray(options)) {
                parts = options;
            } else {
                parts = (options + "").match(/(\[[^\]]+\])|([^\[])/g);
            }

			var self = this,
				runNextPart = function (runDefaults, el) {
					var part = parts.shift();
					if (!part) {
						callback(runDefaults, el);
						return;
					}
					el = el || element;
					if (part.length > 1) {
						part = part.substr(1, part.length - 2);
					}
					self._key(part, el, runNextPart);
				};

			runNextPart();

		}
	});

	return Syn;
})(__m2, __m8, __m5);

// ## src/key.support.js
var __m6 = (function (Syn) {

	if (!Syn.config.support) {
		//do support code
		(function checkForSupport() {
			if (!document.body) {
				return Syn.schedule(checkForSupport, 1);
			}

			var div = document.createElement("div"),
				checkbox, submit, form, anchor, textarea, inputter, one, doc;

			doc = document.documentElement;

			div.innerHTML = "<form id='outer'>" +
				"<input name='checkbox' type='checkbox'/>" +
				"<input name='radio' type='radio' />" +
				"<input type='submit' name='submitter'/>" +
				"<input type='input' name='inputter'/>" +
				"<input name='one'>" +
				"<input name='two'/>" +
				"<a href='#abc'></a>" +
				"<textarea>1\n2</textarea>" +
				"</form>";

			doc.insertBefore(div, doc.firstElementChild || doc.children[0]);
			form = div.firstChild;
			checkbox = form.childNodes[0];
			submit = form.childNodes[2];
			anchor = form.getElementsByTagName("a")[0];
			textarea = form.getElementsByTagName("textarea")[0];
			inputter = form.childNodes[3];
			one = form.childNodes[4];

			form.onsubmit = function (ev) {
				if (ev.preventDefault) {
					ev.preventDefault();
				}
				Syn.support.keypressSubmits = true;
				ev.returnValue = false;
				return false;
			};
			// Firefox 4 won't write key events if the element isn't focused
			Syn.__tryFocus(inputter);
			Syn.trigger("keypress", "\r", inputter);

			Syn.trigger("keypress", "a", inputter);
			Syn.support.keyCharacters = inputter.value === "a";

			inputter.value = "a";
			Syn.trigger("keypress", "\b", inputter);
			Syn.support.backspaceWorks = inputter.value === "";

			inputter.onchange = function () {
				Syn.support.focusChanges = true;
			};
			Syn.__tryFocus(inputter);
			Syn.trigger("keypress", "a", inputter);
			Syn.__tryFocus(form.childNodes[5]); // this will throw a change event
			Syn.trigger("keypress", "b", inputter);
			Syn.support.keysOnNotFocused = inputter.value === "ab";

			//test keypress \r on anchor submits
			Syn.bind(anchor, "click", function (ev) {
				if (ev.preventDefault) {
					ev.preventDefault();
				}
				Syn.support.keypressOnAnchorClicks = true;
				ev.returnValue = false;
				return false;
			});
			Syn.trigger("keypress", "\r", anchor);

			Syn.support.textareaCarriage = textarea.value.length === 4;

			// IE only, oninput event.
			Syn.support.oninput = 'oninput' in one;

			doc.removeChild(div);

			Syn.support.ready++;
		})();
	} else {
		Syn.helpers.extend(Syn.support, Syn.config.support);
	}

	return Syn;
})(__m2, __m7);

// ## src/drag/drag.js
var __m9 = (function (Syn) {

	// check if elementFromPageExists
	(function dragSupport() {

		// document body has to exists for this test
		if (!document.body) {
			Syn.schedule(dragSupport, 1);
			return;
		}
		var div = document.createElement('div');
		document.body.appendChild(div);
		Syn.helpers.extend(div.style, {
			width: "100px",
			height: "10000px",
			backgroundColor: "blue",
			position: "absolute",
			top: "10px",
			left: "0px",
			zIndex: 19999
		});
		document.body.scrollTop = 11;
		if (!document.elementFromPoint) {
			return;
		}
		var el = document.elementFromPoint(3, 1);
		if (el === div) {
			Syn.support.elementFromClient = true;
		} else {
			Syn.support.elementFromPage = true;
		}
		document.body.removeChild(div);
		document.body.scrollTop = 0;
	})();

	//gets an element from a point
	var elementFromPoint = function (point, element) {
		var clientX = point.clientX,
			clientY = point.clientY,
			win = Syn.helpers.getWindow(element),
			el;

		if (Syn.support.elementFromPage) {
			var off = Syn.helpers.scrollOffset(win);
			clientX = clientX + off.left; //convert to pageX
			clientY = clientY + off.top; //convert to pageY
		}
		el = win.document.elementFromPoint ? win.document.elementFromPoint(clientX, clientY) : element;
		if (el === win.document.documentElement && (point.clientY < 0 || point.clientX < 0)) {
			return element;
		} else {
			return el;
		}
	},
		//creates an event at a certain point
		createEventAtPoint = function (event, point, element) {
			var el = elementFromPoint(point, element);
			Syn.trigger(event, point, el || element);
			return el;
		},
		// creates a mousemove event, but first triggering mouseout / mouseover if appropriate
		mouseMove = function (point, element, last) {
			var el = elementFromPoint(point, element);
			if (last !== el && el && last) {
				var options = Syn.helpers.extend({}, point);
				options.relatedTarget = el;
				Syn.trigger("mouseout", options, last);
				options.relatedTarget = last;
				Syn.trigger("mouseover", options, el);
			}

			Syn.trigger("mousemove", point, el || element);
			return el;
		},
		// start and end are in clientX, clientY
		startMove = function (start, end, duration, element, callback) {
			var startTime = new Date(),
				distX = end.clientX - start.clientX,
				distY = end.clientY - start.clientY,
				win = Syn.helpers.getWindow(element),
				current = elementFromPoint(start, element),
				cursor = win.document.createElement('div'),
				calls = 0,
				move;
			move = function onmove() {
				//get what fraction we are at
				var now = new Date(),
					scrollOffset = Syn.helpers.scrollOffset(win),
					fraction = (calls === 0 ? 0 : now - startTime) / duration,
					options = {
						clientX: distX * fraction + start.clientX,
						clientY: distY * fraction + start.clientY
					};
				calls++;
				if (fraction < 1) {
					Syn.helpers.extend(cursor.style, {
						left: (options.clientX + scrollOffset.left + 2) + "px",
						top: (options.clientY + scrollOffset.top + 2) + "px"
					});
					current = mouseMove(options, element, current);
					Syn.schedule(onmove, 15);
				} else {
					current = mouseMove(end, element, current);
					win.document.body.removeChild(cursor);
					callback();
				}
			};
			Syn.helpers.extend(cursor.style, {
				height: "5px",
				width: "5px",
				backgroundColor: "red",
				position: "absolute",
				zIndex: 19999,
				fontSize: "1px"
			});
			win.document.body.appendChild(cursor);
			move();
		},
		startDrag = function (start, end, duration, element, callback) {
			createEventAtPoint("mousedown", start, element);
			startMove(start, end, duration, element, function () {
				createEventAtPoint("mouseup", end, element);
				callback();
			});
		},
		center = function (el) {
			var j = Syn.jquery()(el),
				o = j.offset();
			return {
				pageX: o.left + (j.outerWidth() / 2),
				pageY: o.top + (j.outerHeight() / 2)
			};
		},
		convertOption = function (option, win, from) {
			var page = /(\d+)[x ](\d+)/,
				client = /(\d+)X(\d+)/,
				relative = /([+-]\d+)[xX ]([+-]\d+)/,
				parts;
			//check relative "+22x-44"
			if (typeof option === 'string' && relative.test(option) && from) {
				var cent = center(from);
				parts = option.match(relative);
				option = {
					pageX: cent.pageX + parseInt(parts[1]),
					pageY: cent.pageY + parseInt(parts[2])
				};
			}
			if (typeof option === "string" && page.test(option)) {
				parts = option.match(page);
				option = {
					pageX: parseInt(parts[1]),
					pageY: parseInt(parts[2])
				};
			}
			if (typeof option === 'string' && client.test(option)) {
				parts = option.match(client);
				option = {
					clientX: parseInt(parts[1]),
					clientY: parseInt(parts[2])
				};
			}
			if (typeof option === 'string') {
				option = Syn.jquery()(option, win.document)[0];
			}
			if (option.nodeName) {
				option = center(option);
			}
			if (option.pageX) {
				var off = Syn.helpers.scrollOffset(win);
				option = {
					clientX: option.pageX - off.left,
					clientY: option.pageY - off.top
				};
			}
			return option;
		},
		// if the client chords are not going to be visible ... scroll the page so they will be ...
		adjust = function (from, to, win) {
			if (from.clientY < 0) {
				var off = Syn.helpers.scrollOffset(win);
				var top = off.top + (from.clientY) - 100,
					diff = top - off.top;

				// first, lets see if we can scroll 100 px
				if (top > 0) {

				} else {
					top = 0;
					diff = -off.top;
				}
				from.clientY = from.clientY - diff;
				to.clientY = to.clientY - diff;
				Syn.helpers.scrollOffset(win, {
					top: top,
					left: off.left
				});
			}
		};
	/**
	 * @add Syn prototype
	 */
	Syn.helpers.extend(Syn.init.prototype, {
		/**
			 * @function Syn.move move()
		   * @parent mouse
			 * @signature `Syn.move(options, from, callback)`
			 * Moves the cursor from one point to another.  
			 * 
			 * ### Quick Example
			 * 
			 * The following moves the cursor from (0,0) in
			 * the window to (100,100) in 1 second.
			 * 
			 *     Syn.move(
			 *          {
			 *            from: {clientX: 0, clientY: 0},
			 *            to: {clientX: 100, clientY: 100},
			 *            duration: 1000
			 *          },
			 *          document.document)
			 * 
			 * ## Options
			 * 
			 * There are many ways to configure the endpoints of the move.
			 * 
			 * ### PageX and PageY
			 * 
			 * If you pass pageX or pageY, these will get converted
			 * to client coordinates.
			 * 
			 *     Syn.move(
			 *          {
			 *            from: {pageX: 0, pageY: 0},
			 *            to: {pageX: 100, pageY: 100}
			 *          },
			 *          document.document)
			 * 
			 * ### String Coordinates
			 * 
			 * You can set the pageX and pageY as strings like:
			 * 
			 *     Syn.move(
			 *          {
			 *            from: "0x0",
			 *            to: "100x100"
			 *          },
			 *          document.document)
			 * 
			 * ### Element Coordinates
			 * 
			 * If jQuery is present, you can pass an element as the from or to option
			 * and the coordinate will be set as the center of the element.
			 
			 *     Syn.move(
			 *          {
			 *            from: $(".recipe")[0],
			 *            to: $("#trash")[0]
			 *          },
			 *          document.document)
			 * 
			 * ### Query Strings
			 * 
			 * If jQuery is present, you can pass a query string as the from or to option.
			 * 
			 * Syn.move(
			 *      {
			 *        from: ".recipe",
			 *        to: "#trash"
			 *      },
			 *      document.document)
			 *    
			 * ### No From
			 * 
			 * If you don't provide a from, the element argument passed to Syn is used.
			 * 
			 *     Syn.move(
			 *          { to: "#trash" },
			 *          'myrecipe')
			 * 
			 * ### Relative
			 * 
			 * You can move the drag relative to the center of the from element.
			 * 
			 *     Syn.move("+20 +30", "myrecipe");
			 * 
			 * @param {Object} options options to configure the drag
			 * @param {HTMLElement} from the element to move
			 * @param {Function} callback a callback that happens after the drag motion has completed
			 */
		_move: function (options, from, callback) {
			//need to convert if elements
			var win = Syn.helpers.getWindow(from),
				fro = convertOption(options.from || from, win, from),
				to = convertOption(options.to || options, win, from);

			if (options.adjust !== false) {
				adjust(fro, to, win);
			}
			startMove(fro, to, options.duration || 500, from, callback);

		},
		/**
		 * @function Syn.drag drag()
		 * @parent mouse
		 * @signature `Syn.drag(options, from, callback)`
		 * Creates a mousedown and drags from one point to another.
		 * Check out [Syn.prototype.move move] for API details.
		 *
		 * @param {Object} options
		 * @param {Object} from
		 * @param {Object} callback
		 */
		_drag: function (options, from, callback) {
			//need to convert if elements
			var win = Syn.helpers.getWindow(from),
				fro = convertOption(options.from || from, win, from),
				to = convertOption(options.to || options, win, from);

			if (options.adjust !== false) {
				adjust(fro, to, win);
			}
			startDrag(fro, to, options.duration || 500, from, callback);

		}
	});
	return Syn;
})(__m2);

// ## src/syn.js
var __m1 = (function (Syn) {
		window.Syn = Syn;

		return Syn;
	})(__m2, __m3, __m4, __m5, __m6, __m7, __m9);

}(window);