//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ------------------------------------------------------------------------

//  ========================================================================
//  TP.html.command (HTML 5)
//  ========================================================================

/**
 * @type {TP.html.command}
 * @synopsis 'command' tag. Represents a command the user can invoke.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('command');

//  ========================================================================
//  TP.html.keygen (HTML 5)
//  ========================================================================

/**
 * @type {TP.html.keygen}
 * @synopsis 'keygen' tag. Key pair generation.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('keygen');

TP.html.keygen.set('booleanAttrs',
        TP.ac('autofocus', 'disabled', 'willValidate'));

//  ========================================================================
//  TP.html.noscript
//  ========================================================================

/**
 * @type {TP.html.noscript}
 * @synopsis 'noscript' tag. When client-side scripts disabled/unsupported.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('noscript');

//  ========================================================================
//  TP.html.script
//  ========================================================================

/**
 * @type {TP.html.script}
 * @synopsis 'script' tag. Embedded programming -- hmmm sounds familiar ;)
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('script');

TP.html.script.set('booleanAttrs', TP.ac('async', 'defer'));

TP.html.script.Type.set('uriAttrs', TP.ac('src'));

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.html.script.Type.defineMethod('$xmlifyContent',
function(src) {

    //  TODO:   optimize for sugared XHTML input
    return src;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
