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
 * @type {TP.goog.GoogleDocsHandler}
 * @synopsis A URL handler type that can store and load from Google Docs URLs.
 */

//  ------------------------------------------------------------------------

TP.core.URIHandler.defineSubtype('goog:GoogleDocsHandler');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

//  ------------------------------------------------------------------------
//  CONTENT METHODS
//  ------------------------------------------------------------------------

TP.goog.GoogleDocsHandler.Type.defineMethod('load',
function(targetURI, aRequest) {

    /**
     * @name load
     * @synopsis Loads URI data content and returns it on request. This is a
     *     template method which defines the overall process used for loading
     *     URI data and ensuring that the URI's cache and header content are
     *     kept up to date. You should normally override one of the more
     *     specific load* methods in subtypes if you're doing custom load
     *     handling.
     * @param {TP.core.URI} targetURI The URI to load. NOTE that this URI will
     *     not have been rewritten/ resolved.
     * @param {TP.sig.Request|TP.lang.Hash} aRequest An object containing
     *     request information accessible via the at/atPut collection API of
     *     TP.sig.Requests.
     * @returns {TP.sig.Response} A valid response object for the request.
     * @todo
     */

    var request,
        response,

        loadRequest;

    TP.debug('break.uri_load');

    request = TP.request(aRequest);
    response = request.constructResponse();

    //  Construct and initialize an TP.sig.GoogleDocsRequest, defaulting the
    //  'action' to 'downloadDoc' if the load request hasn't specified one.
    loadRequest = TP.sig.GoogleDocsRequest.construct(
            TP.hc('action', request.atIfInvalid('action', 'downloadDoc'),
                    'docId', request.at('docId'),
                    'username', request.at('username'),
                    'password', request.at('password')
                    ));

    //  'Join' that request to the incoming request. This will cause the
    //  incoming request to 'pause' until the get item request finishes and
    //  to be 'dependent' on the success/failure of the get item request.
    request.andJoinChild(loadRequest);

    //  Fire the load request to trigger service operation.
    loadRequest.fire();

    //  Make sure that the 2 requests match on sync/async
    request.updateRequestMode(loadRequest);

    return response;
});

//  ------------------------------------------------------------------------

TP.goog.GoogleDocsHandler.Type.defineMethod('nuke',
function(targetURI, aRequest) {

    /**
     * @name nuke
     * @synopsis Deletes the target URL.
     * @param {TP.core.URI} targetURI The URI to nuke. NOTE that this URI will
     *     not have been rewritten/ resolved.
     * @param {TP.sig.Request|TP.lang.Hash} aRequest An object containing
     *     request information accessible via the at/atPut collection API of
     *     TP.sig.Requests.
     * @returns {TP.sig.Response} A valid response object for the request.
     * @todo
     */

    return TP.todo();
});

//  ------------------------------------------------------------------------

TP.goog.GoogleDocsHandler.Type.defineMethod('save',
function(targetURI, aRequest) {

    /**
     * @name save
     * @synopsis Attempts to save data using standard TIBET save primitives to
     *     the URI (after rewriting) that is provided.
     * @param {TP.core.URI} targetURI The URI to save. NOTE that this URI will
     *     not have been rewritten/ resolved.
     * @param {TP.sig.Request|TP.lang.Hash} aRequest An object containing
     *     request information accessible via the at/atPut collection API of
     *     TP.sig.Requests.
     * @returns {TP.sig.Response} A valid response object for the request.
     * @todo
     */

    var request,
        response,

        content,

        saveRequest;

    TP.debug('break.uri_save');

    request = TP.request(aRequest);
    response = request.constructResponse();

    //  Saving data to Google requires 'data' to save ;-)
    if (TP.isEmpty(content = targetURI.getResource(TP.hc('async', false)))) {
        request.fail();
        return response;
    }

    saveRequest = TP.sig.GoogleDocsRequest.construct(
                    TP.hc('action', 'uploadDoc',
                            'body', content,
                            'docName', request.at('name'),
                            'refreshContent', false,
                            'username', request.at('username'),
                            'password', request.at('password')
                            ));

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

