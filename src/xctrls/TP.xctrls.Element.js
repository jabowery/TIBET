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
 * @type {TP.xctrls.Element}
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('xctrls.Element');

//  This type is intended to be used as either a trait type or supertype of
//  concrete types, so we don't allow instance creation
TP.xctrls.Element.isAbstract(true);

//  This type is used as a general type for 'xctrls' elements that might not
//  have a concrete type since they are really just placeholders (like
//  xctrls:value). Since xctrls doesn't have a fixed schema like some of the
//  other markup language we support (XHTML, SVG, XMPP), this is ok. Therefore,
//  we don't mark it as abstract.

TP.xctrls.Element.addTraits(TP.core.NonNativeUIElementNode);

TP.xctrls.Element.Inst.resolveTraits(
        TP.ac('$setAttribute', 'removeAttribute', 'select', 'signal'),
        TP.core.UIElementNode);

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

//  A TP.core.Hash of 'required attributes' that should be populated on all
//  new instances of the tag.
TP.xctrls.Element.Type.defineAttribute('requiredAttrs');

//  This tag has the CSS common to all XCtrls elements as its associated CSS.
//  Note how this property is TYPE_LOCAL, by design.
TP.xctrls.Element.defineAttribute('styleURI',
                                    '~TP.xctrls.Element/TP.xctrls_common.css');

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

TP.xctrls.Element.Type.defineAttribute('opaqueCapturingSignalNames',
        TP.ac(
            'TP.sig.DOMClick',
            'TP.sig.DOMDblClick',

            'TP.sig.DOMKeyDown',
            'TP.sig.DOMKeyPress',
            'TP.sig.DOMKeyUp',

            'TP.sig.DOMMouseDown',
            'TP.sig.DOMMouseEnter',
            'TP.sig.DOMMouseLeave',
            'TP.sig.DOMMouseOut',
            'TP.sig.DOMMouseOver',
            'TP.sig.DOMMouseUp',

            'TP.sig.DOMFocus',
            'TP.sig.DOMBlur'
        ));

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.xctrls.Element.Type.defineMethod('tagCompile',
function(aRequest) {

    /**
     * @method tagCompile
     * @summary Convert the receiver into a format suitable for inclusion in a
     *     markup DOM.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     * @returns {Element} The element.
     */

    var elem,

        reqAttrs,
        compAttrs;

    elem = aRequest.at('node');

    //  Make sure that the element gets stamped with a 'tibet:tag' of its tag's
    //  fully qualified *canonical* name.
    TP.elementSetAttribute(elem, 'tibet:tag', TP.canonical(elem), true);

    //  If the type (but not inherited - just at the individual type level)
    //  has specified 'required attributes' that need to be populated on all
    //  new tag instances, then do that here.
    if (TP.notEmpty(reqAttrs = this.get('requiredAttrs'))) {
        TP.elementSetAttributes(elem, reqAttrs, true);
    }

    //  Make sure to add any 'compilation attributes' to the element (since
    //  we don't call up to our supertype here).
    if (TP.notEmpty(compAttrs = this.getCompilationAttrs(aRequest))) {
        TP.elementSetAttributes(elem, compAttrs, true);
    }

    return elem;
});

//  ------------------------------------------------------------------------
//  TSH Execution Support
//  ------------------------------------------------------------------------

TP.xctrls.Element.Type.defineMethod('cmdRunContent',
function(aRequest) {

    /**
     * @method cmdRunContent
     * @summary Invoked by the TIBET Shell when the tag is being "run" as part
     *     of a pipe or command sequence. For a UI element like an HTML element
     *     this effectively means to render itself onto the standard output
     *     stream.
     * @param {TP.sig.Request|TP.core.Hash} aRequest The request/param hash.
     */

    var elem;

    //  Make sure that we have an Element to work from.
    if (!TP.isElement(elem = aRequest.at('cmdNode'))) {
        return;
    }

    aRequest.atPut('cmdAsIs', true);
    aRequest.atPut('cmdBox', false);

    aRequest.complete(elem);

    return;
});

//  ------------------------------------------------------------------------
//  Tag Phase Support
//  ------------------------------------------------------------------------

TP.xctrls.Element.Type.defineMethod('shouldWrapACPOutput',
function() {

    /**
     * @method shouldWrapACPOutput
     * @summary Whether or not we should wrap ACP expression output in an XHTML
     *     span element. The default is true, but some subtypes that allow ACP
     *     in their embedded templates might choose to not generate these
     *     wrapper spans.
     * @returns {Boolean} Whether or not to wrap it.
     */

    return false;
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.xctrls.Element.Inst.defineMethod('stylesheetReady',
function(aStyleTPElem) {

    /**
     * @method stylesheetReady
     * @summary A method that is invoked when the supplied stylesheet is
     *     'ready', which means that it's attached to the receiver's Document
     *     and all of it's style has been parsed and applied.
     * @description Typically, the supplied stylesheet Element is the one that
     *     the receiver is waiting for so that it can finalized style
     *     computations. This could be either the receiver's 'core' stylesheet
     *     or it's current 'theme' stylesheet, if the receiver is executing in a
     *     themed environment.
     * @param {TP.html.style} aStyleTPElem The XHTML 'style' element that is
     *     ready.
     * @returns {TP.xctrls.Element} The receiver.
     */

    //  Signal that we are ready.
    this.dispatch('TP.sig.DOMReady');

    return this;
});

//  ========================================================================
//  TP.xctrls.CompiledTag
//  ========================================================================

/**
 * @type {TP.xctrls.CompiledTag}
 * @summary A tag type that is compiled and also has the common aspect of all
 *     XControls tags.
 */

//  ------------------------------------------------------------------------

TP.core.CompiledTag.defineSubtype('xctrls.CompiledTag');
TP.xctrls.CompiledTag.addTraits(TP.xctrls.Element);

//  Resolve the 'tagCompile' method in favor of TP.xctrls.Element, but go ahead
//  and execute the one inherited from TP.core.CompiledTag afterwards as well.
TP.xctrls.CompiledTag.Type.resolveTrait(
                                'tagCompile', TP.xctrls.Element, TP.BEFORE);

//  ========================================================================
//  TP.xctrls.TemplatedTag
//  ========================================================================

/**
 * @type {TP.xctrls.TemplatedTag}
 * @summary A tag type that is templated and also has the common aspect of all
 *     XControls tags.
 */

//  ------------------------------------------------------------------------

TP.core.TemplatedTag.defineSubtype('xctrls.TemplatedTag');
TP.xctrls.TemplatedTag.addTraits(TP.xctrls.Element);

//  Resolve the 'tagCompile' method in favor of TP.xctrls.Element, but go ahead
//  and execute the one inherited from TP.core.TemplatedTag afterwards as well.
TP.xctrls.TemplatedTag.Type.resolveTrait(
                                'tagCompile', TP.xctrls.Element, TP.BEFORE);

//  ========================================================================
//  TP.xctrls.value
//  ========================================================================

/**
 * @type {TP.xctrls.value}
 * @summary A tag that can hold an arbitrary value. The xctrls common CSS
 *     has rules that cause this tag and its content to be hidden. It is defined
 *     so that development when the Sherpa is loaded does not cause an
 *     'autodefinition' of a missing tag.
 */

//  ------------------------------------------------------------------------

TP.xctrls.Element.defineSubtype('xctrls.value');

//  This tag has no associated CSS. Note how these properties are TYPE_LOCAL, by
//  design.
TP.xctrls.value.defineAttribute('styleURI', TP.NO_RESULT);
TP.xctrls.value.defineAttribute('themeURI', TP.NO_RESULT);

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
