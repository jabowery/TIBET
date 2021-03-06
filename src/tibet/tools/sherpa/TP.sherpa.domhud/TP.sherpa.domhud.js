//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ========================================================================

/**
 * @type {TP.sherpa.domhud}
 */

//  ------------------------------------------------------------------------

TP.sherpa.hudsidebar.defineSubtype('domhud');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.sherpa.domhud.Type.defineMethod('tagAttachComplete',
function(aRequest) {

    /**
     * @method tagAttachComplete
     * @summary Executes once the tag has been fully processed and its
     *     attachment phases are fully complete.
     * @description Because tibet:data tag content drives binds and we need to
     *     notify even without a full page load, we notify from here once the
     *     attachment is complete (instead of during tagAttachData).
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        tpElem,

        westDrawer,
        moveTileFunc;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have a node to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        return;
    }

    tpElem = TP.wrap(elem);

    tpElem.observe(tpElem.get('listcontent'),
                    TP.ac('TP.sig.DOMDNDTargetOver',
                            'TP.sig.DOMDNDTargetOut'));

    tpElem.observe(TP.ANY, 'TP.sig.DOMDNDCompleted');

    //  Grab the west drawer and define a function that, when the drawer
    //  animates back and forth into and out of its collapsed position that, if
    //  a tile is showing, will move the tile to the edge of the drawer.
    westDrawer = TP.byId('west', TP.win('UIROOT'));

    moveTileFunc = function(transitionSignal) {

        var tileTPElem,

            centerElem,
            centerElemPageRect;

        tileTPElem = TP.byId('DOMInfo_Tile', this.getNativeDocument());
        if (TP.isValid(tileTPElem) && tileTPElem.isVisible()) {
            //  Grab the center element and it's page rectangle.
            centerElem = TP.byId('center', this.getNativeWindow());
            centerElemPageRect = centerElem.getPageRect();

            tileTPElem.setPageX(centerElemPageRect.getX());
        }

    }.bind(tpElem);

    moveTileFunc.observe(westDrawer, 'TP.sig.DOMTransitionEnd');

    return;
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineAttribute('$currentDNDTarget');
TP.sherpa.domhud.Inst.defineAttribute('$tileContentConstructed');

TP.sherpa.domhud.Inst.defineAttribute('highlighted');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineMethod('computePeerElement',
function(sidebarElement) {

    /**
     * @method computePeerElement
     * @summary Computes the peer element to the supplied sidebar element in the
     *     current UI canvas DOM.
     * @param {Element} sidebarElement The element to compute the peer element
     *     from.
     * @returns {Element|null} The element in the current UI canvas DOM that is
     *     being represented by the supplied sidebar Element.
     */

    var peerID,

        doc,
        peerElem;

    if (TP.elementHasClass(sidebarElement, 'spacer')) {

        //  If the spacer DND target element has a next sibling, then
        //  try to get it's peerID and set the insertion position to
        //  TP.BEFORE_BEGIN.
        if (TP.isElement(sidebarElement.nextSibling)) {
            //  We go to the item after us to determine the peerID
            peerID = TP.elementGetAttribute(
                        sidebarElement.nextSibling,
                        'peerID',
                        true);
        }

        //  Couldn't find one after the spacer - try the spacer DND
        //  target element before it.
        if (TP.isEmpty(peerID) &&
                TP.isElement(sidebarElement.previousSibling)) {
            //  We go to the item before us to determine the peerID
            peerID = TP.elementGetAttribute(
                            sidebarElement.previousSibling,
                            'peerID',
                            true);
        }
    } else {
        //  We go to ourself to determine the peerID
        peerID = TP.elementGetAttribute(
                            sidebarElement,
                            'peerID',
                            true);
    }

    //  If we succesfully got a peerID, then get the Element it matches
    //  in the UI canvas DOM.
    if (TP.notEmpty(peerID)) {

        doc = TP.sys.uidoc(true);

        peerElem = TP.byId(peerID, doc, false);
        if (TP.isElement(peerElem)) {
            return peerElem;
        }
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineMethod('focusOnTarget',
function(aTPElement) {

    /**
     * @method focusOnTarget
     * @summary Focuses the receiver onto the supplied target.
     * @param {TP.core.UIElementNode} aTPElement The element to focus the
     *     receiver on.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var info,
        nodes,

        children,
        offsetParentTPElem,

        tileTPElem,

        targetTPElem,

        centerElem,
        centerElemPageRect,

        itemID,
        currentItemTPElem,

        targetElemPageRect;

    info = TP.ac();

    //  Get the supplied element's ancestor chain and build a list from that.

    nodes = aTPElement.getAncestors();

    //  Unshift the supplied element onto the front.
    nodes.unshift(aTPElement);

    //  Reverse the list so that the top-most anscestor is first and the
    //  supplied element is last.
    nodes.reverse();

    children = aTPElement.getChildElements();

    //  Filter out children that are generated - TIBET generated them and we
    //  don't want them 'visible' to app authors.
    children = children.filter(
                function(aTPElem) {

                    if (TP.isTrue(TP.unwrap(aTPElem)[TP.GENERATED])) {
                        return false;
                    }

                    return true;
                });

    offsetParentTPElem = aTPElement.getOffsetParent();

    //  Concatenate the filtered child elements onto the list.
    nodes = nodes.concat(children);
    nodes.perform(
        function(aNode) {
            var node,
                arr;

            node = TP.canInvoke(aNode, 'getNativeNode') ?
                                    aNode.getNativeNode() :
                                    aNode;

            if (!TP.isElement(node)) {
                return;
            }

            arr = TP.ac(
                    TP.lid(node, true),
                    aNode.sherpaDomHudGetLabel());

            if (aNode === aTPElement) {
                arr.push('target');
            } else if (aNode.getParentNode().getNativeNode() ===
                        aTPElement.getNativeNode()) {
                arr.push('child');
            } else if (aNode === offsetParentTPElem) {
                arr.push('offsetParent');
            } else {
                arr.push('normal');
            }

            info.push(arr);
        });

    //  List expects an array of arrays containing IDs and full names.
    this.setValue(info);

    //  Scroll our list content to its bottom.
    this.get('listcontent').scrollTo(TP.BOTTOM);

    tileTPElem = TP.byId('DOMInfo_Tile', this.getNativeDocument());
    if (TP.isValid(tileTPElem) && tileTPElem.isVisible()) {

        targetTPElem =
            TP.uc('urn:tibet:domhud_target_source').getResource().get('result');

        //  Update the tile's header text.
        tileTPElem.setHeaderText(
                    targetTPElem.getFullName() + ' Info');

        //  Grab the center element and it's page rectangle.
        centerElem = TP.byId('center', this.getNativeWindow());
        centerElemPageRect = centerElem.getPageRect();

        itemID = targetTPElem.getLocalID();

        //  Get the currently displayed lozenge given that the peerID should
        //  be the same as it was for the old lozenge.
        currentItemTPElem = TP.byCSSPath('li[peerID="' + itemID + '"]',
                                            this.getNativeNode(),
                                            true);

        //  Grab it's page rect.
        targetElemPageRect = currentItemTPElem.getPageRect();

        //  Set the page position of the tile based on the two rectangles X
        //  and Y, respectively.
        tileTPElem.setPagePosition(
            TP.pc(centerElemPageRect.getX(), targetElemPageRect.getY()));
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineMethod('focusOnUICanvasRoot',
function() {

    /**
     * @method focusOnUICanvasRoot
     * @summary Focuses the receiver on the UI canvas's 'root' (i.e. document)
     *     element.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var root,
        arr;

    root = TP.sys.getUICanvas().getDocument().getRoot();
    if (TP.notValid(root)) {
        return;
    }

    root = root.getNativeNode();

    arr = TP.ac(
            TP.lid(root, true),
            TP.elementGetFullName(root),
            'normal');

    //  List expects an array of arrays containing IDs and full names.
    this.setValue(TP.ac(arr));

    return this;
});

//  ------------------------------------------------------------------------
//  TP.core.D3Tag Methods
//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineMethod('buildNewContent',
function(enterSelection) {

    /**
     * @method buildNewContent
     * @summary Builds new content onto the receiver by appending or inserting
     *     content into the supplied d3.js 'enter selection'.
     * @param {TP.extern.d3.selection} enterSelection The d3.js enter selection
     *     that new content should be appended to.
     * @returns {TP.extern.d3.selection} The supplied enter selection or a new
     *     selection containing any new content that was added.
     */

    var domContent,
        doc;

    domContent = enterSelection.append('li');

    doc = TP.sys.uidoc(true);

    domContent.attr(
            'pclass:selected',
            function(d) {
                if (d[2] === 'target') {
                    return true;
                }
            }).attr(
            'child',
            function(d) {
                if (d[2] === 'child') {
                    return true;
                }
            }).attr(
            'offsetParent',
            function(d) {
                if (d[2] === 'offsetParent') {
                    return true;
                }
            }).attr(
            'indexInData',
            function(d, i) {
                if (d[1] !== 'spacer') {
                    return (i / 2).floor();
                }
            }).attr(
            'peerID',
            function(d) {
                if (d[1] !== 'spacer') {
                    return d[0];
                }
            }).text(
            function(d) {
                if (d[1] !== 'spacer') {
                    return d[1];
                }
            }).attr(
            'class',
            function(d) {
                var val;

                val = 'item';

                if (d[1] === 'spacer') {
                    val += ' spacer';
                } else {
                    val += ' domnode';
                }

                return val;
            }).each(
            function(d) {
                var peerTPElem;

                TP.elementSetAttribute(
                        this, 'dnd:accept', 'tofu dom_node', true);

                if (d[1] !== 'spacer') {
                    peerTPElem = TP.byId(d[0], doc);
                    if (!peerTPElem.haloCanFocus()) {
                        TP.wrap(this).setAttribute('disabled', true);
                    }
                }
            });

    return domContent;
});

//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineMethod('computeSelectionData',
function() {

    /**
     * @method computeSelectionData
     * @summary Returns the data that will actually be used for binding into the
     *     d3.js selection.
     * @description The selection data may very well be different than the bound
     *     data that uses TIBET data binding to bind data to this control. This
     *     method allows the receiver to transform it's 'data binding data' into
     *     data appropriate for d3.js selections.
     * @returns {Object} The selection data.
     */

    var data,
        newData,

        len,
        i;

    data = this.get('data');

    newData = TP.ac();

    len = data.getSize();
    for (i = 0; i < len; i++) {

        //  Push in a data row and then a spacer row.
        //  NOTE: We construct the spacer row to take into account the fact, in
        //  the 3rd slot, what the 'condition' (i.e. 'normal', 'target',
        //  'child') is of the data row that it's a spacer for. This is because,
        //  if the data row is being removed for some reason, we want the spacer
        //  row to be removed as well. Otherwise, spurious spacer rows are left
        //  around and, with the 'append' in the buildNewContent method, things
        //  will get out of order in a hurry.
        newData.push(
            data.at(i),
            TP.ac('spacer_' + i, 'spacer', 'spacer_' + data.at(i).at(2)));
    }

    return newData;
});

//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineMethod('updateExistingContent',
function(updateSelection) {

    /**
     * @method updateExistingContent
     * @summary Updates any existing content in the receiver by altering the
     *     content in the supplied d3.js 'update selection'.
     * @param {TP.extern.d3.selection} updateSelection The d3.js update
     *     selection that existing content should be altered in.
     * @returns {TP.extern.d3.selection} The supplied update selection.
     */

    var doc;

    doc = TP.sys.uidoc(true);

    updateSelection.attr(
            'pclass:selected',
            function(d) {
                if (d[2] === 'target') {
                    return true;
                }
            }).attr(
            'child',
            function(d) {
                if (d[2] === 'child') {
                    return true;
                }
            }).attr(
            'offsetParent',
            function(d) {
                if (d[2] === 'offsetParent') {
                    return true;
                }
            }).attr(
            'indexInData',
            function(d, i) {
                if (d[1] !== 'spacer') {
                    return (i / 2).floor();
                }
            }).attr(
            'peerID',
            function(d) {
                if (d[1] !== 'spacer') {
                    return d[0];
                }
            }).text(
            function(d) {
                if (d[1] !== 'spacer') {
                    return d[1];
                }
            }).attr(
            'class',
            function(d) {
                var val;

                val = 'item';

                if (d[1] === 'spacer') {
                    val += ' spacer';
                } else {
                    val += ' domnode';
                }

                return val;
            }).each(
            function(d) {
                var peerTPElem;

                TP.elementSetAttribute(
                    this, 'dnd:accept', 'tofu dom_node', true);

                if (d[1] !== 'spacer') {
                    peerTPElem = TP.byId(d[0], doc);
                    if (!peerTPElem.haloCanFocus()) {
                        TP.wrap(this).setAttribute('disabled', true);
                    }
                }
            });

    return updateSelection;
});

//  ------------------------------------------------------------------------
//  Handlers
//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineHandler('ClosedChange',
function(aSignal) {

    /**
     * @method handleClosedChange
     * @summary Handles notifications of HUD closed change signals.
     * @param {TP.sig.ClosedChange} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var hud,
        hudIsHidden;

    //  Grab the HUD and see if it's currently open or closed.
    hud = TP.byId('SherpaHUD', this.getNativeDocument());
    hudIsHidden = TP.bc(hud.getAttribute('closed'));

    if (!hudIsHidden) {
        this.focusOnUICanvasRoot();
    }

    return this;
}, {
    origin: 'SherpaHUD'
});

//  ----------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineHandler('DOMDNDTargetOver',
function(aSignal) {

    /**
     * @method handleDOMDNDTargetOver
     * @summary Handles when the drag and drop system enters a possible drop
     *     target.
     * @param {TP.sig.DOMDNDTargetOver} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var dndTargetElem,

        sourceTPElem,
        vendType,

        peerElem,
        peerTPElem,

        hudTPElem;

    dndTargetElem = aSignal.getDOMTarget();

    sourceTPElem = TP.core.UIElementNode.get('currentDNDSource');
    vendType = sourceTPElem.getAttribute('dnd:vend');

    switch (vendType) {
        case 'breadcrumb':
        case 'tofu':
            break;

        case 'dom_node':
            sourceTPElem = TP.byId('SherpaHalo', TP.win('UIROOT')).
                                                get('currentTargetTPElem');
            break;

        default:
            break;
    }

    if (!TP.elementHasClass(dndTargetElem, 'spacer')) {
        peerElem = this.computePeerElement(dndTargetElem);
        peerTPElem = TP.wrap(peerElem);

        hudTPElem = TP.byId('SherpaHUD', TP.win('UIROOT'));
        if (!peerTPElem.hudCanDrop(hudTPElem, sourceTPElem)) {
            this.set('$currentDNDTarget', null);
            return this;
        }

        TP.elementAddClass(peerElem, 'sherpa-outliner-droptarget');
    }

    TP.elementAddClass(dndTargetElem, 'sherpa-domhud-droptarget');

    this.set('$currentDNDTarget', dndTargetElem);

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineHandler('DOMDNDTargetOut',
function(aSignal) {

    /**
     * @method handleDOMDNDTargetOut
     * @summary Handles when the drag and drop system exits a possible drop
     *     target.
     * @param {TP.sig.DOMDNDTargetOut} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var dndTargetElem,

        peerElem;

    dndTargetElem = aSignal.getDOMTarget();

    //  Remove the CSS class placed on the drop target and set the attribute we
    //  use to track the current DND target to null.
    TP.elementRemoveClass(dndTargetElem, 'sherpa-domhud-droptarget');

    if (!TP.elementHasClass(dndTargetElem, 'spacer')) {
        peerElem = this.computePeerElement(dndTargetElem);
        TP.elementRemoveClass(peerElem, 'sherpa-outliner-droptarget');
    }

    this.set('$currentDNDTarget', null);

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineHandler('DOMDNDCompleted',
function(aSignal) {

    /**
     * @method handleDOMDNDCompleted
     * @summary Handles when the drag and drop system completes a dragging
     *     session.
     * @param {TP.sig.DOMDNDCompleted} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var dndTargetElem,

        peerID,

        insertionPosition,
        sherpaOutliner,

        peerElem,

        doc,

        dndSourceTPElem,
        vendType;

    dndTargetElem = this.get('$currentDNDTarget');

    if (TP.isElement(dndTargetElem)) {

        //  Remove the class placed on the drop target and set the attribute we
        //  use to track the current DND target to null.
        TP.elementRemoveClass(dndTargetElem, 'sherpa-domhud-droptarget');
        this.set('$currentDNDTarget', null);

        //  If the sidebar contains the target element, then we want to do the
        //  insertion.
        if (this.contains(dndTargetElem, TP.IDENTITY)) {

            if (TP.elementHasClass(dndTargetElem, 'spacer')) {

                //  If the spacer DND target element has a next sibling, then
                //  try to get it's peerID and set the insertion position to
                //  TP.BEFORE_BEGIN.
                if (TP.isElement(dndTargetElem.nextSibling)) {
                    //  We go to the item after us to determine the peerID
                    peerID = TP.elementGetAttribute(
                                dndTargetElem.nextSibling,
                                'peerID',
                                true);
                    insertionPosition = TP.BEFORE_BEGIN;
                }

                //  Couldn't find one after the spacer - try the spacer DND
                //  target element before it.
                if (TP.isEmpty(peerID) &&
                        TP.isElement(dndTargetElem.previousSibling)) {
                    //  We go to the item before us to determine the peerID
                    peerID = TP.elementGetAttribute(
                                    dndTargetElem.previousSibling,
                                    'peerID',
                                    true);
                    insertionPosition = TP.AFTER_END;
                }
            } else {
                //  We go to ourself to determine the peerID
                peerID = TP.elementGetAttribute(
                                    dndTargetElem,
                                    'peerID',
                                    true);
                sherpaOutliner = TP.bySystemId('SherpaOutliner');
                insertionPosition = sherpaOutliner.get('insertionPosition');
            }

            //  If we succesfully got a peerID, then get the Element it matches
            //  in the UI canvas DOM.
            if (TP.notEmpty(peerID)) {

                doc = TP.sys.uidoc(true);

                peerElem = TP.byId(peerID, doc, false);
                if (TP.isElement(peerElem)) {

                    TP.elementRemoveClass(
                            peerElem, 'sherpa-outliner-droptarget');

                    //  We found a peer Element. Use it as the insertion point
                    //  and use it's parent node as the receiver of the message
                    //  that the Sherpa dropped tofu.

                    //  If we have a drag and drop source, then try to process
                    //  it.
                    dndSourceTPElem = aSignal.at('dndSource');
                    if (TP.isValid(dndSourceTPElem)) {

                        //  The value of the 'dnd:vend' attribute on the source
                        //  will detail what the kind of source just got dropped
                        //  into the outliner.
                        vendType = dndSourceTPElem.getAttribute('dnd:vend');

                        switch (vendType) {

                            case 'tofu':

                                //  Message the drop target that we dropped tofu
                                //  into it at the insertion position determined
                                //  by the user.
                                TP.wrap(dndTargetElem).sherpaDidInsertTofu(
                                                        peerElem,
                                                        insertionPosition);

                                break;

                            case 'dom_node':

                                //  Message the drop target that we dropped an
                                //  existing DOM node into it at the insertion
                                //  position determined by the user and that
                                //  node should be reparented.
                                TP.wrap(dndTargetElem).sherpaDidReparentNode(
                                                        peerElem,
                                                        insertionPosition);

                                break;

                            default:
                                break;
                        }
                    }
                }
            }
        }
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineHandler('FocusHalo',
function(aSignal) {

    /**
     * @method handleFocusHalo
     * @summary Handles notifications of when the receiver wants to focus the
     *     halo.
     * @param {TP.sig.FocusHalo} aSignal The TIBET signal which triggered this
     *     method.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var targetElem,
        peerID,

        newTargetTPElem,

        halo,
        currentTargetTPElem;

    //  Grab the target lozenge tile and get the value of its peerID attribute.
    //  This will be the ID of the element that we're trying to focus.
    targetElem = aSignal.getDOMTarget();
    peerID = TP.elementGetAttribute(targetElem, 'peerID', true);

    //  No peerID? Exit here.
    if (TP.isEmpty(peerID)) {
        return this;
    }

    //  NB: We want to query the current UI canvas here - no node context
    //  necessary.
    newTargetTPElem = TP.byId(peerID);

    halo = TP.byId('SherpaHalo', this.getNativeDocument());

    currentTargetTPElem = halo.get('currentTargetTPElem');
    if (newTargetTPElem !== currentTargetTPElem) {

        if (TP.isValid(currentTargetTPElem) &&
                currentTargetTPElem.haloCanBlur(halo)) {
            halo.blur();
        }

        //  Remove any highlighting that we were doing *on the new target*
        //  because we're going to focus the halo.
        newTargetTPElem.removeClass('sherpa-hud-highlight');
        this.$set('highlighted', null, false);

        if (newTargetTPElem.haloCanFocus(halo)) {
            //  Focus the halo on our new element, passing true to actually
            //  show the halo if it's hidden.
            halo.focusOn(newTargetTPElem, true);
        }
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineHandler('FocusHaloAndInspect',
function(aSignal) {

    /**
     * @method handleFocusHaloAndInspect
     * @summary Handles notifications of when the receiver wants to focus the
     *     halo and shift the Sherpa's inspector to focus it on the halo's
     *     target.
     * @param {TP.sig.FocusHaloAndInspect} aSignal The TIBET signal which
     *     triggered this method.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var targetElem,
        peerID,

        newTargetTPElem,

        halo,
        currentTargetTPElem;

    //  Grab the target lozenge tile and get the value of its peerID attribute.
    //  This will be the ID of the element that we're trying to focus.
    targetElem = aSignal.getDOMTarget();
    peerID = TP.elementGetAttribute(targetElem, 'peerID', true);

    //  No peerID? Exit here.
    if (TP.isEmpty(peerID)) {
        return this;
    }

    //  NB: We want to query the current UI canvas here - no node context
    //  necessary.
    newTargetTPElem = TP.byId(peerID);

    halo = TP.byId('SherpaHalo', this.getNativeDocument());

    currentTargetTPElem = halo.get('currentTargetTPElem');
    if (newTargetTPElem !== currentTargetTPElem) {
        //  Blur and refocus the halo on the newTargetTPElem.

        if (currentTargetTPElem.haloCanBlur(halo)) {

            halo.blur();

            if (newTargetTPElem.haloCanFocus(halo)) {
                halo.focusOn(newTargetTPElem);
            }
        }
    }

    halo.setAttribute('hidden', false);

    //  Fire a 'ConsoleCommand' signal that will be picked up and processed by
    //  the Sherpa console. Send command text asking it to inspect the current
    //  target of the halo.
    TP.signal(null,
                'ConsoleCommand',
                TP.hc('cmdText', ':inspect $HALO'));

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineHandler('HaloDidBlur',
function(aSignal) {

    /**
     * @method handleHaloDidBlur
     * @summary Handles notifications of when the halo blurs on an object.
     * @param {TP.sig.HaloDidBlur} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var sherpaInst;

    this.focusOnUICanvasRoot();

    sherpaInst = TP.bySystemId('Sherpa');
    this.ignore(sherpaInst, 'CanvasChanged');

    //  NB: We don't callNextMethod() here because our supertype will clear our
    //  data and we don't want that (otherwise, focusing on the canvas root
    //  above will have been for naught).

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineHandler('HaloDidFocus',
function(aSignal) {

    /**
     * @method handleHaloDidFocus
     * @summary Handles notifications of when the halo focuses on an object.
     * @param {TP.sig.HaloDidFocus} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var haloTarget;

    haloTarget = aSignal.at('haloTarget');

    //  Update the target source element before we refresh.
    TP.uc('urn:tibet:domhud_target_source').setResource(
            haloTarget,
            TP.hc('observeResource', false, 'signalChange', true));

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineHandler('ToggleHighlight',
function(aSignal) {

    /**
     * @method ToggleHighlight
     * @summary Responds to mouse over/out notifications by toggling a
     *     class on individual peer elements. The result is that as the user
     *     hovers over elements in the sidebar the corresponding element in
     *     the canvas gets a 'sherpa-hud-highlight' class add/removed.
     * @param {TP.sig.ToggleHighlight} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var uiDoc,

        oldTarget,
        target,

        targetDocElem,
        targetElem,
        peerID,

        hudInjectedStyleElement;

    //  Grab the UI canvas's document
    uiDoc = TP.sys.uidoc(true);

    //  Grab the highlighted element.
    oldTarget = this.get('highlighted');

    //  If oldTarget is valid, then we need to clear the highlighted element
    if (TP.isValid(oldTarget)) {

        //  Clear the oldTarget of the highlight class
        TP.elementRemoveClass(oldTarget, 'sherpa-hud-highlight');
        this.$set('highlighted', null, false);

        //  Grab the document element and remove the class that indicates that
        //  we're highlighting.
        targetDocElem = uiDoc.documentElement;
        TP.elementRemoveClass(targetDocElem, 'sherpa-hud-highlighting');
    }

    //  Grab the new 'DOM target' element, which will be the lozenge that the
    //  user is highlighting.
    targetElem = aSignal.getDOMTarget();

    //  If that element doesn't have the 'domnode' class, then we exit. It may
    //  be a spacer, which we're not interested in.
    if (!TP.elementHasClass(targetElem, 'domnode')) {
        return this;
    }

    //  The peerID on the lozenge will indicate which element in the UI canvas
    //  it is representing. If we don't have one, we exit.
    peerID = TP.elementGetAttribute(targetElem, 'peerID', true);
    if (TP.isEmpty(peerID)) {
        return this;
    }

    //  Query the DOM of the UI canvas for the target element.
    target = TP.byId(peerID, uiDoc, false);
    if (!TP.isElement(target)) {
        return this;
    }

    //  If the target and the old target are the same, then just exit here.
    if (target === oldTarget) {
        return this;
    }

    //  Grab the style sheet that the HUD injected into the UI canvas.
    hudInjectedStyleElement = TP.byId('hud_injected_generated',
                                        uiDoc,
                                        false);

    //  Set the '--sherpa-hud-highlight-color' to a light opacity version of our
    //  full color.
    TP.cssElementSetCustomCSSPropertyValue(
        hudInjectedStyleElement,
        '.sherpa-hud',
        '--sherpa-hud-highlight-color',
        'rgba(255, 215, 0, 0.2)');

    //  Add the highlight class to the target.
    TP.elementAddClass(target, 'sherpa-hud-highlight');
    this.$set('highlighted', target, false);

    //  Grab the document element and add the class that indicates that we're
    //  highlighting.
    targetDocElem = uiDoc.documentElement;
    TP.elementAddClass(targetDocElem, 'sherpa-hud-highlighting');

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.domhud.Inst.defineHandler('ShowInfo',
function(aSignal) {

    /**
     * @method ShowInfo
     * @summary Responds to mouse contextmenu notifications by toggling a
     *     class on individual peer elements. The result is that as the user
     *     right clicks over elements in the sidebar the info panel is
     *     shown for the corresponding element.
     * @param {TP.sig.ShowInfo} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.domhud} The receiver.
     */

    var targetElem,
        peerID,
        sourceTPElem,

        centerElem,
        centerElemPageRect,

        targetElemPageRect,

        modelURI,

        existedHandler,
        newHandler;

    targetElem = aSignal.getDOMTarget();
    if (!TP.elementHasClass(targetElem, 'domnode')) {
        return this;
    }

    peerID = TP.elementGetAttribute(targetElem, 'peerID', true);

    if (TP.isEmpty(peerID)) {
        return this;
    }

    //  NB: We want to query the current UI canvas here - no node context
    //  necessary.
    sourceTPElem = TP.byId(peerID);
    if (TP.notValid(sourceTPElem)) {
        return this;
    }

    //  Prevent default *on the trigger signal* (which is the GUI signal - the
    //  contextmenu signal) so that any sort of 'right click' menu doesn't show.
    aSignal.at('trigger').preventDefault();

    //  Use the same 'X' coordinate where the 'center' div is located in the
    //  page.
    centerElem = TP.byId('center', this.getNativeWindow());
    centerElemPageRect = centerElem.getPageRect();

    //  Use the 'Y' coordinate where the target element is located in the page.
    targetElemPageRect = TP.wrap(targetElem).getPageRect();

    //  ---

    //  Set up a model URI and observe it for change ourself. This will allow us
    //  to regenerate the tag representation as the model changes.
    modelURI = TP.uc('urn:tibet:domhud_target_source');

    //  If we've already constructed the tile content, just set the resource on
    //  the model URI. This will cause the bindings to update.
    if (this.get('$tileContentConstructed')) {
        existedHandler =
            function(aTileTPElem) {

                var tileTPElem;

                modelURI.setResource(
                    sourceTPElem,
                    TP.hc('observeResource', false, 'signalChange', true));

                //  Position the tile
                tileTPElem = TP.byId('DOMInfo_Tile',
                                        this.getNativeDocument());
                tileTPElem.setPagePosition(
                    TP.pc(centerElemPageRect.getX(),
                            targetElemPageRect.getY()));

                (function() {
                    tileTPElem.get('body').
                        focusAutofocusedOrFirstFocusableDescendant();
                }).queueForNextRepaint(aTileTPElem.getNativeWindow());
            }.bind(this);
    } else {

        newHandler =
            function(aTileTPElem) {

                var newContentTPElem;

                newContentTPElem = aTileTPElem.setContent(
                                    sourceTPElem.sherpaDomHudGetTileContent());
                newContentTPElem.awaken();

                //  Set the resource of the model URI to the model object,
                //  telling the URI that it should observe changes to the model
                //  (which will allow us to get notifications from the URI which
                //  we're observing above) and to go ahead and signal change to
                //  kick things off.
                modelURI.setResource(
                    sourceTPElem,
                    TP.hc('observeResource', false, 'signalChange', true));

                //  Position the tile
                aTileTPElem.setPagePosition(
                    TP.pc(centerElemPageRect.getX(), targetElemPageRect.getY()));

                this.set('$tileContentConstructed', true);

                (function() {
                    newContentTPElem.
                        focusAutofocusedOrFirstFocusableDescendant();
                }).queueForNextRepaint(aTileTPElem.getNativeWindow());
            }.bind(this);
    }

    //  Show the rule text in the tile. Note how we wrap the content with a span
    //  with a CodeMirror CSS class to make the styling work.
    TP.bySystemId('Sherpa').showTileAt(
        'DOMInfo_Tile',
        sourceTPElem.getFullName() + ' Info',
        existedHandler,
        newHandler);

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
