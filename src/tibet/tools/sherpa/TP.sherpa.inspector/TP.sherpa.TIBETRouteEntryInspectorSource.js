//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ========================================================================

//  ========================================================================
//  TP.sherpa.TIBETRouteEntryInspectorSource
//  ========================================================================

/**
 * @type {TP.sherpa.TIBETRouteEntryInspectorSource}
 */

TP.sherpa.InspectorSource.defineSubtype(
                            'sherpa.TIBETRouteEntryInspectorSource');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.TIBETRouteEntryInspectorSource.Inst.defineMethod(
    'getConfigForInspector',
function(options) {

    /**
     * @method getConfigForInspector
     * @summary Returns the source's configuration data to configure the bay
     *     that the source's content will be hosted in.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the configuration data. This will have the following keys,
     *     amongst others:
     *          'targetObject':     The object being queried using the
     *                              targetAspect to produce the object being
     *                              displayed.
     *          'targetAspect':     The property of the target object currently
     *                              being displayed.
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     * @returns {TP.core.Hash} Configuration data used by the inspector for bay
     *     configuration. This could have the following keys, amongst others:
     *          TP.ATTR + '_contenttype':   The tag name of the content being
     *                                      put into the bay
     *          TP.ATTR + '_class':         Any additional CSS classes to put
     *                                      onto the bay inspector item itself
     *                                      to adjust to the content being
     *                                      placed in it.
     */

    options.atPut(TP.ATTR + '_contenttype', 'html:div');

    return options;
});

//  ------------------------------------------------------------------------

TP.sherpa.TIBETRouteEntryInspectorSource.Inst.defineMethod(
    'getContentForInspector',
function(options) {

    /**
     * @method getContentForInspector
     * @summary Returns the source's content that will be hosted in an inspector
     *     bay.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the content. This will have the following keys, amongst
     *     others:
     *          'targetObject':     The object being queried using the
     *                              targetAspect to produce the object being
     *                              displayed.
     *          'targetAspect':     The property of the target object currently
     *                              being displayed.
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     *          'bindLoc':          The URI location where the data for the
     *                              content can be found.
     * @returns {Element} The Element that will be used as the content for the
     *     bay.
     */

    var dataURI;

    dataURI = TP.uc(options.at('bindLoc'));

    return TP.xhtmlnode(
        '<div class="property_sheet"' +
                ' bind:scope="' + dataURI.asString() + '">' +
            '<fieldset>' +
                '<div>' +
                    '<input id="RouteContent" type="text" bind:io="{value: content}"/><br/>' +
                    '<label for="RouteContent">Content:</label>' +
                '</div>' +
                '<div>' +
                    '<input id="RouteTarget" type="text" bind:io="target"/><br/>' +
                    '<label for="RouteTarget">Target:</label>' +
                '</div>' +
                '<div>' +
                    '<input id="RouteController" type="text" bind:io="controller"/><br/>' +
                    '<label for="RouteController">Controller:</label>' +
                '</div>' +
                '<div>' +
                    '<input id="RouteSignal" type="text" bind:io="signal"/><br/>' +
                    '<label for="RouteSignal">Signal:</label>' +
                '</div>' +
                '<div>' +
                    '<input id="RouteRedirect" type="text" bind:io="redirect"/><br/>' +
                    '<label for="RouteRedirect">Redirect:</label>' +
                '</div>' +
                '<div>' +
                    '<input id="RouteReroute" type="text" bind:io="reroute"/><br/>' +
                    '<label for="RouteReroute">Reroute:</label>' +
                '</div>' +
                '<div>' +
                    '<input id="RouteDeeproot" type="checkbox" bind:io="{checked: deeproot}"/><br/>' +
                    '<label for="RouteDeeproot">Deep Root:</label>' +
                '</div>' +
            '</fieldset>' +
        '</div>');
});

//  ------------------------------------------------------------------------

TP.sherpa.TIBETRouteEntryInspectorSource.Inst.defineMethod(
    'getDataForInspector',
function(options) {

    /**
     * @method getDataForInspector
     * @summary Returns the source's data that will be supplied to the content
     *     hosted in an inspector bay. In most cases, this data will be bound to
     *     the content using TIBET data binding. Therefore, when this data
     *     changes, the content will be refreshed to reflect that.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the data. This will have the following keys, amongst others:
     *          'targetObject':     The object being queried using the
     *                              targetAspect to produce the object being
     *                              displayed.
     *          'targetAspect':     The property of the target object currently
     *                              being displayed.
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     *          'bindLoc':          The URI location where the data for the
     *                              content can be found.
     * @returns {Object} The data that will be supplied to the content hosted in
     *     a bay.
     */

    var targetAspect,

        initialPath,

        data,

        dataURI,

        dataURISecondaries,
        i;

    targetAspect = options.at('targetAspect');

    initialPath = 'route.map.' + targetAspect;

    data = TP.core.ConfigPropertyAdaptor.construct(initialPath);

    dataURI = TP.uc(options.at('bindLoc'));
    dataURISecondaries = dataURI.getSecondaryURIs();
    for (i = 0; i < dataURISecondaries.getSize(); i++) {
        TP.core.URI.removeInstance(dataURISecondaries.at(i));
    }

    dataURI.setResource(data, TP.request('signalChange', false));

    return data;
});

//  ------------------------------------------------------------------------
//  ------------------------------------------------------------------------
//  ------------------------------------------------------------------------

TP.lang.Object.defineSubtype('core.ConfigPropertyAdaptor');

TP.core.ConfigPropertyAdaptor.Inst.defineAttribute('pathPrefix');

//  ------------------------------------------------------------------------

TP.core.ConfigPropertyAdaptor.Inst.defineMethod('init',
function(pathPrefix) {

    /**
     * @method init
     * @summary Initialize the instance.
     * @returns {TP.sherpa.InspectorSource} The receiver.
     */

    this.callNextMethod();

    this.$set('pathPrefix', pathPrefix, false);

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ConfigPropertyAdaptor.Inst.defineMethod('get',
function(attributeName) {

    var path,
        val,

        attrName;

    if (attributeName === 'pathPrefix') {
        return this.pathPrefix;
    }

    if (attributeName.isAccessPath()) {
        attrName = attributeName.asString();
    } else {
        attrName = attributeName;
    }

    path = this.get('pathPrefix') + '.' + attrName;

    val = TP.sys.getcfg(path);

    return val;
});

//  ------------------------------------------------------------------------

TP.core.ConfigPropertyAdaptor.Inst.defineMethod('set',
function(attributeName, attributeValue, shouldSignal) {

    var path,

        attrName;

    if (attributeName.isAccessPath()) {
        attrName = attributeName.asString();
    } else {
        attrName = attributeName;
    }

    path = this.get('pathPrefix') + '.' + attrName;

    //  NB: We could use isFalsey here, but we want '' and 0 to actually be set.
    if (TP.notValid(attributeValue) || TP.isFalse(attributeValue)) {
        TP.sys.setcfg(path, undefined);
    } else {
        TP.sys.setcfg(path, attributeValue);
    }

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================