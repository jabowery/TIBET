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
 * @type {TP.amazon.AmazonS3Handler}
 * @summary A URL handler type that can store and load from Amazon S3 URLs.
 */

//  ------------------------------------------------------------------------

TP.core.URIHandler.defineSubtype('amazon.AmazonS3Handler');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.amazon.AmazonS3Handler.Type.defineMethod('load',
function(targetURI, aRequest) {

    /**
     * @method load
     * @summary Loads URI data content and returns it on request. This is a
     *     template method which defines the overall process used for loading
     *     URI data and ensuring that the URI's cache and header content are
     *     kept up to date. You should normally override one of the more
     *     specific load* methods in subtypes if you're doing custom load
     *     handling.
     * @param {TP.core.URI} targetURI The URI to load. NOTE that this URI will
     *     not have been rewritten/ resolved.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object containing
     *     request information accessible via the at/atPut collection API of
     *     TP.sig.Requests.
     * @returns {TP.sig.Response} A valid response object for the request.
     */

    var request,
        response,
        action,
        loadRequest;

    request = TP.request(aRequest);
    response = request.getResponse();

    //  If an action is already defined, then we just go with a generic
    //  request.
    if (TP.notEmpty(action = request.at('action'))) {
        //  Construct and initialize an TP.sig.AmazonS3Request using the
        //  URI as a parameter.
        loadRequest = TP.sig.AmazonS3Request.construct(
            TP.hc('action', action, 'uri', targetURI.asString()));
    } else {
        //  Construct and initialize an TP.sig.AmazonS3GetItemRequest using
        //  the URI as a parameter.
        loadRequest = TP.sig.AmazonS3GetItemRequest.construct(
            TP.hc('uri', targetURI.asString()));
    }

    //  Make sure the 'key' and 'secretkey' are populated into the load
    //  request.
    loadRequest.atPut('key', request.at('key'));
    loadRequest.atPut('secretkey', request.at('secretkey'));

    //  'Join' that request to the incoming request. This will cause the
    //  incoming request to 'pause' until the get item request finishes and
    //  to be 'dependent' on the success/failure of the get item request.
    request.andJoinChild(loadRequest);

    //  Fire the get item request to trigger service operation.
    loadRequest.fire();

    //  Make sure that the 2 requests match on sync/async
    request.updateRequestMode(loadRequest);

    return response;
});

//  ------------------------------------------------------------------------

TP.amazon.AmazonS3Handler.Type.defineMethod('delete',
function(targetURI, aRequest) {

    /**
     * @method delete
     * @summary Deletes the target URL.
     * @param {TP.core.URI} targetURI The URI to delete. NOTE that this URI will
     *     not have been rewritten/ resolved.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object containing
     *     request information accessible via the at/atPut collection API of
     *     TP.sig.Requests.
     * @returns {TP.sig.Response} A valid response object for the request.
     */

    return TP.todo();
});

//  ------------------------------------------------------------------------

TP.amazon.AmazonS3Handler.Type.defineMethod('save',
function(targetURI, aRequest) {

    /**
     * @method save
     * @summary Attempts to save data using standard TIBET save primitives to
     *     the URI (after rewriting) that is provided.
     * @param {TP.core.URI} targetURI The URI to save. NOTE that this URI will
     *     not have been rewritten/ resolved.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object containing
     *     request information accessible via the at/atPut collection API of
     *     TP.sig.Requests.
     * @returns {TP.sig.Response} A valid response object for the request.
     */

    var request,
        response,
        resp,
        content,
        saveRequest;

    request = TP.request(aRequest);
    response = request.getResponse();

    //  Saving data to Amazon requires 'data' to save ;-)
    resp = targetURI.getResource(TP.hc('async', false, 'resultType', TP.TEXT));

    if (TP.isEmpty(content = resp.get('result'))) {
        request.fail();
        return response;
    }

    saveRequest = TP.sig.AmazonS3PutItemRequest.construct(
        TP.hc('uri', targetURI.asString(),
              'body', content,
              'refreshContent', false));

    //  Make sure the 'key' and 'secretkey' are populated into the save
    //  request.
    saveRequest.atPut('key', request.at('key'));
    saveRequest.atPut('secretkey', request.at('secretkey'));

    //  'Join' that request to the incoming request. This will cause the
    //  incoming request to 'pause' until the put item request finishes and
    //  to be 'dependent' on the success/failure of the put item request.
    request.andJoinChild(saveRequest);

    //  Fire the save request to trigger service operation.
    saveRequest.fire();

    //  Make sure that the 2 requests match on sync/async
    request.updateRequestMode(saveRequest);

    return response;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
