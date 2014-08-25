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
//  TP.html.area
//  ========================================================================

/**
 * @type {TP.html.area}
 * @synopsis 'area' tag. A clickable area.
 */

//  ------------------------------------------------------------------------

TP.html.Focused.defineSubtype('area');

TP.html.area.set('uriAttrs', TP.ac('href'));

//  ========================================================================
//  TP.html.map
//  ========================================================================

/**
 * @type {TP.html.map}
 * @synopsis 'map' tag. Client-side image map.
 */

//  ------------------------------------------------------------------------

//  ID is required in this subtype.
TP.html.Attrs.defineSubtype('map');

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
