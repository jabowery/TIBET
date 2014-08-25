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
 * @Root signal definitions for XMPP signals.
 * @todo
 */

//  ------------------------------------------------------------------------

TP.sig.Signal.defineSubtype('XMPPSignal');

TP.sig.XMPPSignal.defineSubtype('XMPPDataAvailable');
TP.sig.XMPPSignal.defineSubtype('XMPPTransportReady');
TP.sig.XMPPSignal.defineSubtype('XMPPConnectionReady');

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
