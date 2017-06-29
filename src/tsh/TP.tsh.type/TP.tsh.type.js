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
 * @type {TP.tsh.type}
 * @summary A subtype of TP.core.ActionElementNode that knows how to create new
 *     types in the TIBET system.
 */

//  ------------------------------------------------------------------------

TP.core.ActionElementNode.defineSubtype('tsh:type');

TP.tsh.type.addTraits(TP.tsh.Element);

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.tsh.type.Type.defineMethod('tshExecute',
function(aRequest) {

    /**
     * @method tshExecute
     * @summary Runs the receiver, effectively invoking its action.
     * @param {TP.sig.Request} aRequest The request containing command input for
     *     the shell.
     * @returns {Object} A value which controls how the outer TSH processing
     *     loop should continue. Common values are TP.CONTINUE, TP.DESCEND, and
     *     TP.BREAK.
     */

    var shell,
        shouldAssist;

    shell = aRequest.at('cmdShell');

    shouldAssist = TP.bc(shell.getArgument(
                                    aRequest, 'tsh:assist', null, false));

    if (shouldAssist) {

        //  Fire a 'AssistObject' signal, supplying the target object to focus
        //  on.
        TP.signal(
                null,
                'AssistObject',
                TP.hc('targetObject', this,
                        'title', 'Type Assistant',
                        'assistantParams', TP.hc('originalRequest', aRequest)));

        return aRequest.complete(TP.TSH_NO_VALUE);
    }

    //  Fire a 'RemoteConsoleCommand' with a 'type ...' command, supplying the
    //  original request.
    TP.signal(null,
                'RemoteConsoleCommand',
                TP.hc('originalRequest', aRequest,
                        TP.ONSUCCESS, function(aResponse) {

                            //  Subscribe to 'script imported' - those will be
                            //  the scripts for the new type(s) that got created
                            //  by executing our command remotely. Note that we
                            //  do this each time we are run, since we will
                            //  remove this observation below in our handler.
                            //  We're not interested in all 'script imported'
                            //  signals.
                            this.observe(TP.sys, 'ScriptImported');
                        }.bind(this),
                        TP.ONFAIL, function(aResponse) {
                            //  TODO: Raise an exception;
                        }
                ));

    aRequest.complete(TP.TSH_NO_VALUE);

    return;
});

//  ------------------------------------------------------------------------

TP.tsh.type.Type.defineMethod('getContentForAssistant',
function() {

    var assistantTPElem;

    assistantTPElem = TP.tsh.type_assistant.getResourceElement(
                        'template',
                        TP.ietf.Mime.XHTML);

    return TP.unwrap(assistantTPElem);
});

//  ------------------------------------------------------------------------

TP.tsh.type.Type.defineHandler('ScriptImported',
function(aSignal) {

    //  Unsubscribe us from this signal each time we run the handler. We're only
    //  interested in this signal when we're defining new types.
    this.ignore(TP.sys, 'ScriptImported');

    //  Tell the system that we defined new types.
    this.signal('TypeAdded', aSignal.getPayload());

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
