//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ------------------------------------------------------------------------

/**
 * @type {TP.xctrls.log}
 * @synopsis Manages log XControls.
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('xctrls:log');

TP.xctrls.log.addTraitsFrom(TP.xctrls.Element,
                            TP.xctrls.MultiItemElement,
                            TP.core.TemplatedNode);
TP.xctrls.log.Type.resolveTrait('tagCompile', TP.core.TemplatedNode);

//  Resolve the traits right away as type methods of this type are called during
//  content processing when we only have type methods involved.
TP.xctrls.log.executeTraitResolution();

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.xctrls.log.Inst.defineAttribute(
        'body',
        {'value': TP.cpc('*[tibet|pelem="body"]', true)});

TP.xctrls.log.Inst.defineAttribute(
        'firstTransform',
        {'value': TP.xpc('.//tsh:transform[1]', true)});

TP.xctrls.log.Inst.defineAttribute(
        'transformWithName',
        {'value': TP.xpc('.//tsh:transform/tsh:template[@tsh:name = "{{1}}"]/..', true)});

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.xctrls.log.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @name tagAttachDOM
     * @synopsis Sets up runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    //  When multiple inheritance is fixed, we should be able to do away
    //  with this (and mixin TP.core.EmbeddedTemplateNode properly).
    TP.xctrls.Element.tagAttachDOM.call(this, aRequest);
    TP.core.EmbeddedTemplateNode.tagAttachDOM.call(this, aRequest);

    return;
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.xctrls.log.Inst.defineMethod('handleChange',
function(aSignal) {

    /**
     * @name handleChange
     * @synopsis Handles any TP.sig.Change signals by logging information to the
     *     receiver.
     * @param {TP.sig.Change} aSignal The signal that caused this handler to
     *     trip.
     */

    var aspect,
        obj,

        val;

    aspect = aSignal.get('aspect');
    obj = TP.wrap(aSignal.getOrigin());

    val = obj.get(aspect);

    this.logData(TP.join('The "', aspect, '" aspect',
                            ' of: "', obj.getID(), '"',
                            ' changed to: "', val, '"'));

    return;
});

//  ------------------------------------------------------------------------

TP.xctrls.log.Inst.defineMethod('logData',
function(aData) {

    /**
     * @name logData
     * @synopsis Logs the supplied data to the receiver by executing the
     *     receiver's template.
     * @param {Object} aData The data to log to the receiver.
     */

    var bodyElem;

    this.addItem(TP.hc('itemData', aData));

    bodyElem = this.get('body');
    bodyElem.scrollTop = bodyElem.scrollHeight;

    return;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
