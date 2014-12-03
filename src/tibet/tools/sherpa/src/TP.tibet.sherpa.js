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
 * @type {TP.tibet.sherpa}
 * @synopsis
 */

//  ----------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('tibet:sherpa');

//  ----------------------------------------------------------------------------
//  Type Methods
//  ----------------------------------------------------------------------------

TP.tibet.sherpa.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @name tagAttachDOM
     * @synopsis Sets up runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        elemWin,

        sherpaURI,

        request;

    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception
        return;
    }
    elemWin = TP.nodeGetWindow(elem);

    sherpaURI = TP.uc('~ide_root/xhtml/sherpa_framing.xhtml');

    request = TP.request();

    request.atPut(TP.ONLOAD,
                function(aDocument) {
                    var newSherpa;

                    //  This performs some initial setup. The first time the
                    //  Sherpa is triggered, it will complete its setup
                    //  sequence.
                    newSherpa = TP.core.sherpa.construct();
                    newSherpa.setID('Sherpa');
                    TP.sys.registerObject(newSherpa);
                });

    TP.wrap(elemWin).setContent(sherpaURI, request);

    return this.callNextMethod();
});

//  ----------------------------------------------------------------------------
//  end
//  ============================================================================
