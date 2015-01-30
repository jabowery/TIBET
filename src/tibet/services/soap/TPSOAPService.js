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
 * @type {TP.core.SOAPService}
 * @synopsis A TP.core.Service specific to making SOAP requests. This particular
 *     service is only available to browsers which support an XMLHttpRequest API
 *     such as IE or Mozilla.
 * @examples
 // construct a simple request, this one's for Flickr:
 *
 *     request = TP.sig.SOAPRequest.construct(); request.atPut('uri',
 *     'http://api.flickr.com/services/soap/');
 *
 *     // in this case we'll construct a temporary payload object // that knows
 *     what flickr wants to see in SOAP calls
 *
 *     payload = TP.hc('api_key', '67769adc70ee70b5f666167c9d3b11db',
 *     'test','echo', 'method','flickr.test.echo');
 *
 *     payload.defineMethod('asSOAPBody', function(aRequest) {
 *
 *     var body;
 *
 *     body = TP.join( '<x:FlickrRequest xmlns:x="urn:flickr">',
 *     TP.str(TP.js2xml(this)), '</x:FlickrRequest>');
 *
 *     return body; });
 *
 *     request.atPut('body', payload);
 *
 *     request.defineMethod('handleRequestSucceeded', function(aResponse) {
 *
 *     TP.info(aResponse.getResult(), TP.LOG); });
 *
 *     // activate the request:
 *
 *     request.fire();
 */

//  ------------------------------------------------------------------------

TP.core.HTTPService.defineSubtype('SOAPService');

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

//  we'll respond to any TP.sig.SOAPRequest signals
TP.core.SOAPService.Type.defineAttribute('triggerSignals',
                                        'TP.sig.SOAPRequest');

TP.core.SOAPService.register();

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.SOAPService.Inst.defineMethod('rewriteRequestMIMEType',
function(aRequest) {

    /**
     * @name rewriteRequestMIMEType
     * @synopsis Returns the MIME type the request should be using. For a SOAP
     *     service this is always TP.XML_ENCODED.
     * @param {TP.sig.Request} aRequest The request being encoded.
     * @returns {Constant} A constant suitable for TP.httpEncode.
     */

    return TP.XML_ENCODED;
});

//  ------------------------------------------------------------------------

TP.core.SOAPService.Inst.defineMethod('rewriteRequestBody',
function(aRequest) {

    /**
     * @name rewriteRequestBody
     * @synopsis Encodes the request body for transmission. Processing in this
     *     method makes use of any 'mimetype' key in the request to determine an
     *     encoding to use. Supported encodings can be found in the
     *     TP.httpEncode primitive.
     * @param {TP.sig.SOAPRequest} aRequest The request whose parameters define
     *     the HTTP request.
     * @returns {String} The string value of the encoded body content.
     */

    return aRequest.asSOAPMessage();
});

//  ------------------------------------------------------------------------

TP.core.SOAPService.Inst.defineMethod('rewriteRequestHeaders',
function(aRequest) {

    /**
     * @name rewriteRequestHeaders
     * @synopsis Returns a TP.lang.Hash of HTTP headers appropriate for the
     *     service. SOAP requires a specific Content-Type and a SOAPAction
     *     header for older versions of the specification.
     * @param {TP.sig.SOAPRequest} aRequest The request whose parameters define
     *     the HTTP request.
     * @returns {TP.lang.Hash} The hash of HTTP headers.
     */

    var headers,
        method;

    headers = this.callNextMethod();

    headers.atPut('Content-Type', TP.XML_ENCODED);

    //  SOAPAction is required by older versions of the specification
    method = aRequest.atIfInvalid('method', '');
    headers.atPut('SOAPAction', method);

    return headers;
});

//  ------------------------------------------------------------------------

TP.core.SOAPService.Inst.defineMethod('rewriteRequestVerb',
function(aRequest) {

    /**
     * @name rewriteRequestVerb
     * @synopsis Returns the HTTP verb to use for the request. For SOAP this
     *     always returns TP.HTTP_POST per the specification.
     * @param {TP.sig.SOAPRequest} aRequest The request whose parameters define
     *     the HTTP request.
     * @returns {Constant} A TIBET HTTP Verb constant such as TP.HTTP_GET.
     */

    return TP.HTTP_POST;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
