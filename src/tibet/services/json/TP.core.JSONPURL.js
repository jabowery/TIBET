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
 * @type {TP.core.JSONPURL}
 * @summary A subtype of TP.core.URL specific to the 'jsonp://' scheme.
 * @description The overall format of a jsonp URI is:
 *
 *     jsonp://[domain]/[path]/[entity]?[query]
 *
 *
 * @example

 *     Read JSON data using JSONP and the CrunchBase API on Facebook.
 *     NOTE: We do *not* supply the callback parameter here - TIBET's machinery
 *     takes care of that for us. We use standard TIBET observation mechanisms
 *     to be notified when the data is ready.
 *
 *     myJSONPURL =
 *     TP.uc('jsonp://api.crunchbase.com/v/1/company/facebook.js');
 *
 *     jsonRequest = TP.request('refresh', true);
 *     jsonRequest.defineHandler('RequestSucceeded', function(aRequest) {
 *
 *     TP.ifInfo() ? TP.info('The results are: ' +
 *     TP.str(aRequest.getResult())): 0; });
 *
 *     OR Fetch the content and ignore the URL cache, going to the data source
 *     each time:
 *
 *     myJSONPURL.getResource(jsonRequest);
 */

//  ------------------------------------------------------------------------

TP.core.URL.defineSubtype('JSONPURL');

TP.core.JSONPURL.addTraits(TP.core.CommURL);

//  ------------------------------------------------------------------------
//  Type Constants
//  ------------------------------------------------------------------------

//  This RegExp splits up the URL into the following components:
//  jsonp://[domain]/[path]/[entity]?[query]
TP.core.JSONPURL.Type.defineConstant('JSONP_REGEX',
        TP.rc('^jsonps?://([^/]*)/?([^?]+)\\??(.*)'));

TP.core.JSONPURL.Type.defineConstant('SCHEME', 'jsonp');

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

//  JSONP is async-only so configure for that
TP.core.JSONPURL.Type.defineAttribute('supportedModes',
                                    TP.core.SyncAsync.ASYNCHRONOUS);
TP.core.JSONPURL.Type.defineAttribute('mode',
                                    TP.core.SyncAsync.ASYNCHRONOUS);

TP.core.JSONPURL.registerForScheme('jsonp');
TP.core.JSONPURL.registerForScheme('jsonps');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.core.JSONPURL.Type.defineMethod('$getDefaultHandler',
function(targetURI, aRequest) {

    /**
     * @method $getDefaultHandler
     * @summary Return the default URI handler type for this URI type.
     * @param {TP.core.URI|String} aURI The URI to obtain the default handler
     *     for.
     * @param {TP.sig.Request} aRequest The request whose values should inform
     *     the routing assignment.
     * @returns {TP.lang.RootObject.<TP.core.URIHandler>} A TP.core.URIHandler
     *     subtype type object.
     */

    return TP.core.JSONPURLHandler;
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

//  note that there are 'scheme', 'path' and 'fragment' ivars on
//  TP.core.URI / TP.core.URL
TP.core.JSONPURL.Inst.defineAttribute('domain');
TP.core.JSONPURL.Inst.defineAttribute('entity');

TP.core.JSONPURL.Inst.defineAttribute('query');
TP.core.JSONPURL.Inst.defineAttribute('queryDict');

TP.core.JSONPURL.Inst.defineAttribute('useSSL', false);

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.JSONPURL.Inst.defineMethod('init',
function(aURIString) {

    /**
     * @method init
     * @summary Initialize the instance.
     * @param {String} aURIString A String containing a proper URI.
     * @returns {TP.core.JSONPURL} A new instance.
     */

    var results,
        pathAndName,
        uriQuery,
        queryDict;

    this.callNextMethod();

    //  Run the type's RegExp and grab the pieces of the URL.
    results = this.getType().JSONP_REGEX.exec(aURIString);
    if (TP.notValid(results)) {
        this.raise('TP.sig.InvalidURI',
                    'Unable to parse: ' + aURIString);

        return;
    }

    //  'jsonps:' is our URL scheme for loading JSONP data over https:
    if (/^jsonps/.test(aURIString)) {
        this.set('useSSL', true);
    }

    this.set('domain', results.at(1));

    pathAndName = results.at(2);
    if (pathAndName.contains('/')) {
        this.set('path',
                    '/' + pathAndName.slice(0,
                                            pathAndName.lastIndexOf('/')));
        this.set('entity',
                    pathAndName.slice(pathAndName.lastIndexOf('/') + 1));
    } else {
        this.set('path', '/');
        this.set('entity', pathAndName);
    }

    //  If there are parameters in the query, process them into a hash.
    if (TP.notEmpty(uriQuery = results.at(3))) {
        this.set('query', uriQuery);

        //  Create a hash from the query string.
        queryDict = TP.core.Hash.fromString(uriQuery);
        this.set('queryDict', queryDict);
    }

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
