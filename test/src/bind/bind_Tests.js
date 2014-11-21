//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ========================================================================

//  ========================================================================
//  bind:
//  ========================================================================

TP.bind.XMLNS.Type.describe('bind: parsing binds',
function() {

    this.it('binding attribute parsing tests', function(test, options) {
        var testMarkup,
            info;

        //  NB: These tests test only for 'bind:in', not 'bind:out' or
        //  'bind:io', but they're all subject to the same rules.

        //  Fully formed URI, no fragment, single value
        testMarkup = TP.tpelem('<test xmlns:bind="http://www.technicalpursuit.com/2005/binding" bind:in="foo: urn:tibet:foo"/>');
        info = testMarkup.getBindingInfoFrom('in');
        test.assert.hasKey(info, 'foo');
        test.assert.isEqualTo(info.at('foo'), 'urn:tibet:foo');

        //  Fully formed URI, with fragment, single value
        testMarkup = TP.tpelem('<test xmlns:bind="http://www.technicalpursuit.com/2005/binding" bind:in="foo: urn:tibet:foo#tibet(foo)"/>');
        info = testMarkup.getBindingInfoFrom('in');
        test.assert.hasKey(info, 'foo');
        test.assert.isEqualTo(info.at('foo'), 'urn:tibet:foo#tibet(foo)');

        //  Fully formed URI, no fragment, multiple values
        testMarkup = TP.tpelem('<test xmlns:bind="http://www.technicalpursuit.com/2005/binding" bind:in="foo: urn:tibet:foo; bar: urn:tibet:bar"/>');
        info = testMarkup.getBindingInfoFrom('in');
        test.assert.hasKey(info, 'foo');
        test.assert.isEqualTo(info.at('foo'), 'urn:tibet:foo');
        test.assert.hasKey(info, 'bar');
        test.assert.isEqualTo(info.at('bar'), 'urn:tibet:bar');

        //  Fully formed URI, with fragment, multiple values
        testMarkup = TP.tpelem('<test xmlns:bind="http://www.technicalpursuit.com/2005/binding" bind:in="foo: urn:tibet:foo#tibet(foo); bar: urn:tibet:bar#tibet(bar)"/>');
        info = testMarkup.getBindingInfoFrom('in');
        test.assert.hasKey(info, 'foo');
        test.assert.isEqualTo(info.at('foo'), 'urn:tibet:foo#tibet(foo)');
        test.assert.hasKey(info, 'bar');
        test.assert.isEqualTo(info.at('bar'), 'urn:tibet:bar#tibet(bar)');

        //  Partially formed URI, with fragment (specified pointer scheme), single value
        testMarkup = TP.tpelem('<test xmlns:bind="http://www.technicalpursuit.com/2005/binding" bind:scope="urn:tibet:foo" bind:in="foo: #tibet(foo)"/>');
        info = testMarkup.getBindingInfoFrom('in');
        test.assert.hasKey(info, 'foo');
        test.assert.isEqualTo(info.at('foo'), 'urn:tibet:foo#tibet(foo)');

        //  Partially formed URI, with fragment (unspecified pointer scheme), single value
        testMarkup = TP.tpelem('<test xmlns:bind="http://www.technicalpursuit.com/2005/binding" bind:scope="urn:tibet:foo" bind:in="foo: foo"/>');
        info = testMarkup.getBindingInfoFrom('in');
        test.assert.hasKey(info, 'foo');
        test.assert.isEqualTo(info.at('foo'), 'urn:tibet:foo#tibet(foo)');

        //  Partially formed URI, with fragment (specified pointer scheme), multiple values
        testMarkup = TP.tpelem('<test xmlns:bind="http://www.technicalpursuit.com/2005/binding" bind:scope="urn:tibet:foo" bind:in="foo: #tibet(foo); bar: #tibet(bar)"/>');
        info = testMarkup.getBindingInfoFrom('in');
        test.assert.hasKey(info, 'foo');
        test.assert.isEqualTo(info.at('foo'), 'urn:tibet:foo#tibet(foo)');
        test.assert.hasKey(info, 'bar');
        test.assert.isEqualTo(info.at('bar'), 'urn:tibet:foo#tibet(bar)');

        //  Partially formed URI, with fragment (unspecified pointer scheme), multiple values
        testMarkup = TP.tpelem('<test xmlns:bind="http://www.technicalpursuit.com/2005/binding" bind:scope="urn:tibet:foo" bind:in="foo: foo; bar: bar"/>');
        info = testMarkup.getBindingInfoFrom('in');
        test.assert.hasKey(info, 'foo');
        test.assert.isEqualTo(info.at('foo'), 'urn:tibet:foo#tibet(foo)');
        test.assert.hasKey(info, 'bar');
        test.assert.isEqualTo(info.at('bar'), 'urn:tibet:foo#tibet(bar)');

        //  Partially formed URI, with fragment (specified pointer scheme), single value, split path
        testMarkup = TP.tpelem('<test xmlns:bind="http://www.technicalpursuit.com/2005/binding" bind:scope="urn:tibet:foo#tibet(foo)" bind:in="bar: bar"/>');
        info = testMarkup.getBindingInfoFrom('in');
        test.assert.hasKey(info, 'bar');
        test.assert.isEqualTo(info.at('bar'), 'urn:tibet:foo#tibet(foo.bar)');

        //  Partially formed URI, with fragment (specified pointer scheme), multiple values, split path
        testMarkup = TP.tpelem('<test xmlns:bind="http://www.technicalpursuit.com/2005/binding" bind:scope="urn:tibet:foo#tibet(foo)" bind:in="foo: foo; bar: bar"/>');
        info = testMarkup.getBindingInfoFrom('in');
        test.assert.hasKey(info, 'foo');
        test.assert.isEqualTo(info.at('foo'), 'urn:tibet:foo#tibet(foo.foo)');
        test.assert.hasKey(info, 'bar');
        test.assert.isEqualTo(info.at('bar'), 'urn:tibet:foo#tibet(foo.bar)');
    });
});

//  ------------------------------------------------------------------------

TP.bind.XMLNS.Type.describe('bind: simple binds',
function() {

    this.beforeEach(
        function() {
            this.getSuite().startTrackingSignals();
        });

    this.afterEach(
        function() {
            this.getSuite().stopTrackingSignals();
        });

    //  ---

    this.it('simple binding with text fields - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind1.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {
                var modelObj,
                    lastNameField;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind1_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind1_person#xpath1(/person/firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind1_person#xpath1(/person/lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind1_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField').get('value'),
                    'Smith');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/lastname')),
                    'Smith');

                //  Change the content via 'user' interaction

                lastNameField = TP.byOID('lastNameField');

                lastNameField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Jones', lastNameField).
                    sendEvent(TP.hc('type', 'change'), lastNameField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField.get('value'),
                            'Jones');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/lastname')),
                            'Jones');
                    });

                //  firstNameField is just another text field - same logic
                //  should work
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('simple binding with various XHTML controls - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind2.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {
                var modelObj,
                    lastNameField,
                    descriptionField,
                    genderField,
                    genderFieldOption1,
                    petRadio3,
                    colorCheckbox1;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind2_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind2_person#xpath1(/person/firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind2_person#xpath1(/person/lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind2_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/lastname')),
                    'Jones');

                //  firstNameField is just another text field - no reason to
                //  test it too

                test.assert.isEqualTo(
                    TP.byOID('descriptionField').get('value'),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/description')),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.byOID('genderField').get('value'),
                    'f');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/gender')),
                    'f');

                test.assert.isEqualTo(
                    TP.byOID('petRadio1').get('value'),
                    'cat');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/pet')),
                    'cat');

                test.assert.isEqualTo(
                    TP.byOID('colorCheckbox1').get('value'),
                    TP.ac('blue'));

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/color')),
                    'blue');

                //  Change the content via 'user' interaction

                lastNameField = TP.byOID('lastNameField');

                lastNameField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Jones', lastNameField).
                    sendEvent(TP.hc('type', 'change'), lastNameField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField.get('value'),
                            'Jones');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/lastname')),
                            'Jones');
                    });

                //  firstNameField is just another text field - same logic
                //  should work

                descriptionField = TP.byOID('descriptionField');

                descriptionField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('She is great!', descriptionField).
                    sendEvent(TP.hc('type', 'change'), descriptionField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            descriptionField.get('value'),
                            'She is great!');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/description')),
                            'She is great!');
                    });

                genderField = TP.byOID('genderField');
                genderFieldOption1 = genderField.getElementArray().at(0);

                test.getDriver().startSequence().
                    click(genderFieldOption1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            genderField.get('value'),
                            'm');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/gender')),
                            'm');
                    });

                petRadio3 = TP.byOID('petRadio3');

                test.getDriver().startSequence().
                    click(petRadio3).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            petRadio3.get('value'),
                            'fish');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/pet')),
                            'fish');
                    });

                colorCheckbox1 = TP.byOID('colorCheckbox1');

                test.getDriver().startSequence().
                    click(colorCheckbox1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            colorCheckbox1.get('value'),
                            TP.ac('red', 'blue'));

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/color')),
                            'red, blue');
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('bind:scope, no fragment, qualified binding with various XHTML controls - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind3.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {
                var modelObj,
                    lastNameField,
                    descriptionField,
                    genderField,
                    genderFieldOption1,
                    petRadio3,
                    colorCheckbox1;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind3_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind3_person#xpath1(/person/firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind3_person#xpath1(/person/lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind3_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/lastname')),
                    'Jones');

                //  firstNameField is just another text field - no reason to
                //  test it too

                test.assert.isEqualTo(
                    TP.byOID('descriptionField').get('value'),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/description')),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.byOID('genderField').get('value'),
                    'f');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/gender')),
                    'f');

                test.assert.isEqualTo(
                    TP.byOID('petRadio1').get('value'),
                    'cat');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/pet')),
                    'cat');

                test.assert.isEqualTo(
                    TP.byOID('colorCheckbox1').get('value'),
                    TP.ac('blue'));

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/color')),
                    'blue');

                //  Change the content via 'user' interaction

                lastNameField = TP.byOID('lastNameField');

                lastNameField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Jones', lastNameField).
                    sendEvent(TP.hc('type', 'change'), lastNameField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField.get('value'),
                            'Jones');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/lastname')),
                            'Jones');
                    });

                //  firstNameField is just another text field - same logic
                //  should work

                descriptionField = TP.byOID('descriptionField');

                descriptionField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('She is great!', descriptionField).
                    sendEvent(TP.hc('type', 'change'), descriptionField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            descriptionField.get('value'),
                            'She is great!');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/description')),
                            'She is great!');
                    });

                genderField = TP.byOID('genderField');
                genderFieldOption1 = genderField.getElementArray().at(0);

                test.getDriver().startSequence().
                    click(genderFieldOption1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            genderField.get('value'),
                            'm');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/gender')),
                            'm');
                    });

                petRadio3 = TP.byOID('petRadio3');

                test.getDriver().startSequence().
                    click(petRadio3).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            petRadio3.get('value'),
                            'fish');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/pet')),
                            'fish');
                    });

                colorCheckbox1 = TP.byOID('colorCheckbox1');

                test.getDriver().startSequence().
                    click(colorCheckbox1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            colorCheckbox1.get('value'),
                            TP.ac('red', 'blue'));

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/color')),
                            'red, blue');
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('bind:scope, single-level fragment, qualified binding with various XHTML controls - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind4.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {
                var modelObj,
                    lastNameField,
                    descriptionField,
                    genderField,
                    genderFieldOption1,
                    petRadio3,
                    colorCheckbox1;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind4_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind4_person#xpath1(/person/firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind4_person#xpath1(/person/lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind4_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/lastname')),
                    'Jones');

                //  firstNameField is just another text field - no reason to
                //  test it too

                test.assert.isEqualTo(
                    TP.byOID('descriptionField').get('value'),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/description')),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.byOID('genderField').get('value'),
                    'f');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/gender')),
                    'f');

                test.assert.isEqualTo(
                    TP.byOID('petRadio1').get('value'),
                    'cat');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/pet')),
                    'cat');

                test.assert.isEqualTo(
                    TP.byOID('colorCheckbox1').get('value'),
                    TP.ac('blue'));

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/color')),
                    'blue');

                //  Change the content via 'user' interaction

                lastNameField = TP.byOID('lastNameField');

                lastNameField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Jones', lastNameField).
                    sendEvent(TP.hc('type', 'change'), lastNameField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField.get('value'),
                            'Jones');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/lastname')),
                            'Jones');
                    });

                //  firstNameField is just another text field - same logic
                //  should work

                descriptionField = TP.byOID('descriptionField');

                descriptionField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('She is great!', descriptionField).
                    sendEvent(TP.hc('type', 'change'), descriptionField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            descriptionField.get('value'),
                            'She is great!');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/description')),
                            'She is great!');
                    });

                genderField = TP.byOID('genderField');
                genderFieldOption1 = genderField.getElementArray().at(0);

                test.getDriver().startSequence().
                    click(genderFieldOption1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            genderField.get('value'),
                            'm');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/gender')),
                            'm');
                    });

                petRadio3 = TP.byOID('petRadio3');

                test.getDriver().startSequence().
                    click(petRadio3).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            petRadio3.get('value'),
                            'fish');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/pet')),
                            'fish');
                    });

                colorCheckbox1 = TP.byOID('colorCheckbox1');

                test.getDriver().startSequence().
                    click(colorCheckbox1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            colorCheckbox1.get('value'),
                            TP.ac('red', 'blue'));

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/color')),
                            'red, blue');
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(5000);

    //  ---

    this.it('bind:scope, multi-level fragment, qualified binding with various XHTML controls - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind5.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {
                var modelObj,
                    lastNameField,
                    descriptionField,
                    genderField,
                    genderFieldOption1,
                    petRadio3,
                    colorCheckbox1;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind5_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind5_person#xpath1(/person/firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind5_person#xpath1(/person/lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind5_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/lastname')),
                    'Jones');

                //  firstNameField is just another text field - no reason to
                //  test it too

                test.assert.isEqualTo(
                    TP.byOID('descriptionField').get('value'),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/description')),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.byOID('genderField').get('value'),
                    'f');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/gender')),
                    'f');

                test.assert.isEqualTo(
                    TP.byOID('petRadio1').get('value'),
                    'cat');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/pet')),
                    'cat');

                test.assert.isEqualTo(
                    TP.byOID('colorCheckbox1').get('value'),
                    TP.ac('blue'));

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/person/color')),
                    'blue');

                //  Change the content via 'user' interaction

                lastNameField = TP.byOID('lastNameField');

                lastNameField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Jones', lastNameField).
                    sendEvent(TP.hc('type', 'change'), lastNameField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField.get('value'),
                            'Jones');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/lastname')),
                            'Jones');
                    });

                //  firstNameField is just another text field - same logic
                //  should work

                descriptionField = TP.byOID('descriptionField');

                descriptionField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('She is great!', descriptionField).
                    sendEvent(TP.hc('type', 'change'), descriptionField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            descriptionField.get('value'),
                            'She is great!');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/description')),
                            'She is great!');
                    });

                genderField = TP.byOID('genderField');
                genderFieldOption1 = genderField.getElementArray().at(0);

                test.getDriver().startSequence().
                    click(genderFieldOption1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            genderField.get('value'),
                            'm');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/gender')),
                            'm');
                    });

                petRadio3 = TP.byOID('petRadio3');

                test.getDriver().startSequence().
                    click(petRadio3).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            petRadio3.get('value'),
                            'fish');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/pet')),
                            'fish');
                    });

                colorCheckbox1 = TP.byOID('colorCheckbox1');

                test.getDriver().startSequence().
                    click(colorCheckbox1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            colorCheckbox1.get('value'),
                            TP.ac('red', 'blue'));

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/person/color')),
                            'red, blue');
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(5000);

    //  ---

    this.it('simple binding with text fields - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind6.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {
                var modelObj,
                    lastNameField;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind6_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind6_person#tibet(person.firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind6_person#tibet(person.lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind6_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField').get('value'),
                    'Smith');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.lastname')),
                    'Smith');

                //  Change the content via 'user' interaction

                lastNameField = TP.byOID('lastNameField');

                lastNameField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Jones', lastNameField).
                    sendEvent(TP.hc('type', 'change'), lastNameField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField.get('value'),
                            'Jones');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.lastname')),
                            'Jones');
                    });

                //  firstNameField is just another text field - same logic
                //  should work
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('simple binding with various XHTML controls - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind7.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {
                var modelObj,
                    lastNameField,
                    descriptionField,
                    genderField,
                    genderFieldOption1,
                    petRadio3,
                    colorCheckbox1;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind7_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind7_person#tibet(person.firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind7_person#tibet(person.lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind7_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.lastname')),
                    'Jones');

                //  firstNameField is just another text field - no reason to
                //  test it too

                test.assert.isEqualTo(
                    TP.byOID('descriptionField').get('value'),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.description')),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.byOID('genderField').get('value'),
                    'f');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.gender')),
                    'f');

                test.assert.isEqualTo(
                    TP.byOID('petRadio1').get('value'),
                    'cat');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.pet')),
                    'cat');

                test.assert.isEqualTo(
                    TP.byOID('colorCheckbox1').get('value'),
                    TP.ac('blue'));

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.color')),
                    'blue');

                //  Change the content via 'user' interaction

                lastNameField = TP.byOID('lastNameField');

                lastNameField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Jones', lastNameField).
                    sendEvent(TP.hc('type', 'change'), lastNameField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField.get('value'),
                            'Jones');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.lastname')),
                            'Jones');
                    });

                //  firstNameField is just another text field - same logic
                //  should work

                descriptionField = TP.byOID('descriptionField');

                descriptionField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('She is great!', descriptionField).
                    sendEvent(TP.hc('type', 'change'), descriptionField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            descriptionField.get('value'),
                            'She is great!');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.description')),
                            'She is great!');
                    });

                genderField = TP.byOID('genderField');
                genderFieldOption1 = genderField.getElementArray().at(0);

                test.getDriver().startSequence().
                    click(genderFieldOption1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            genderField.get('value'),
                            'm');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.gender')),
                            'm');
                    });

                petRadio3 = TP.byOID('petRadio3');

                test.getDriver().startSequence().
                    click(petRadio3).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            petRadio3.get('value'),
                            'fish');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.pet')),
                            'fish');
                    });

                colorCheckbox1 = TP.byOID('colorCheckbox1');

                test.getDriver().startSequence().
                    click(colorCheckbox1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            colorCheckbox1.get('value'),
                            TP.ac('red', 'blue'));

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.color')),
                            TP.ac('red', 'blue'));
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('bind:scope, no fragment, qualified binding with various XHTML controls - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind8.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {
                var modelObj,
                    lastNameField,
                    descriptionField,
                    genderField,
                    genderFieldOption1,
                    petRadio3,
                    colorCheckbox1;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind8_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind8_person#tibet(person.firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind8_person#tibet(person.lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind8_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.lastname')),
                    'Jones');

                //  firstNameField is just another text field - no reason to
                //  test it too

                test.assert.isEqualTo(
                    TP.byOID('descriptionField').get('value'),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.description')),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.byOID('genderField').get('value'),
                    'f');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.gender')),
                    'f');

                test.assert.isEqualTo(
                    TP.byOID('petRadio1').get('value'),
                    'cat');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.pet')),
                    'cat');

                test.assert.isEqualTo(
                    TP.byOID('colorCheckbox1').get('value'),
                    TP.ac('blue'));

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.color')),
                    'blue');

                //  Change the content via 'user' interaction

                lastNameField = TP.byOID('lastNameField');

                lastNameField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Jones', lastNameField).
                    sendEvent(TP.hc('type', 'change'), lastNameField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField.get('value'),
                            'Jones');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.lastname')),
                            'Jones');
                    });

                //  firstNameField is just another text field - same logic
                //  should work

                descriptionField = TP.byOID('descriptionField');

                descriptionField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('She is great!', descriptionField).
                    sendEvent(TP.hc('type', 'change'), descriptionField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            descriptionField.get('value'),
                            'She is great!');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.description')),
                            'She is great!');
                    });

                genderField = TP.byOID('genderField');
                genderFieldOption1 = genderField.getElementArray().at(0);

                test.getDriver().startSequence().
                    click(genderFieldOption1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            genderField.get('value'),
                            'm');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.gender')),
                            'm');
                    });

                petRadio3 = TP.byOID('petRadio3');

                test.getDriver().startSequence().
                    click(petRadio3).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            petRadio3.get('value'),
                            'fish');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.pet')),
                            'fish');
                    });

                colorCheckbox1 = TP.byOID('colorCheckbox1');

                test.getDriver().startSequence().
                    click(colorCheckbox1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            colorCheckbox1.get('value'),
                            TP.ac('red', 'blue'));

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.color')),
                            TP.ac('red', 'blue'));
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('bind:scope, single-level fragment, qualified binding with various XHTML controls - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind9.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {
                var modelObj,
                    lastNameField,
                    descriptionField,
                    genderField,
                    genderFieldOption1,
                    petRadio3,
                    colorCheckbox1;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind9_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind9_person#tibet(person.firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind9_person#tibet(person.lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind9_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.lastname')),
                    'Jones');

                //  firstNameField is just another text field - no reason to
                //  test it too

                test.assert.isEqualTo(
                    TP.byOID('descriptionField').get('value'),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.description')),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.byOID('genderField').get('value'),
                    'f');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.gender')),
                    'f');

                test.assert.isEqualTo(
                    TP.byOID('petRadio1').get('value'),
                    'cat');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.pet')),
                    'cat');

                test.assert.isEqualTo(
                    TP.byOID('colorCheckbox1').get('value'),
                    TP.ac('blue'));

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.color')),
                    'blue');

                //  Change the content via 'user' interaction

                lastNameField = TP.byOID('lastNameField');

                lastNameField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Jones', lastNameField).
                    sendEvent(TP.hc('type', 'change'), lastNameField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField.get('value'),
                            'Jones');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.lastname')),
                            'Jones');
                    });

                //  firstNameField is just another text field - same logic
                //  should work

                descriptionField = TP.byOID('descriptionField');

                descriptionField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('She is great!', descriptionField).
                    sendEvent(TP.hc('type', 'change'), descriptionField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            descriptionField.get('value'),
                            'She is great!');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.description')),
                            'She is great!');
                    });

                genderField = TP.byOID('genderField');
                genderFieldOption1 = genderField.getElementArray().at(0);

                test.getDriver().startSequence().
                    click(genderFieldOption1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            genderField.get('value'),
                            'm');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.gender')),
                            'm');
                    });

                petRadio3 = TP.byOID('petRadio3');

                test.getDriver().startSequence().
                    click(petRadio3).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            petRadio3.get('value'),
                            'fish');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.pet')),
                            'fish');
                    });

                colorCheckbox1 = TP.byOID('colorCheckbox1');

                test.getDriver().startSequence().
                    click(colorCheckbox1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            colorCheckbox1.get('value'),
                            TP.ac('red', 'blue'));

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.color')),
                            TP.ac('red', 'blue'));
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('bind:scope, multi-level fragment, qualified binding with various XHTML controls - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind10.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {
                var modelObj,
                    lastNameField,
                    descriptionField,
                    genderField,
                    genderFieldOption1,
                    petRadio3,
                    colorCheckbox1;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind10_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind10_person#tibet(person.firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind10_person#tibet(person.lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind10_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.lastname')),
                    'Jones');

                //  firstNameField is just another text field - no reason to
                //  test it too

                test.assert.isEqualTo(
                    TP.byOID('descriptionField').get('value'),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.description')),
                    'Ms. Jones is a great lady');

                test.assert.isEqualTo(
                    TP.byOID('genderField').get('value'),
                    'f');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.gender')),
                    'f');

                test.assert.isEqualTo(
                    TP.byOID('petRadio1').get('value'),
                    'cat');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.pet')),
                    'cat');

                test.assert.isEqualTo(
                    TP.byOID('colorCheckbox1').get('value'),
                    TP.ac('blue'));

                test.assert.isEqualTo(
                    TP.val(modelObj.get('person.color')),
                    'blue');

                //  Change the content via 'user' interaction

                lastNameField = TP.byOID('lastNameField');

                lastNameField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Jones', lastNameField).
                    sendEvent(TP.hc('type', 'change'), lastNameField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField.get('value'),
                            'Jones');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.lastname')),
                            'Jones');
                    });

                //  firstNameField is just another text field - same logic
                //  should work

                descriptionField = TP.byOID('descriptionField');

                descriptionField.clearValue();

                test.getDriver().startSequence().
                    sendKeys('She is great!', descriptionField).
                    sendEvent(TP.hc('type', 'change'), descriptionField).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            descriptionField.get('value'),
                            'She is great!');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.description')),
                            'She is great!');
                    });

                genderField = TP.byOID('genderField');
                genderFieldOption1 = genderField.getElementArray().at(0);

                test.getDriver().startSequence().
                    click(genderFieldOption1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            genderField.get('value'),
                            'm');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.gender')),
                            'm');
                    });

                petRadio3 = TP.byOID('petRadio3');

                test.getDriver().startSequence().
                    click(petRadio3).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            petRadio3.get('value'),
                            'fish');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.pet')),
                            'fish');
                    });

                colorCheckbox1 = TP.byOID('colorCheckbox1');

                test.getDriver().startSequence().
                    click(colorCheckbox1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            colorCheckbox1.get('value'),
                            TP.ac('red', 'blue'));

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('person.color')),
                            TP.ac('red', 'blue'));
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });
}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ------------------------------------------------------------------------

TP.bind.XMLNS.Type.describe('bind: numerically indexed binds',
function() {

    this.beforeEach(
        function() {
            this.getSuite().startTrackingSignals();
        });

    this.afterEach(
        function() {
            this.getSuite().stopTrackingSignals();
        });

    //  ---

    this.it('simple numeric indexed binds - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind11.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                var modelObj,
                    lastNameField1,
                    lastNameField2;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind11_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind11_person#xpath1(/people/person[1]/firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind11_person#xpath1(/people/person[1]/lastname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind11_person#xpath1(/people/person[2]/firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind11_person#xpath1(/people/person[2]/lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind11_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField1').get('value'),
                    'Smith');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[1]/lastname')),
                    'Smith');

                test.assert.isEqualTo(
                    TP.byOID('lastNameField2').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[2]/lastname')),
                    'Jones');

                //  Change the content via 'user' interaction

                lastNameField1 = TP.byOID('lastNameField1');

                lastNameField1.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Lyon', lastNameField1).
                    sendEvent(TP.hc('type', 'change'), lastNameField1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField1.get('value'),
                            'Lyon');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/people/person[1]/lastname')),
                            'Lyon');
                    });

                lastNameField2 = TP.byOID('lastNameField2');

                lastNameField2.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Weber', lastNameField2).
                    sendEvent(TP.hc('type', 'change'), lastNameField2).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField2.get('value'),
                            'Weber');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/people/person[2]/lastname')),
                            'Weber');
                    });

                //  firstNameField1 and firstNameField2 are just other text
                //  fields - same logic should work
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('simple numeric indexed binds with scoping - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind12.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                var modelObj,
                    lastNameField1,
                    lastNameField2;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind12_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind12_person#xpath1(/people/person[1]/firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind12_person#xpath1(/people/person[1]/lastname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind12_person#xpath1(/people/person[2]/firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind12_person#xpath1(/people/person[2]/lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind12_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField1').get('value'),
                    'Smith');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[1]/lastname')),
                    'Smith');

                test.assert.isEqualTo(
                    TP.byOID('lastNameField2').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[2]/lastname')),
                    'Jones');

                //  Change the content via 'user' interaction

                lastNameField1 = TP.byOID('lastNameField1');

                lastNameField1.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Lyon', lastNameField1).
                    sendEvent(TP.hc('type', 'change'), lastNameField1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField1.get('value'),
                            'Lyon');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/people/person[1]/lastname')),
                            'Lyon');
                    });

                lastNameField2 = TP.byOID('lastNameField2');

                lastNameField2.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Weber', lastNameField2).
                    sendEvent(TP.hc('type', 'change'), lastNameField2).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField2.get('value'),
                            'Weber');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/people/person[2]/lastname')),
                            'Weber');
                    });

                //  firstNameField1 and firstNameField2 are just other text
                //  fields - same logic should work
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('simple numeric indexed binds - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind13.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                var modelObj,
                    lastNameField1,
                    lastNameField2;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind13_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind13_person#tibet(people[0].firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind13_person#tibet(people[0].lastname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind13_person#tibet(people[1].firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind13_person#tibet(people[1].lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind13_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField1').get('value'),
                    'Smith');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[0].lastname')),
                    'Smith');

                test.assert.isEqualTo(
                    TP.byOID('lastNameField2').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[1].lastname')),
                    'Jones');

                //  Change the content via 'user' interaction

                lastNameField1 = TP.byOID('lastNameField1');

                lastNameField1.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Lyon', lastNameField1).
                    sendEvent(TP.hc('type', 'change'), lastNameField1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField1.get('value'),
                            'Lyon');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('people[0].lastname')),
                            'Lyon');
                    });

                lastNameField2 = TP.byOID('lastNameField2');

                lastNameField2.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Weber', lastNameField2).
                    sendEvent(TP.hc('type', 'change'), lastNameField2).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField2.get('value'),
                            'Weber');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('people[1].lastname')),
                            'Weber');
                    });

                //  firstNameField1 and firstNameField2 are just other text
                //  fields - same logic should work
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('simple numeric indexed binds with scoping - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind14.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                var modelObj,
                    lastNameField1,
                    lastNameField2;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind14_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind14_person#tibet(people[0].firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind14_person#tibet(people[0].lastname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind14_person#tibet(people[1].firstname)'),
                        'TP.sig.StructureChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind14_person#tibet(people[1].lastname)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind14_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField1').get('value'),
                    'Smith');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[0].lastname')),
                    'Smith');

                test.assert.isEqualTo(
                    TP.byOID('lastNameField2').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[1].lastname')),
                    'Jones');

                //  Change the content via 'user' interaction

                lastNameField1 = TP.byOID('lastNameField1');

                lastNameField1.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Lyon', lastNameField1).
                    sendEvent(TP.hc('type', 'change'), lastNameField1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField1.get('value'),
                            'Lyon');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('people[0].lastname')),
                            'Lyon');
                    });

                lastNameField2 = TP.byOID('lastNameField2');

                lastNameField2.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Weber', lastNameField2).
                    sendEvent(TP.hc('type', 'change'), lastNameField2).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField2.get('value'),
                            'Weber');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('people[1].lastname')),
                            'Weber');
                    });

                //  firstNameField1 and firstNameField2 are just other text
                //  fields - same logic should work
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });
}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ------------------------------------------------------------------------

TP.bind.XMLNS.Type.describe('bind: bind repeats',
function() {

    this.beforeEach(
        function() {
            this.getSuite().startTrackingSignals();
        });

    this.afterEach(
        function() {
            this.getSuite().stopTrackingSignals();
        });

    //  ---

    this.it('repeat binding with text fields - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind15.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                var modelObj,
                    lastNameField1,
                    lastNameField2;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind15_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind15_person#xpath1(/people/person)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind15_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField1').get('value'),
                    'Smith');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[1]/lastname')),
                    'Smith');

                test.assert.isEqualTo(
                    TP.byOID('lastNameField2').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[2]/lastname')),
                    'Jones');

                //  Change the content via 'user' interaction

                lastNameField1 = TP.byOID('lastNameField1');

                lastNameField1.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Lyon', lastNameField1).
                    sendEvent(TP.hc('type', 'change'), lastNameField1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField1.get('value'),
                            'Lyon');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/people/person[1]/lastname')),
                            'Lyon');
                    });

                lastNameField2 = TP.byOID('lastNameField2');

                lastNameField2.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Weber', lastNameField2).
                    sendEvent(TP.hc('type', 'change'), lastNameField2).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField2.get('value'),
                            'Weber');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/people/person[2]/lastname')),
                            'Weber');
                    });

                //  firstNameField1 and firstNameField2 are just other text
                //  fields - same logic should work
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('nested repeat binding with text fields - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind16.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                var modelObj,
                    lastNameField1,
                    lastNameField2,
                    addressStreetField11,
                    addressCityField22;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind16_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind16_person#xpath1(/people/person)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind16_person').getResource();

                //  ---

                test.assert.isEqualTo(
                    TP.byOID('lastNameField1').get('value'),
                    'Smith');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[1]/lastname')),
                    'Smith');

                test.assert.isEqualTo(
                    TP.byOID('addressStreetField11').get('value'),
                    '111 Main St.');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[1]/addresses/address[1]/street')),
                    '111 Main St.');

                test.assert.isEqualTo(
                    TP.byOID('addressStreetField12').get('value'),
                    '222 State St.');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[1]/addresses/address[2]/street')),
                    '222 State St.');

                //  ---

                test.assert.isEqualTo(
                    TP.byOID('lastNameField2').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[2]/lastname')),
                    'Jones');

                test.assert.isEqualTo(
                    TP.byOID('addressCityField21').get('value'),
                    'Yet Another Town');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[2]/addresses/address[1]/city')),
                    'Yet Another Town');

                test.assert.isEqualTo(
                    TP.byOID('addressCityField22').get('value'),
                    'One More Town');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('/people/person[2]/addresses/address[2]/city')),
                    'One More Town');

                //  Change the content via 'user' interaction

                lastNameField1 = TP.byOID('lastNameField1');

                lastNameField1.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Lyon', lastNameField1).
                    sendEvent(TP.hc('type', 'change'), lastNameField1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField1.get('value'),
                            'Lyon');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/people/person[1]/lastname')),
                            'Lyon');
                    });

                lastNameField2 = TP.byOID('lastNameField2');

                lastNameField2.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Weber', lastNameField2).
                    sendEvent(TP.hc('type', 'change'), lastNameField2).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField2.get('value'),
                            'Weber');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/people/person[2]/lastname')),
                            'Weber');
                    });

                addressStreetField11 = TP.byOID('addressStreetField11');

                addressStreetField11.clearValue();

                test.getDriver().startSequence().
                    sendKeys('555 3rd Av', addressStreetField11).
                    sendEvent(TP.hc('type', 'change'), addressStreetField11).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            addressStreetField11.get('value'),
                            '555 3rd Av');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/people/person[1]/addresses/address[1]/street')),
                            '555 3rd Av');
                    });

                addressCityField22 = TP.byOID('addressCityField22');

                addressCityField22.clearValue();

                test.getDriver().startSequence().
                    sendKeys('The Main Town', addressCityField22).
                    sendEvent(TP.hc('type', 'change'), addressCityField22).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            addressCityField22.get('value'),
                            'The Main Town');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('/people/person[2]/addresses/address[2]/city')),
                            'The Main Town');
                    });

                //  All of the others are just other text fields - same logic
                //  should work
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('repeat binding with text fields - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind17.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                var modelObj,
                    lastNameField1,
                    lastNameField2;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind17_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind17_person#tibet(people)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind17_person').getResource();

                test.assert.isEqualTo(
                    TP.byOID('lastNameField0').get('value'),
                    'Smith');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[0].lastname')),
                    'Smith');

                test.assert.isEqualTo(
                    TP.byOID('lastNameField1').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[1].lastname')),
                    'Jones');

                //  Change the content via 'user' interaction

                lastNameField1 = TP.byOID('lastNameField0');

                lastNameField1.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Lyon', lastNameField1).
                    sendEvent(TP.hc('type', 'change'), lastNameField1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField1.get('value'),
                            'Lyon');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('people[0].lastname')),
                            'Lyon');
                    });

                lastNameField2 = TP.byOID('lastNameField1');

                lastNameField2.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Weber', lastNameField2).
                    sendEvent(TP.hc('type', 'change'), lastNameField2).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField2.get('value'),
                            'Weber');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('people[1].lastname')),
                            'Weber');
                    });

                //  firstNameField1 and firstNameField2 are just other text
                //  fields - same logic should work
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('nested repeat binding with text fields - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind18.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                var modelObj,
                    lastNameField1,
                    lastNameField2,
                    addressStreetField00,
                    addressCityField11;

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind18_person'),
                        'TP.sig.ValueChange');

                test.assert.didSignal(
                        TP.uc('urn:tibet:Bind18_person#tibet(people)'),
                        'TP.sig.StructureChange');

                modelObj = TP.uc('urn:tibet:Bind18_person').getResource();

                //  ---

                test.assert.isEqualTo(
                    TP.byOID('lastNameField0').get('value'),
                    'Smith');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[0].lastname')),
                    'Smith');

                test.assert.isEqualTo(
                    TP.byOID('addressStreetField00').get('value'),
                    '111 Main St.');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[0].addresses[0].street')),
                    '111 Main St.');

                test.assert.isEqualTo(
                    TP.byOID('addressStreetField01').get('value'),
                    '222 State St.');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[0].addresses[1].street')),
                    '222 State St.');

                //  ---

                test.assert.isEqualTo(
                    TP.byOID('lastNameField1').get('value'),
                    'Jones');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[1].lastname')),
                    'Jones');

                test.assert.isEqualTo(
                    TP.byOID('addressCityField10').get('value'),
                    'Yet Another Town');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[1].addresses[0].city')),
                    'Yet Another Town');

                test.assert.isEqualTo(
                    TP.byOID('addressCityField11').get('value'),
                    'One More Town');

                test.assert.isEqualTo(
                    TP.val(modelObj.get('people[1].addresses[1].city')),
                    'One More Town');

                //  Change the content via 'user' interaction

                lastNameField1 = TP.byOID('lastNameField0');

                lastNameField1.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Lyon', lastNameField1).
                    sendEvent(TP.hc('type', 'change'), lastNameField1).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField1.get('value'),
                            'Lyon');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('people[0].lastname')),
                            'Lyon');
                    });

                lastNameField2 = TP.byOID('lastNameField1');

                lastNameField2.clearValue();

                test.getDriver().startSequence().
                    sendKeys('Weber', lastNameField2).
                    sendEvent(TP.hc('type', 'change'), lastNameField2).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            lastNameField2.get('value'),
                            'Weber');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('people[1].lastname')),
                            'Weber');
                    });

                addressStreetField00 = TP.byOID('addressStreetField00');

                addressStreetField00.clearValue();

                test.getDriver().startSequence().
                    sendKeys('555 3rd Av', addressStreetField00).
                    sendEvent(TP.hc('type', 'change'), addressStreetField00).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            addressStreetField00.get('value'),
                            '555 3rd Av');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('people[0].addresses[0].street')),
                            '555 3rd Av');
                    });

                addressCityField11 = TP.byOID('addressCityField11');

                addressCityField11.clearValue();

                test.getDriver().startSequence().
                    sendKeys('The Main Town', addressCityField11).
                    sendEvent(TP.hc('type', 'change'), addressCityField11).
                    perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            addressCityField11.get('value'),
                            'The Main Town');

                        test.assert.isEqualTo(
                            TP.val(modelObj.get('people[1].addresses[1].city')),
                            'The Main Town');
                    });

                //  All of the others are just other text fields - same logic
                //  should work
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('repeat binding with text fields and paging - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind19.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                //  TODO: Write real tests
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('nested repeat binding with text fields and paging - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind20.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                //  TODO: Write real tests
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('repeat binding with text fields and paging - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind21.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                //  TODO: Write real tests
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('nested repeat binding with text fields and paging - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind22.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

                //  TODO: Write real tests
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });
}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ------------------------------------------------------------------------

TP.bind.XMLNS.Type.describe('bind: static tables',
function() {

    //  ---

    this.it('Simple table - XML data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind23.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

    //  ---

    this.it('Simple table - JSON data source', function(test, options) {

        var loadURI;

        loadURI = TP.uc('~lib_tst/src/bind/Bind24.xhtml');

        this.getDriver().setLocation(loadURI);

        this.then(
            function() {

            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    });

}).skip();

//  ========================================================================
//  Run those babies!
//  ------------------------------------------------------------------------

/*
TP.bind.XMLNS.Type.runTestSuites();
*/

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
