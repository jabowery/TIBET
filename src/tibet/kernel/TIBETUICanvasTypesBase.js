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
 * @subject Common extensions to the base TP.core.Window type.
 * @todo
 */

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.core.Window.Type.defineMethod('installDocumentExtensions',
function(aWindow) {

    /**
     * @name installDocumentExtensions
     * @synopsis Instruments the document belonging to aWindow with TIBET
     *     specific functions.
     * @param {Window} aWindow The window of the document to install the
     *     functions on.
     * @returns {TP.core.Window} The receiver.
     */

    return this;
});

//  ------------------------------------------------------------------------

TP.core.Window.Type.defineMethod('installLoadUnloadHooks',
function(aWindow) {

    /**
     * @name installLoadUnloadHooks
     * @synopsis This method installs the TIBET load/unload hooks onto the
     *     supplied native window so that load/unload events on that window can
     *     be caught by TIBET and rebroadcast into the system as signals.
     * @param {Window} aWindow The Window to install the load/unload hooks onto.
     * @returns {TP.core.Window} The receiver.
     */

    var tibetWin,
        dclListener,
        unloadListener;

    if (!TP.isWindow(aWindow)) {
        return this.raise('TP.sig.InvalidWindow');
    }

    if (TP.$$DEBUG) {
        TP.boot.$stdout('Arming window: ' + TP.gid(aWindow) + '.', TP.DEBUG);
        TP.boot.$stdout('Adding listeners to ' + aWindow.name + '.', TP.DEBUG);
    }

    //  Set the native window's onerror handler to the standard TIBET
    //  onerror handler, so that errors that occur in the window are
    //  processed by the TIBET error handling system.
    aWindow.onerror = TP.sys.onerror;

    //  assign our codebase window to the var we'll close around
    tibetWin = window;

    //  Note that, because this method is called from the hook file which might,
    //  itself, be being processed as part of a load cycle, we need to make sure
    //  that the window doesn't already have these handlers installed.

    //  Therefore, to maximize symmetry for these methods, and to make sure they
    //  don't get registered multiple times we go ahead and put the slots on the
    //  window for both and don't install them if they're already installed.

    if (TP.notValid(aWindow.dclListener)) {
        dclListener = function(anEvent) {

                        if (anEvent.target !== aWindow.document) {
                            if (TP.$$DEBUG) {
                                TP.boot.$stdout(
                                    'Ignoring DOMContentLoaded from target: ' +
                                    anEvent.target + '.', TP.DEBUG);
                            }
                            return;
                        }

                        //  NOTE that this signal is only triggered in
                        //  response to a location change. altering the DOM
                        //  of the document element won't trigger it.
                        if (TP.$$DEBUG) {
                            TP.boot.$stdout('DOMContentLoaded at: ' +
                                TP.str(anEvent.target), TP.DEBUG);
                        }


                        //  remove so we don't trigger again due to
                        //  processDocumentLoaded invocation(s)
                        aWindow.removeEventListener(
                                'DOMContentLoaded',
                                dclListener,
                                false);

                        //  writing handler is false, we're the location
                        //  handler
                        tibetWin.TP.$$processDocumentLoaded(aWindow);

                        aWindow.dclListener = null;
                    };
        aWindow.dclListener = dclListener;

        aWindow.addEventListener('DOMContentLoaded', dclListener, false);
    }

    if (TP.notValid(aWindow.unloadListener)) {
        unloadListener = function(anEvent) {

                            if (anEvent.target !== aWindow.document) {
                                if (TP.$$DEBUG) {
                                    TP.boot.$stdout(
                                        'Ignoring unload from target: ' +
                                        anEvent.target + '.', TP.DEBUG);
                                }
                                return;
                            }

                            //  NOTE that this signal is only triggered in
                            //  response to a location change. altering the DOM
                            //  of the document element won't trigger it.
                            if (TP.$$DEBUG) {
                                TP.boot.$stdout('unload at: ' +
                                    TP.str(anEvent.target), TP.DEBUG);
                            }

                            aWindow.removeEventListener(
                                    'unload',
                                    unloadListener,
                                    false);

                            tibetWin.TP.$$processDocumentUnloaded(aWindow);

                            aWindow.unloadListener = null;
                        };
        aWindow.unloadListener = unloadListener;

        aWindow.addEventListener('unload', unloadListener, false);
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.core.Window.Type.defineMethod('installWindowExtensions',
function(aWindow) {

    /**
     * @name installWindowExtensions
     * @synopsis Installs a set of common functions onto aWindow to enhance that
     *     window's capability within the TIBET framework.
     * @param {Window} aWindow The window to install the functions on.
     * @returns {TP.core.Window} The receiver.
     */

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
