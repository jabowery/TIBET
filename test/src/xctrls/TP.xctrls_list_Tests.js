//  ========================================================================
//  xctrls:list
//  ========================================================================

TP.xctrls.list.Type.describe('TP.xctrls.list: manipulation',
function() {

    var unloadURI,
        loadURI,

        windowContext;

    unloadURI = TP.uc(TP.sys.cfg('path.blank_page'));

    //  ---

    this.before(
        function() {

            var loc,
                listID;

            windowContext = this.getDriver().get('windowContext');

            loc = '~lib_test/src/xctrls/xctrls_list.xhtml';
            loadURI = TP.uc(loc);
            this.getDriver().setLocation(loadURI);

            listID = TP.computeOriginID(windowContext, loc, 'list3');
            this.thenWaitFor(listID, 'TP.sig.DOMReady');

            this.then(
                function() {
                    this.startTrackingSignals();
                }.bind(this));
        });

    //  ---

    this.after(
        function() {

            this.stopTrackingSignals();

            //  Unload the current page by setting it to the blank
            this.getDriver().setLocation(unloadURI);

            //  Unregister the URI to avoid a memory leak
            loadURI.unregister();
        });

    //  ---

    this.beforeEach(
        function() {
            var bodyElem;

            bodyElem = TP.documentGetBody(TP.sys.uidoc(true));
            TP.wrap(bodyElem).focus();

            TP.signal.reset();
        });

    //  ---

    this.afterEach(
        function() {
            TP.signal.reset();
        });

    //  ---

    this.it('Focusing', function(test, options) {

        var list,
            firstListItem;

        list = TP.byId('list1', windowContext);
        firstListItem = list.get('listitems').first();

        //  Change the focus via 'direct' method

        test.getDriver().startSequence().
            sendEvent(TP.hc('type', 'focus'), list).
            perform();

        test.then(
            function() {

                test.assert.hasAttribute(firstListItem, 'pclass:focus');

                test.assert.didSignal(firstListItem, 'TP.sig.UIFocus');
                test.assert.didSignal(firstListItem, 'TP.sig.UIDidFocus');
            });
    });

    //  ---

    this.it('Activation - mouse', function(test, options) {

        var list,
            firstListItem;

        //  Change the content via 'user' interaction

        list = TP.byId('list1', windowContext);
        firstListItem = list.get('listitems').first();

        //  Individual mousedown/mouseup

        test.getDriver().startSequence().
            mouseDown(firstListItem).
            perform();

        test.then(
            function() {
                test.assert.hasAttribute(firstListItem, 'pclass:active');

                test.assert.didSignal(firstListItem, 'TP.sig.UIActivate');
                test.assert.didSignal(firstListItem, 'TP.sig.UIDidActivate');

                TP.signal.reset();
            });

        test.getDriver().startSequence().
            mouseUp(firstListItem).
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(firstListItem, 'pclass:active');

                test.assert.didSignal(firstListItem, 'TP.sig.UIDeactivate');
                test.assert.didSignal(firstListItem, 'TP.sig.UIDidDeactivate');

                TP.signal.reset();
            });

        //  click

        test.getDriver().startSequence().
            click(firstListItem).
            perform();

        test.then(
            function() {

                //  Don't test the attribute here - it will already have been
                //  removed.

                test.assert.didSignal(firstListItem, 'TP.sig.UIActivate');
                test.assert.didSignal(firstListItem, 'TP.sig.UIDidActivate');

                test.assert.didSignal(firstListItem, 'TP.sig.UIDeactivate');
                test.assert.didSignal(firstListItem, 'TP.sig.UIDidDeactivate');
            });
    });

    //  ---

    this.it('Activation - keyboard', function(test, options) {

        var list,
            firstListItem;

        //  Change the content via 'user' interaction

        list = TP.byId('list1', windowContext);
        firstListItem = list.get('listitems').first();

        //  Individual keydown/keyup

        test.getDriver().startSequence().
            keyDown(firstListItem, 'Enter').
            perform();

        test.then(
            function() {
                test.assert.hasAttribute(firstListItem, 'pclass:active');

                test.assert.didSignal(firstListItem, 'TP.sig.UIActivate');
                test.assert.didSignal(firstListItem, 'TP.sig.UIDidActivate');

                TP.signal.reset();
            });

        test.getDriver().startSequence().
            keyUp(firstListItem, 'Enter').
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(firstListItem, 'pclass:active');

                test.assert.didSignal(firstListItem, 'TP.sig.UIDeactivate');
                test.assert.didSignal(firstListItem, 'TP.sig.UIDidDeactivate');
            });
    });

    //  ---

    this.it('Disabled behavior', function(test, options) {

        var list,
            firstListItem;

        //  All of these mechanisms to 'activate' the control should fail - it's
        //  disabled.

        //  Disable it
        list = TP.byId('list1', windowContext);
        list.setAttrDisabled(true);
        firstListItem = list.get('listitems').first();

        TP.elementIsDisabled(TP.unwrap(firstListItem));

        //  --- Focus

        test.getDriver().startSequence().
            sendEvent(TP.hc('type', 'focus'), firstListItem).
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(firstListItem, 'pclass:focus');

                test.refute.didSignal(firstListItem, 'TP.sig.UIFocus');
                test.refute.didSignal(firstListItem, 'TP.sig.UIDidFocus');

                TP.signal.reset();
            });

        //  --- Individual mousedown/mouseup

        test.getDriver().startSequence().
            mouseDown(firstListItem).
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(firstListItem, 'pclass:active');

                test.refute.didSignal(firstListItem, 'TP.sig.UIActivate');
                test.refute.didSignal(firstListItem, 'TP.sig.UIDidActivate');
            });

        test.getDriver().startSequence().
            mouseUp(firstListItem).
            perform();

        test.then(
            function() {
                test.refute.didSignal(firstListItem, 'TP.sig.UIDeactivate');
                test.refute.didSignal(firstListItem, 'TP.sig.UIDidDeactivate');

                TP.signal.reset();
            });

        //  --- click

        test.getDriver().startSequence().
            click(firstListItem).
            perform();

        test.then(
            function() {
                test.refute.didSignal(firstListItem, 'TP.sig.UIActivate');
                test.refute.didSignal(firstListItem, 'TP.sig.UIDidActivate');

                test.refute.didSignal(firstListItem, 'TP.sig.UIDeactivate');
                test.refute.didSignal(firstListItem, 'TP.sig.UIDidDeactivate');

                TP.signal.reset();
            });

        //  --- Individual keydown/keyup

        test.getDriver().startSequence().
            keyDown(firstListItem, 'Enter').
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(firstListItem, 'pclass:active');

                test.refute.didSignal(firstListItem, 'TP.sig.UIActivate');
                test.refute.didSignal(firstListItem, 'TP.sig.UIDidActivate');

                TP.signal.reset();
            });

        test.getDriver().startSequence().
            keyUp(firstListItem, 'Enter').
            perform();

        test.then(
            function() {
                test.refute.didSignal(firstListItem, 'TP.sig.UIDeactivate');
                test.refute.didSignal(firstListItem, 'TP.sig.UIDidDeactivate');
            });
    });
}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ------------------------------------------------------------------------

TP.xctrls.list.Type.describe('TP.xctrls.list: get/set value',
function() {

    var testData,

        unloadURI,
        loadURI,

        windowContext;

    unloadURI = TP.uc(TP.sys.cfg('path.blank_page'));

    //  ---

    this.before(
        function() {

            var loc,
                listID;

            TP.$$setupCommonObjectValues();
            testData = TP.$$commonObjectValues;

            windowContext = this.getDriver().get('windowContext');

            loc = '~lib_test/src/xctrls/xctrls_list.xhtml';
            loadURI = TP.uc(loc);
            this.getDriver().setLocation(loadURI);

            listID = TP.computeOriginID(windowContext, loc, 'list3');
            this.thenWaitFor(listID, 'TP.sig.DOMReady');
        });

    //  ---

    this.beforeEach(
        function() {

            var tpElem;

            //  Make sure that each test starts with a freshly reset item
            tpElem = TP.byId('list2', windowContext);
            tpElem.deselectAll();

            tpElem = TP.byId('list3', windowContext);
            tpElem.deselectAll();
        });

    //  ---

    this.after(
        function() {

            //  Unload the current page by setting it to the blank
            this.getDriver().setLocation(unloadURI);

            //  Unregister the URI to avoid a memory leak
            loadURI.unregister();
        });

    //  ---

    this.it('xctrls:list - setting value to scalar values', function(test, options) {

        var tpElem,
            value;

        //  Per the markup, valid values for this control are 'foo', 'bar', and
        //  'baz'.

        tpElem = TP.byId('list2', windowContext);

        //  undefined
        tpElem.set('value', testData.at(TP.UNDEF));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  null
        tpElem.set('value', testData.at(TP.NULL));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  String
        tpElem.set('value', testData.at('String'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.str(testData.at('String')));

        //  Number
        tpElem.set('value', testData.at('Number'));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  Boolean
        tpElem.set('value', testData.at('Boolean'));
        value = tpElem.get('value');
        test.assert.isNull(value);
    });

    //  ---

    this.it('xctrls:list - setting value to complex object values', function(test, options) {

        var tpElem,
            value;

        //  Per the markup, valid values for this control are 'foo', 'bar', and
        //  'baz'.

        tpElem = TP.byId('list2', windowContext);

        //  RegExp
        tpElem.set('value', testData.at('RegExp'));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  Date
        tpElem.set('value', testData.at('Date'));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  Array
        tpElem.set('value', TP.ac('foo', 'bar', 'baz'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'foo');

        //  Object
        tpElem.set('value', {foo: 'baz'});
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'baz');

        //  TP.core.Hash
        tpElem.set('value', TP.hc('foo', 'bar'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'bar');
    });

    //  ---

    this.it('xctrls:list - setting value to markup', function(test, options) {

        var tpElem,
            value;

        tpElem = TP.byId('list2', windowContext);

        //  XMLDocument
        tpElem.set('value', TP.nodeCloneNode(testData.at('XMLDocument')));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  XMLElement
        tpElem.set('value', TP.nodeCloneNode(testData.at('XMLElement')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'bar');

        //  AttributeNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('AttributeNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'bar');

        //  TextNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('TextNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'foo');

        //  CDATASectionNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('CDATASectionNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'foo');

        //  PINode
        tpElem.set('value', TP.nodeCloneNode(testData.at('PINode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'bar');

        //  CommentNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('CommentNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'foo');

        //  DocumentFragmentNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('DocumentFragmentNode')));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  NodeList
        tpElem.set('value', testData.at('NodeList'));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  NamedNodeMap
        tpElem.set('value', testData.at('NamedNodeMap'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'baz');
    });

    //  ---

    this.it('xctrls:list (multiple) - setting value to scalar values', function(test, options) {

        var tpElem,
            value;

        tpElem = TP.byId('list3', windowContext);

        //  undefined
        tpElem.set('value', testData.at(TP.UNDEF));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  null
        tpElem.set('value', testData.at(TP.NULL));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  String
        tpElem.set('value', testData.at('String'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('bar'));

        //  reset
        tpElem.deselectAll();

        //  String (multiple)
        tpElem.set('value', 'foo;baz');
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('foo', 'baz'));

        //  reset
        tpElem.deselectAll();

        //  Number
        tpElem.set('value', testData.at('Number'));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  Boolean
        tpElem.set('value', testData.at('Boolean'));
        value = tpElem.get('value');
        test.assert.isEmpty(value);
    });

    //  ---

    this.it('xctrls:list (multiple) - setting value to complex object values', function(test, options) {

        var tpElem,
            value;

        tpElem = TP.byId('list3', windowContext);

        //  RegExp
        tpElem.set('value', testData.at('RegExp'));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  Date
        tpElem.set('value', testData.at('Date'));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  Array
        tpElem.set('value', TP.ac('foo', 'bar', 'baz'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('foo', 'bar', 'baz'));

        //  reset
        tpElem.deselectAll();

        //  Object
        tpElem.set('value', {foo: 'baz'});
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('baz'));

        //  reset
        tpElem.deselectAll();

        //  TP.core.Hash
        tpElem.set('value', TP.hc('foo', 'bar'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('bar'));
    });

    //  ---

    this.it('xctrls:list (multiple) - setting value to markup', function(test, options) {

        var tpElem,
            value;

        tpElem = TP.byId('list3', windowContext);

        //  XMLDocument
        tpElem.set('value', TP.nodeCloneNode(testData.at('XMLDocument')));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  XMLElement
        tpElem.set('value', TP.nodeCloneNode(testData.at('XMLElement')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('bar'));

        //  reset
        tpElem.deselectAll();

        //  AttributeNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('AttributeNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('bar'));

        //  reset
        tpElem.deselectAll();

        //  TextNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('TextNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('foo'));

        //  reset
        tpElem.deselectAll();

        //  CDATASectionNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('CDATASectionNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('foo'));

        //  reset
        tpElem.deselectAll();

        //  PINode
        tpElem.set('value', TP.nodeCloneNode(testData.at('PINode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('bar'));

        //  reset
        tpElem.deselectAll();

        //  CommentNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('CommentNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('foo'));

        //  reset
        tpElem.deselectAll();

        //  DocumentFragmentNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('DocumentFragmentNode')));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  NodeList
        tpElem.set('value', testData.at('NodeList'));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  NamedNodeMap
        tpElem.set('value', testData.at('NamedNodeMap'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('baz'));
    });
}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ------------------------------------------------------------------------

TP.xctrls.list.Type.describe('TP.xctrls.list: selection management',
function() {

    var getSelectedIndices,

        unloadURI,
        loadURI,

        windowContext;

    unloadURI = TP.uc(TP.sys.cfg('path.blank_page'));

    getSelectedIndices = function(aTPElem) {

        var itemIndices;

        itemIndices = aTPElem.get('listitems').collect(
                            function(valueTPElem, anIndex) {

                                if (valueTPElem.hasAttribute(
                                                    'pclass:selected')) {
                                    return anIndex;
                                }
                            });

        //  Removes nulls and undefineds
        return itemIndices.compact();
    };

    //  ---

    this.before(
        function() {

            var loc,
                listID;

            TP.$$setupCommonObjectValues();

            windowContext = this.getDriver().get('windowContext');

            loc = '~lib_test/src/xctrls/xctrls_list.xhtml';
            loadURI = TP.uc(loc);
            this.getDriver().setLocation(loadURI);

            listID = TP.computeOriginID(windowContext, loc, 'list3');
            this.thenWaitFor(listID, 'TP.sig.DOMReady');
        });

    //  ---

    this.beforeEach(
        function() {

            var tpElem;

            //  Make sure that each test starts with a freshly reset item
            tpElem = TP.byId('list3', windowContext);
            tpElem.deselectAll();
        });

    //  ---

    this.after(
        function() {

            //  Unload the current page by setting it to the blank
            this.getDriver().setLocation(unloadURI);

            //  Unregister the URI to avoid a memory leak
            loadURI.unregister();
        });

    //  ---

    this.it('xctrls:list - addSelection', function(test, options) {

        var tpElem;

        tpElem = TP.byId('list3', windowContext);

        //  ---

        //  allowsMultiples

        //  list3 is configured to allow multiples
        test.assert.isTrue(tpElem.allowsMultiples());

        //  ---

        //  (property defaults to 'value')
        tpElem.deselectAll();
        tpElem.addSelection(TP.ac('bar', 'baz'));
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(1, 2));

        //  'value' property
        tpElem.deselectAll();
        tpElem.addSelection(TP.ac('foo', 'bar'), 'value');
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(0, 1));
    });

    //  ---

    this.it('xctrls:list - removeSelection', function(test, options) {

        var tpElem;

        tpElem = TP.byId('list3', windowContext);

        //  (property defaults to 'value')
        tpElem.deselectAll();
        tpElem.addSelection(TP.ac('foo', 'bar'));
        tpElem.removeSelection('baz');
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(0, 1));

        tpElem.deselectAll();
        tpElem.addSelection(TP.ac('bar', 'baz'));
        tpElem.removeSelection('baz');
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(1));

        //  'value' property
        tpElem.deselectAll();
        tpElem.addSelection(TP.ac('foo', 'baz'));
        tpElem.removeSelection('bar', 'value');
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(0, 2));

        tpElem.deselectAll();
        tpElem.addSelection(TP.ac('bar', 'baz'));
        tpElem.removeSelection('bar', 'value');
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(2));
    });

    //  ---

    this.it('xctrls:list - selectAll', function(test, options) {

        var tpElem;

        tpElem = TP.byId('list3', windowContext);

        tpElem.selectAll();
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(0, 1, 2));
    });

    //  ---

    this.it('xctrls:list - select', function(test, options) {

        var tpElem;

        tpElem = TP.byId('list3', windowContext);

        tpElem.deselectAll();
        tpElem.select('bar');
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(1));
        tpElem.select('baz');
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(1, 2));

        tpElem.deselectAll();
        tpElem.select(TP.ac('foo', 'baz'));
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(0, 2));
    });

    //  ---

    this.it('xctrls:list - select with RegExp', function(test, options) {

        var tpElem;

        tpElem = TP.byId('list3', windowContext);

        tpElem.deselectAll();
        tpElem.select(/ba/);
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(1, 2));
    });

    //  ---

    this.it('xctrls:list - deselect', function(test, options) {

        var tpElem;

        tpElem = TP.byId('list3', windowContext);

        tpElem.selectAll();
        tpElem.deselect('bar');
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(0, 2));
        tpElem.deselect('baz');
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(0));

        tpElem.selectAll();
        tpElem.deselect(TP.ac('foo', 'baz'));
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(1));
    });

    //  ---

    this.it('xctrls:list - deselect with RegExp', function(test, options) {

        var tpElem;

        tpElem = TP.byId('list3', windowContext);

        tpElem.selectAll();
        tpElem.deselect(/ba/);
        test.assert.isEqualTo(getSelectedIndices(tpElem), TP.ac(0));

    });

}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
