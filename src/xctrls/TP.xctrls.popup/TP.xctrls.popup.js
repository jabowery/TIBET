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
 * @type {TP.xctrls.popup}
 * @summary Manages popup XControls.
 */

//  ------------------------------------------------------------------------

TP.xctrls.SharedOverlay.defineSubtype('xctrls:popup');

//  ------------------------------------------------------------------------
//  Type Constants
//  ------------------------------------------------------------------------

TP.xctrls.popup.Type.defineConstant('POPUP_OFFSET', 8);

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

//  Note how this property is TYPE_LOCAL, by design.
TP.xctrls.popup.defineAttribute('themeURI', TP.NO_RESULT);

//  The ID of the shared popup that is used in scenarios where popups are being
//  shared.
TP.xctrls.popup.Type.defineAttribute('sharedOverlayID', 'systemPopup');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.xctrls.popup.Type.defineMethod('initialize',
function() {

    /**
     * @method initialize
     * @summary Performs one-time setup for the type on startup/import.
     * @returns {TP.xctrls.popup} The receiver.
     */

    //  Set up an observation for TP.sig.OpenPopup
    this.observe(TP.ANY, TP.ac(TP.sig.OpenPopup, TP.sig.TogglePopup));

    return this;
});

//  ------------------------------------------------------------------------

TP.xctrls.popup.Type.defineHandler('OpenPopup',
function(aSignal) {

    /**
     * @method handleOpenPopup
     * @summary Handles when the popup is to be opened.
     * @param {TP.sig.OpenPopup} aSignal The TIBET signal which triggered
     *     this method.
     */

    return this.openOverlay(aSignal);
});

//  ------------------------------------------------------------------------

TP.xctrls.popup.Type.defineHandler('TogglePopup',
function(aSignal) {

    /**
     * @method handleTogglePopup
     * @summary Handles when the popup is to be toggled.
     * @param {TP.sig.TogglePopup} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.xctrls.popup} The receiver.
     */

    var popupTPElem;

    popupTPElem = this.getOverlayElement(aSignal);

    if (popupTPElem.isVisible()) {
        popupTPElem.setAttribute('hidden', true);
    } else {
        this.openOverlay(aSignal);
    }

    return this;
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

//  Whether or not the currently processing DOMClick signal is the 'triggering'
//  signal or is a subsequent DOMClick.
TP.xctrls.popup.defineAttribute('isTriggeringClick');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.xctrls.popup.Inst.defineMethod('getOverlayOffset',
function() {

    /**
     * @method getOverlayOffset
     * @summary Returns a numeric offset from the edge of the overlay's
     *     container that the overlay should use to offset it's position from
     *     the corner it will be positioned at.
     * @returns {Number} The offset.
     */

    return this.getType().POPUP_OFFSET;
});

//  ------------------------------------------------------------------------

TP.xctrls.popup.Inst.defineHandler('ClosePopup',
function(aSignal) {

    /**
     * @method handleClosePopup
     * @param {TP.sig.ClosePopup} aSignal The signal that caused this handler
     *     to trip.
     */

    this.setAttribute('hidden', true);

    return;
});

//  ------------------------------------------------------------------------

TP.xctrls.popup.Inst.defineHandler('DOMClick',
function(aSignal) {

    /**
     * @method handleDOMClick
     * @param {TP.sig.DOMClick} aSignal The TIBET signal which triggered
     *     this method.
     */

    var targetElem,
        triggerTPElem;

    targetElem = aSignal.getTarget();

    triggerTPElem = this.get('$triggerTPElement');

    //  If we don't have a valid triggering element, then check to see if the
    //  target element of the DOMClick is contained in ourself. If not, then
    //  hide ourself.
    if (TP.notValid(triggerTPElem)) {
        if (!this.contains(targetElem)) {
            this.setAttribute('hidden', true);
        }
    } else {

        //  If the target element of the DOMClick isn't contained in ourself,
        //  then check to see if the triggering element contains the target
        //  element (or is the triggering element itself). Also, check to see if
        //  this is *not* the triggering element. If any of those is the case,
        //  then hide ourself.
        if (!this.contains(targetElem)) {

            if (TP.unwrap(triggerTPElem) !== targetElem &&
                !triggerTPElem.contains(targetElem)) {
                this.setAttribute('hidden', true);
            } else if (!this.get('isTriggeringClick')) {
                this.setAttribute('hidden', true);
            }
        }
    }

    //  Flip the isTriggeringClick flag - there's no way that any subsequent
    //  clicks during this 'popup open' session are the triggering click.
    this.set('isTriggeringClick', false);

    return;
});

//  ------------------------------------------------------------------------

TP.xctrls.popup.Inst.defineMethod('setAttrHidden',
function(beHidden) {

    /**
     * @method setAttrHidden
     * @summary The setter for the receiver's hidden state.
     * @param {Boolean} beHidden Whether or not the receiver is in a hidden
     *     state.
     * @returns {Boolean} Whether the receiver's state is hidden.
     */

    var thisref;

    if (beHidden) {

        //  Blur any focused element that is enclosed within us.
        this.blurFocusedDescendantElement();

        this.ignore(TP.core.Mouse, 'TP.sig.DOMClick');
        this.ignore(TP.ANY, 'TP.sig.ClosePopup');

        this.ignoreKeybindingsDirectly();

    } else {

        this.observe(TP.core.Mouse, 'TP.sig.DOMClick');
        this.observe(TP.ANY, 'TP.sig.ClosePopup');

        this.set('isTriggeringClick', true);

        this.observeKeybindingsDirectly();

        //  Focus any autofocused element or the first focusable element under
        //  us. Note that we have to fork this for GUI refresh reasons - sigh.
        thisref = this;
        setTimeout(function() {
            thisref.focusAutofocusedOrFirstFocusableDescendant();
        }, 50);
    }

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.xctrls.popup.Inst.defineMethod('setContentAndActivate',
function(openSignal, popupContent) {

    /**
     * @method setContentAndActivate
     * @summary Sets the content of the receiver's native DOM counterpart to
     *     the content supplied and activates the receiver. If the content is
     *     not supplied, then the supplied trigger signal will be queried for
     *     contentID (the ID of an inlined content element) or contentURI (a URI
     *     pointing to some content).
     * @param {TP.sig.OpenPopup} openSignal The signal that was thrown to cause
     *     this popup to show.
     * @param {String|Element|DocumentFragment} [popupContent] The optional
     *     content to place inside of the popup element.
     * @returns {TP.core.Node} The result of setting the content of the
     *     receiver.
     */

    var lastTriggerID,
        currentTriggerID,

        firstContentChildTPElem,

        popupCorner,

        triggerRect,
        popupPoint,
        triggerTPElem;

    lastTriggerID = this.getType().get('$lastTriggerID');
    currentTriggerID = this.get('$currentTriggerID');

    triggerTPElem = this.get('$triggerTPElement');

    //  If there is a real last content local ID and it equals the local ID of
    //  the content we're trying to set, then we don't need to set the content
    //  at all - just refresh it, position ourself (again, in case the trigger
    //  moved since the last time we showed it) and show ourself..
    if (currentTriggerID === lastTriggerID) {

        //  We can only refresh it if it has real child content.
        firstContentChildTPElem =
            this.get('overlayContent').getFirstChildElement();

        if (TP.isValid(firstContentChildTPElem)) {

            //  Note here how we don't force the rendering behavior - if the
            //  data has changed, the content will re-render.
            firstContentChildTPElem.refresh();

            //  First, see if the open signal provided a popup point.
            popupPoint = openSignal.at('triggerPoint');

            //  If no popup point was given, compute one from the triggering
            //  element.
            if (TP.notValid(popupPoint)) {

                if (TP.notValid(triggerTPElem)) {
                    //  TODO: Raise an exception
                    return this;
                }

                //  Grab the global rect from the supplied element.
                triggerRect = triggerTPElem.getGlobalRect();

                //  Compute the corner if its not supplied in the trigger
                //  signal.
                popupCorner = openSignal.at('corner');
                if (TP.isEmpty(popupCorner)) {
                    popupCorner = TP.SOUTHWEST;
                }

                //  The point that the popup should appear at is the 'edge
                //  point' for that compass edge of the trigger rectangle.
                popupPoint = triggerRect.getEdgePoint(popupCorner);
            }

            //  If the signal doesn't have a flag to not position the popup,
            //  then position the popup relative to the popup point and the
            //  corner.
            if (TP.notTrue(openSignal.at('noPosition'))) {
                this.positionUsing(popupPoint);
            }

            //  Show the popup and set up signal handlers.
            this.setAttribute('hidden', false);

            return this;
        }
    }

    //  By default, popup overlays should be positioned southwest of their
    //  triggering element.
    openSignal.atPutIfAbsent('corner', TP.SOUTHWEST);

    this.callNextMethod();

    return this;
});

//  ============================================================================
//  Popup-specific TP.sig.Signal subtypes
//  ============================================================================

//  Popup signals
TP.sig.OpenOverlay.defineSubtype('OpenPopup');
TP.sig.CloseOverlay.defineSubtype('ClosePopup');
TP.sig.Signal.defineSubtype('TogglePopup');

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
