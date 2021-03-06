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
 */

//  ========================================================================
//  TP.sys Primitives
//  ========================================================================

TP.sys.addFeatureTest('sherpa',
function() {

    //  NB: For the system to be considered to have the 'sherpa' feature, it has
    //  to both have the 'TP.core.Sherpa' type loaded *and* have the Sherpa
    //  enabled for opening. The Sherpa HUD doesn't necessarily have to be open.
    return TP.isType(TP.sys.getTypeByName('TP.core.Sherpa')) &&
            TP.sys.cfg('sherpa.enabled') === true;
});

//  ========================================================================
//  TP.core.CustomTag
//  ========================================================================

/**
 * @type {TP.core.CustomTag}
 * @summary A common supertype for custom UI tags.
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('TP.core.CustomTag');

TP.core.CustomTag.addTraits(TP.core.NonNativeUIElementNode);

TP.core.CustomTag.Inst.resolveTraits(
        TP.ac('$setAttribute', 'removeAttribute', 'select', 'signal'),
        TP.core.UIElementNode);

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.core.CustomTag.Type.defineHandler('ValueChange',
function(aSignal) {

    /**
     * @method handleValueChange
     * @summary Handles notification of a change.
     * @description If the origin is a URI that one of our 'reloadable
     *     attributes' has as the reference to its remote resource, then the
     *     'reloadFrom<Attr>' method is invoked on the receiver.
     * @param {TP.sig.Signal} aSignal The signal instance to respond to.
     */

    var origin,
        aspect;

    //  Grab the signal origin - for changes to observed URI resources (see the
    //  tagAttachDOM()/tagDetachDOM() methods) this should be the URI that
    //  changed.
    origin = aSignal.getSignalOrigin();

    //  If it was a URL, then check to see if it's one of URL's 'special
    //  aspects'.
    if (TP.isKindOf(origin, TP.core.URL)) {

        //  If the aspect is one of URI's 'special aspects', then we just return
        //  here.
        aspect = aSignal.at('aspect');
        if (TP.core.URI.SPECIAL_ASPECTS.contains(aspect)) {
            return;
        }
    }

    if (TP.canInvoke(this, 'refreshInstances')) {
        this.refreshInstances();
    }
});

//  ========================================================================
//  TP.core.CompiledTag
//  ========================================================================

/**
 * @type {TP.core.CompiledTag}
 * @summary A common supertype for compiled UI tags.
 */

//  ------------------------------------------------------------------------

TP.core.CustomTag.defineSubtype('TP.core.CompiledTag');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.core.CompiledTag.Type.defineMethod('defineMethod',
function(methodName, methodBody, methodDescriptor, display, $isHandler) {

    /**
     * @method defineMethod
     * @summary Adds the function with name and body provided as a type or
     *     'type local' method.
     * @param {String} methodName The name of the new method.
     * @param {Function} methodBody The actual method implementation.
     * @param {Object} methodDescriptor An optional 'property descriptor'. If a
     *     'value' slot is supplied here, it is ignored in favor of the
     *     methodBody parameter to this method.
     * @param {String} display Optional string defining the public display name
     *     for the function.
     * @param {Boolean} [$isHandler=false] True will cause the definition to
     *     pass without errors for deprecated use of defineMethod for handlers.
     * @returns {Function} The newly defined method.
     */

    var retVal;

    //  Gotta love TIBET - redefining the 'defineMethod' method for a particular
    //  type and its subtypes. And callNextMethod() too!

    retVal = this.callNextMethod();

    //  If we're redefining the 'tagCompile' method and the system has started,
    //  then we need to refresh all of the existing instances.
    if (methodName === 'tagCompile' && TP.sys.hasStarted()) {
        this[TP.OWNER].refreshInstances();
    }

    return retVal;
});

//  ------------------------------------------------------------------------

TP.core.CompiledTag.Type.defineMethod('tagCompile',
function(aRequest) {

    /**
     * @method tagCompile
     * @summary Convert instances of the tag into their HTML representation.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     * @returns {Element} The new element.
     */

    var str,
        elem,
        newElem;

    if (!TP.isElement(elem = aRequest.at('node'))) {
        return;
    }

    if (TP.sys.hasFeature('sherpa')) {
        str = '<a onclick="TP.bySystemId(\'SherpaConsoleService\')' +
                '.sendConsoleRequest(\':inspect ' +
                this.getID().replace(':', '.') + '.Type.tagCompile' +
                '\'); return false;" tibet:tag="' +
                this.getCanonicalName() + '">' +
                '&lt;' + this.getCanonicalName() + '/&gt;' +
                '</a>';
    } else {
        str = '<a onclick="alert(\'Edit ' + this.getID() +
                '.Type.tagCompile.\')" href="#" tibet:tag="' +
                this.getCanonicalName() + '">' +
                '&lt;' + this.getCanonicalName() + '/&gt;' +
                '</a>';
    }

    newElem = TP.xhtmlnode(str);

    //  Note here how we return the *result* of this method due to node
    //  importing, etc.
    return TP.elementReplaceWith(elem, newElem);
});

//  ========================================================================
//  TP.core.TemplatedTag
//  ========================================================================

/**
 * @type {TP.core.TemplatedTag}
 * @summary A common supertype for templated UI tags. This type provides an
 * inheritance root for templated tags by mixing in TemplatedNode properly.
 */

TP.core.CustomTag.defineSubtype('TP.core.TemplatedTag');

//  ------------------------------------------------------------------------

//  Mix in templating behavior, resolving compile in favor of templating.
TP.core.TemplatedTag.addTraits(TP.core.TemplatedNode);

TP.core.TemplatedTag.Type.resolveTrait('tagCompile', TP.core.TemplatedNode);

TP.core.TemplatedTag.Type.defineAttribute('registeredForURIUpdates');

//  Whether or not we're currently in the process of being serialized.
TP.core.TemplatedTag.Inst.defineAttribute('$areSerializing');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.core.TemplatedTag.Type.defineMethod('construct',
function(nodeSpec, varargs) {

    /**
     * @method construct
     * @summary Constructs a new instance to wrap a native node. The native node
     *     may have been provided or a String could have been provided. By far
     *     the most common usage is construction of a wrapper around an existing
     *     node.
     * @param {Node|URI|String|TP.core.Node} nodeSpec Some suitable object to
     *     construct a source node. See type discussion above. Can also be null.
     * @param {Array} varargs Optional additional arguments for the
     *     constructor.
     * @returns {TP.core.TemplatedTag} A new instance.
     */

    var retVal,

        elem,
        uri;

    //  Call up to get the instance of this type wrapping our native node.
    retVal = this.callNextMethod();

    //  Grab the native node
    elem = retVal.getNativeNode();

    //  If we haven't set up this type to register for updates coming from it's
    //  URI, do so now.
    if (TP.notTrue(this.get('registeredForURIUpdates'))) {

        uri = this.getResourceURI(
                        'template',
                        TP.elementGetAttribute(elem, 'tibet:mime', true));

        if (TP.isURI(uri)) {
            this.observe(uri, 'TP.sig.ValueChange');
            uri.watch();
        }

        //  Set the flag so that we don't do this again.
        this.set('registeredForURIUpdates', true);
    }

    return retVal;
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.TemplatedTag.Inst.defineMethod('serializeCloseTag',
function(storageInfo) {

    /**
     * @method serializeCloseTag
     * @summary Serializes the closing tag for the receiver.
     * @description At this type level, this method, in conjunction with the
     *     'serializeOpenTag' method, will always produce the 'XML version' of
     *     an empty tag (i.e. '<foo/>' rather than '<foo></foo>').
     * @param {TP.core.Hash} storageInfo A hash containing various flags for and
     *     results of the serialization process. Notable keys include:
     *          'wantsXMLDeclaration': Whether or not the document node should
     *          include an 'XML declaration' at the start of it's serialization.
     *          The default is false.
     *          'result': The current serialization result as it's being built
     *          up.
     *          'store': The key under which the current serialization result
     *          will be stored.
     *          'stores': A hash of 1...n serialization results that were
     *          generated during the serialization process. Note that nested
     *          nodes might generated results that will go into different
     *          stores, and so they will all be stored here, each keyed by a
     *          unique key (which, by convention, will be the URI they should be
     *          saved to).
     * @returns {String} A serialization of the closing tag of the receiver.
     */

    var str;

    //  If we're serializing, then we just do what our supertype does and
    //  descend into our child nodes.
    if (this.get('$areSerializing')) {
        str = this.callNextMethod();
        return TP.ac(str, TP.DESCEND);
    }

    return TP.CONTINUE;
});

//  ------------------------------------------------------------------------

TP.core.TemplatedTag.Inst.defineMethod('serializeOpenTag',
function(storageInfo) {

    /**
     * @method serializeOpenTag
     * @summary Serializes the opening tag for the receiver.
     * @description At this type level, this method performs a variety of
     *     transformations and filtering of various attributes. See the code
     *     below for more details. One notable transformation is that this
     *     method, in conjunction with the 'serializeCloseTag' method,  will
     *     always produce the 'XML version' of an empty tag (i.e. '<foo/>'
     *     rather than '<foo></foo>').
     * @param {TP.core.Hash} storageInfo A hash containing various flags for and
     *     results of the serialization process. Notable keys include:
     *          'wantsXMLDeclaration': Whether or not the document node should
     *          include an 'XML declaration' at the start of it's serialization.
     *          The default is false.
     *          'result': The current serialization result as it's being built
     *          up.
     *          'store': The key under which the current serialization result
     *          will be stored.
     *          'stores': A hash of 1...n serialization results that were
     *          generated during the serialization process. Note that nested
     *          nodes might generated results that will go into different
     *          stores, and so they will all be stored here, each keyed by a
     *          unique key (which, by convention, will be the URI they should be
     *          saved to).
     * @returns {String} A serialization of the opening tag of the receiver.
     */

    var str,

        currentStore,
        currentResult,

        resourceURI,

        loc;

    //  If we're serializing, then we just do what our supertype does and
    //  descend into our child nodes.
    if (this.get('$areSerializing')) {
        str = this.callNextMethod();
        return TP.ac(str, TP.DESCEND);
    }

    //  Turn the serializing flag on.
    this.set('$areSerializing', true, false);

    //  Grab our template's resource URI - we'll use this as our 'store' key.
    resourceURI = this.getType().getResourceURI(
                        'template',
                        TP.elementGetAttribute(
                            this.getNativeNode(), 'tibet:mime', true));

    loc = resourceURI.getLocation();

    currentStore = storageInfo.at('store');

    //  If we're not actually serializing our own template, then store off the
    //  current result - we'll need it below.
    if (currentStore !== loc) {
        currentResult = storageInfo.at('result');
    }

    //  Set our template resource URI as the current 'store' key and create a
    //  new result Array.
    storageInfo.atPut('store', loc);
    storageInfo.atPut('result', TP.ac());

    //  Serialize ourself - this will loop back around to this method, hence the
    //  '$areSerializing' flag. This will also place any generated results
    //  'under' us into the 'stores' hash under our store key.
    this.serializeForStorage(storageInfo);

    //  If we're not actually serializing our own template, then restore the
    //  current 'store' (i.e. location) and result.
    if (currentStore !== loc) {
        //  Restore the previous 'store' key and result.
        storageInfo.atPut('store', currentStore);
        storageInfo.atPut('result', currentResult);
    }

    //  Turn the serializing flag off.
    this.set('$areSerializing', false, false);

    //  If we're not actually serializing our own template, then return an empty
    //  version of ourself as the placeholder in the 'higher level' markup that
    //  we're being serialized as a part of.
    if (currentStore !== loc) {
        //  Return an Array containing our full name (as opposed to our actual
        //  rendered tag name) as an empty tag and continue on to our next
        //  sibling, thereby treating our child content as opaque.
        return TP.ac('<' + this.getFullName() + '/>', TP.CONTINUE);
    }

    //  We were serializing our own template and we included the results of that
    //  above - just hand back the empty String and continue on to the next
    //  sibling.
    return TP.ac('', TP.CONTINUE);
});

//  ========================================================================
//  TP.tibet.app
//  ========================================================================

/**
 * @type {TP.tibet.app}
 * @summary TP.tibet.app represents the 'non-Sherpa' application tag. It is
 *     usually generated by the TP.tibet.root tag type if Sherpa is not loaded
 *     or disabled.
 */

//  ------------------------------------------------------------------------

TP.core.CompiledTag.defineSubtype('tibet:app');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

//  This tag has no associated CSS. Note how this property is TYPE_LOCAL, by
//  design.
TP.tibet.app.defineAttribute('styleURI', TP.NO_RESULT);

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.tibet.app.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @method tagAttachDOM
     * @summary Sets up runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    //  TODO: The UICANVAS should be set to be the UIROOT here.

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.tibet.app.Type.defineMethod('tagCompile',
function(aRequest) {

    /**
     * @method tagCompile
     * @summary Convert the receiver into a format suitable for inclusion in a
     *     markup DOM.
     * @description In this type, this method generates either a 'tibet:app' or
     *     a 'tibet:sherpa' tag, depending on whether or not the current boot
     *     environment is set to 'development' or not.
     * @param {TP.sig.ShellRequest} aRequest The request containing command
     *     input for the shell.
     * @returns {Element} The new element.
     */

    var elem,
        name,
        tag,
        newElem;

    //  Make sure that we have an element to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        return;
    }

    if (TP.notEmpty(elem.getAttribute('tibet:appctrl'))) {
        return this.callNextMethod();
    }

    name = TP.sys.cfg('project.name');
    tag = TP.sys.cfg('tibet.apptag') || 'APP.' + name + ':app';

    newElem = TP.xhtmlnode(
    '<div tibet:tag="tibet:app" class="tag-defaulted">' +
        '<h1 class="tag-defaulted">' +
            'Application tag for ' + name + ' failed to render. ' +
            'Defaulted to &lt;tibet:app/&gt;' +
        '</h1>' +

        '<p>' +
        'If you are seeing this error message it usually means either:<br/><br/>' +
        '- The tag specified for your application (' + tag + ') is missing; or<br/>' +
        '- <b>The specified tag type has a syntax error or failed to load.</b>' +
        '</p>' +

        '<p>Source for that tag would typically be found in:</p>' +

        '<p><code>src/tags/' + tag.replace(/:/g, '.') + '.js</code></p>' +

        '<p>' +
        'Check that file for syntax errors if it is the right file, or check' +
        ' your tibet.apptag settings to ensure the right tag type is being' +
        ' specified along with your ~app_cfg/main.xml package to ensure you' +
        ' are loading it.' +
        '</p>' +

        '<p class="hint">' +
        'Hint: You can use Alt-Up to toggle the boot log/console.' +
        '</p>' +
    '</div>');

    //  Note here how we return the *result* of this method due to node
    //  importing, etc.
    return TP.elementReplaceWith(elem, newElem);
});

//  ========================================================================
//  TP.tibet.root
//  ========================================================================

/**
 * @type {TP.tibet.root}
 * @summary TP.tibet.root represents the tag placed in 'UIROOT' pages (i.e. the
 *     root page of the system). Depending on whether the Sherpa project is
 *     loaded/disabled, this tag will generate either a 'tibet:app' tag or a
 *     'tibet:sherpa' tag to handle the main UI.
 */

//  ------------------------------------------------------------------------

TP.core.CompiledTag.defineSubtype('tibet:root');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

//  This tag has no associated CSS. Note how these properties are TYPE_LOCAL, by
//  design.
TP.tibet.root.defineAttribute('styleURI', TP.NO_RESULT);
TP.tibet.root.defineAttribute('themeURI', TP.NO_RESULT);

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.tibet.root.Type.defineMethod('computeAppTagTypeName',
function(wantsSherpa) {

    /**
     * @method computeAppTagName
     * @summary Computes the current tag type name by using system config
     *     information to try to find a type and, if that can't found, falling
     *     back to the 'tibet:sherpa' or 'tibet:app' tag.
     * @param {Boolean} wantsSherpa Whether or not to include the 'tibet:sherpa'
     *     tag in the result output. The default is true.
     * @returns {String} The name of the type to use as the 'app tag'.
     */

    var cfg,
        opts,

        sherpaOk,

        type,
        name;

    //  Build up a list of tag names to check. We'll use the first one we have a
    //  matching type for.
    opts = TP.ac();

    cfg = TP.sys.cfg('tibet.apptag');
    if (TP.notEmpty(cfg)) {
        opts.push(cfg);
    }

    cfg = TP.sys.cfg('project.name');
    if (TP.notEmpty(cfg)) {
        opts.push(cfg + ':app');
    }

    //  If the system is configured to run the sherpa, then make sure it's not
    //  running on IE (we do not support the Sherpa for IE at this time). If
    //  not, push its tag into the list for consideration.
    if (TP.sys.hasFeature('ie')) {
        sherpaOk = false;

        TP.ifWarn() ?
            TP.warn('Sherpa not currently supported on IE. Setting default' +
                ' app tag to tibet:app.') : 0;
    } else {
        sherpaOk = TP.ifInvalid(wantsSherpa, true);
    }

    if (TP.sys.hasFeature('sherpa') && sherpaOk) {
        opts.unshift('tibet:sherpa');
    }

    //  When in doubt at least produce something :)
    opts.push('tibet:app');

    //  Keep string for error reporting.
    cfg = opts.join();

    while (TP.notValid(type) && TP.notEmpty(name = opts.shift())) {
        type = TP.sys.getTypeByName(name, false);
    }

    if (!TP.isType(type)) {
        this.raise('TypeNotFound', 'Expected one of: ' + cfg);
        return null;
    }

    return name;
});

//  ------------------------------------------------------------------------

TP.tibet.root.Type.defineMethod('tagAttachComplete',
function(aRequest) {

    /**
     * @method tagAttachComplete
     * @summary Sets up runtime machinery for the element in aRequest.
     * @description In this type, if the Sherpa is not 'active' this method
     *     loads the URL pointed to by the TP.sys.getHomeURL method into the
     *     UIROOT frame. If a value hasn't been configured, then the standard
     *     system blank page is loaded into that frame.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        elemWin,
        request,
        homeURL;

    //  If the Sherpa is configured to be on (and we've actually loaded the
    //  Sherpa code), then exit here - the Sherpa does some special things to
    //  the 'tibet:root' tag.
    if (TP.sys.hasFeature('sherpa')) {
        return;
    }

    //  Make sure that we have an element to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        return;
    }

    //  Make sure that we have a Window to draw into.
    if (!TP.isWindow(elemWin = TP.nodeGetWindow(elem))) {
        return;
    }

    //  Capture the actual home page URL for loading which means passing true
    //  here to force session variables to be checked.
    homeURL = TP.uc(TP.sys.getHomeURL(true));

    request = TP.request();
    request.atPut(TP.ONLOAD,
                function(aDocument) {
                    //  Signal we are starting. This provides a hook for
                    //  extensions etc. to tap into the startup sequence before
                    //  routing or other behaviors but after we're sure the UI
                    //  is finalized.
                    TP.signal('TP.sys', 'AppWillStart');

                    //  Signal actual start. The default handler on Application
                    //  will invoke the start() method in response to this
                    //  signal.
                    TP.signal('TP.sys', 'AppStart');
                });

    TP.wrap(elemWin).setContent(homeURL, request);

    return;
});

//  ------------------------------------------------------------------------

TP.tibet.root.Type.defineMethod('tagCompile',
function(aRequest) {

    /**
     * @method tagCompile
     * @summary Convert the receiver into a format suitable for inclusion in a
     *     markup DOM.
     * @description In this type, if the Sherpa is 'active' (not just loaded but
     *     active) this method converts the receiver (a 'tibet:root' tag) into a
     *     'tibet:sherpa' tag.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     * @returns {Element} The new element.
     */


    var elem,
        newElem;

    //  Make sure that we have an element to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        return;
    }

    //  If the Sherpa is configured to be on (and we've actually loaded the
    //  Sherpa code), then turn the receiver into a 'tibet:sherpa' tag.
    if (TP.sys.hasFeature('sherpa')) {

        newElem = TP.elementBecome(elem, 'tibet:sherpa');

        //  We're changing out the tag entirely, so remove any evidence via the
        //  tibet:tag reference.
        TP.elementRemoveAttribute(newElem, 'tibet:tag', true);

        return newElem;
    }

    return elem;
});

//  ========================================================================
//  TP.core.InfoTag
//  ========================================================================

/**
 * @type {TP.core.InfoTag}
 * @summary TP.core.InfoTag is the supertype for all 'info' elements in
 *     the TIBET framework. Examples of info elements are acl:info, bind:info,
 *     drag:info, ev:info, and similar items which provide processing
 *     information but don't typically perform direct action in the way that a
 *     TP.core.ActionTag might.
 */
//  ------------------------------------------------------------------------

TP.core.CustomTag.defineSubtype('InfoTag');

//  Can't construct concrete instances of this type.
TP.core.InfoTag.isAbstract(true);

//  This tag has no associated CSS. Note how these properties are *not*
//  TYPE_LOCAL, by design.
TP.core.InfoTag.Type.defineAttribute('styleURI', TP.NO_RESULT);
TP.core.InfoTag.Type.defineAttribute('themeURI', TP.NO_RESULT);

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.core.InfoTag.Type.defineMethod('cmdAddContent',
function(aRequest) {

    /**
     * @inheritDoc
     */

    this.raise('TP.sig.InvalidSink');

    return;
});

//  ------------------------------------------------------------------------

TP.core.InfoTag.Type.defineMethod('cmdFilterInput',
function(aRequest) {

    /**
     * @inheritDoc
     */

    this.raise('TP.sig.InvalidFilter');

    return;
});

//  ------------------------------------------------------------------------

TP.core.InfoTag.Type.defineMethod('cmdGetContent',
function(aRequest) {

    /**
     * @inheritDoc
     */

    this.raise('TP.sig.InvalidSource');

    return;
});

//  ------------------------------------------------------------------------

TP.core.InfoTag.Type.defineMethod('cmdRunContent',
function(aRequest) {

    /**
     * @method cmdRunContent
     * @summary Runs the receiver, effectively invoking its action.
     * @description This method is invoked any time a tag is being run as part
     *     of the processing of an enclosing tsh:script, which happens most
     *     often when the tag is being run interactively. When being run
     *     interactively the tag will execute when no ev:event is defined which
     *     implies processing should wait for that event.
     * @param {TP.sig.ShellRequest} aRequest The request containing command
     *     input for the shell.
     * @returns {Object} A value which controls how the outer TSH processing
     *     loop should continue. TP.CONTINUE and TP.BREAK are common values.
     */

    var interactive,
        node,
        str;

    interactive = TP.ifKeyInvalid(aRequest, 'cmdBuildGUI', false);
    if (interactive) {
        node = aRequest.at('cmdNode');
        if (TP.notEmpty(TP.elementGetAttribute(node, 'ev:event', true))) {
            str = TP.wrap(node).asString();

            //  Output with asIs false will echo the tag for display.
            aRequest.stdout(str,
                            TP.hc('cmdBox', false, 'cmdAsIs', false,
                                'cmdAppend', true, 'cmdEcho', true));

            //  Have to output the action to get it into the DOM for
            //  awakening etc, otherwise it can't register/run.
            aRequest.stdout(str,
                            TP.hc('cmdBox', false, 'cmdAsIs', true,
                                'cmdEcho', true));

            aRequest.set('result', str);
            aRequest.complete();

            return TP.CONTINUE;
        }
    }

    return this.tshExecute(aRequest);
});

//  ------------------------------------------------------------------------

TP.core.InfoTag.Type.defineMethod('cmdSetContent',
function(aRequest) {

    /**
     * @inheritDoc
     */

    this.raise('TP.sig.InvalidSink');

    return;
});

//  ------------------------------------------------------------------------

TP.core.InfoTag.Type.defineMethod('cmdTransformInput',
function(aRequest) {

    /**
     * @inheritDoc
     */

    this.raise('TP.sig.InvalidTransform');

    return;
});

//  ------------------------------------------------------------------------

TP.core.InfoTag.Type.defineMethod('tagCompile',
function(aRequest) {

    /**
     * @method tagCompile
     * @summary Convert the receiver into a format suitable for inclusion in a
     *     markup DOM.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     * @returns {Element} The new element.
     */

    var elem;

    //  Default for info tags is to not be transformed, but to have a
    //  'tibet-info' CSS class added to their markup.

    elem = aRequest.at('node');
    TP.elementAddClass(elem, 'tibet-info');

    return elem;
});

//  ========================================================================
//  TP.core.ActionTag
//  ========================================================================

/**
 * @type {TP.core.ActionTag}
 * @summary TP.core.ActionTag is the supertype for all action elements
 *     in the TIBET framework. Action nodes are found most typically in
 *     association with XControls and the various TIBET shells where they serve
 *     as "xml macros" for various JavaScript operations or commands.
 * @description An action element is essentially a "macro" encoded in tag form.
 *     The XForms specification defines a number of these tags and TIBET extends
 *     this concept as part of the TIBET Shell (TSH).
 *
 *     Because of their use in visual markup as well as TIBET scripts action
 *     tags provide both a signaling interface and a direct invocation
 *     interface. The signaling interface simply defers to the direct invocation
 *     approach, so you'll normally just implement an act() method on your
 *     action element with a request object as the first parameter. Note that
 *     like much of TIBET's other APIs a request in this context can be a
 *     TP.sig.Request or a simple hash of parameter values.
 */
//  ------------------------------------------------------------------------

TP.core.CustomTag.defineSubtype('ActionTag');

//  can't construct concrete instances of this
TP.core.ActionTag.isAbstract(true);

//  This tag has no associated CSS. Note how these properties are *not*
//  TYPE_LOCAL, by design.
TP.core.ActionTag.Type.defineAttribute('styleURI', TP.NO_RESULT);
TP.core.ActionTag.Type.defineAttribute('themeURI', TP.NO_RESULT);

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

//  the default request type to use for construction of a request
TP.core.ActionTag.Type.defineAttribute('requestType', 'TP.sig.Request');

//  an optional name which refines the request by altering its name
TP.core.ActionTag.Type.defineAttribute('requestName');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('canAct',
function(aNode) {

    /**
     * @method canAct
     * @summary Returns true if the node provided is 'actionable' based on ACL
     *     permissions for the current user.
     * @param {Node} aNode A native node to test for ACL restrictions.
     * @returns {Boolean} True if the action can proceed.
     */

    var actionable,
        attrs,

        rkeys,
        ekeys,

        len,
        i,
        attr;

    //  presume true
    actionable = true;

    //  one interesting thing here is that we tie action execution into ACL
    //  checks, restricting script/command access based on ACL keys
    if (TP.notEmpty(attrs = TP.elementGetAttributeNodes(aNode, 'acl:*'))) {
        rkeys = TP.sys.getRealUser().getAccessKeys();
        ekeys = TP.sys.getEffectiveUser().getAccessKeys();

        len = attrs.getSize();

        for (i = 0; i < len; i++) {
            attr = attrs[i];
            switch (attr.name) {
                case 'acl:if_real':

                    //  only if rkeys contains this key
                    actionable = false;
                    if (rkeys.containsAny(attr.value.split(' '))) {
                        actionable = true;
                    }

                    break;

                case 'acl:if_effective':

                    //  only if ekeys contains this key
                    actionable = false;
                    if (ekeys.containsAny(attr.value.split(' '))) {
                        actionable = true;
                    }

                    break;

                case 'acl:unless_real':

                    //  unless rkeys contains these keys
                    if (rkeys.containsAny(attr.value.split(' '))) {
                        actionable = false;
                    }

                    break;

                case 'acl:unless_effective':

                    //  unless ekeys contains these keys
                    if (ekeys.containsAny(attr.value.split(' '))) {
                        actionable = false;
                    }

                    break;

                default:

                    actionable = false;
                    break;
            }
        }
    }

    return actionable;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('cmdAddContent',
function(aRequest) {

    /**
     * @inheritDoc
     */

    this.raise('TP.sig.InvalidSink');

    return;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('cmdFilterInput',
function(aRequest) {

    /**
     * @inheritDoc
     */

    this.raise('TP.sig.InvalidFilter');

    return;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('cmdGetContent',
function(aRequest) {

    /**
     * @inheritDoc
     */

    this.raise('TP.sig.InvalidSource');

    return;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('cmdRunContent',
function(aRequest) {

    /**
     * @method cmdRunContent
     * @summary Runs the receiver, effectively invoking its action.
     * @description This method is invoked any time a tag is being run as part
     *     of the processing of an enclosing tsh:script, which happens most
     *     often when the tag is being run interactively. When being run
     *     interactively the tag will execute when no ev:event is defined which
     *     implies processing should wait for that event.
     * @param {TP.sig.ShellRequest} aRequest The request containing command
     *     input for the shell.
     * @returns {Object} A value which controls how the outer TSH processing
     *     loop should continue. TP.CONTINUE and TP.BREAK are common values.
     */

    var interactive,
        node,
        str;

    interactive = TP.ifKeyInvalid(aRequest, 'cmdBuildGUI', false);
    if (interactive) {
        node = aRequest.at('cmdNode');
        if (TP.notEmpty(TP.elementGetAttribute(node, 'ev:event', true))) {
            str = TP.wrap(node).asString();

            //  Output with asIs false will echo the tag for display.
            aRequest.stdout(str,
                        TP.hc('cmdBox', false, 'cmdAsIs', false,
                        'cmdAppend', true, 'cmdEcho', true));

            //  Have to output the action to get it into the DOM for
            //  awakening etc, otherwise it can't register/run.
            aRequest.stdout(str,
                        TP.hc('cmdBox', false, 'cmdAsIs', true,
                            'cmdEcho', true));

            aRequest.set('result', str);
            aRequest.complete();

            return TP.CONTINUE;
        }
    }

    return this.tshExecute(aRequest);
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('cmdSetContent',
function(aRequest) {

    /**
     * @inheritDoc
     */

    this.raise('TP.sig.InvalidSink');

    return;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('cmdTransformInput',
function(aRequest) {

    /**
     * @inheritDoc
     */

    this.raise('TP.sig.InvalidTransform');

    return;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('getActionInput',
function(aRequest) {

    /**
     * @method getActionInput
     * @summary Returns either the request's standard input or the receiver's
     *     'primary argument'.
     * @param {TP.sig.Request} aRequest The request to check for stdin.
     * @returns {Object} The input data.
     */

    var input;

    if (!TP.isNode(aRequest.at('cmdNode'))) {
        return;
    }

    if (TP.notEmpty(input = aRequest.stdin())) {
        //  stdin is always an array, so we can just return it
        return input;
    } else {
        input = this.getPrimaryArgument(aRequest);
    }

    if (TP.isValid(input)) {
        input = TP.ac(input);
    }

    return input;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('getActionParam',
function(aRequest, parameterName) {

    /**
     * @method getActionParam
     * @summary Checks the receiver for child <param> tags and returns the
     *     value associated with the named parameter if found.
     * @param {TP.sig.Request} aRequest The request being processed.
     * @param {String} parameterName The name of the parameter to find.
     * @returns {String} The parameter value, if any.
     */

    var shell;

    shell = aRequest.at('cmdShell');
    if (TP.notValid(shell)) {
        this.raise('TP.sig.InvalidRequest',
                    'No cmdShell in request.');

        return;
    }

    return shell.getParam(aRequest, parameterName);
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('getPrimaryArgument',
function(aRequest) {

    /**
     * @method getPrimaryArgument
     * @summary Returns the value of the receiver's primary argument, which
     *     must be named by the return value of getPrimaryArgumentName(). By
     *     default action tags return null here due to there being no default
     *     for getPrimaryArgumentName. Overriding that method to provide a valid
     *     name is usually sufficient.
     * @param {TP.sig.Request} aRequest The request being processed.
     * @returns {Object} The argument data.
     */

    var name,
        shell;

    if (TP.isEmpty(name = this.getPrimaryArgumentName())) {
        return;
    }

    shell = aRequest.at('cmdShell');
    if (TP.isValid(shell)) {
        //  NB: We supply 'null' here as the default value
        return shell.getArgument(aRequest, name, null, true);
    }

    return;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('getPrimaryArgumentName',
function() {

    /**
     * @method getPrimaryArgumentName
     * @summary Returns the primary argument name, which by default is null.
     *     For action tags this method typically must be overridden or the
     *     getPrimaryArgument() and getActionInput() calls will typically fail
     *     to return useful results.
     * @returns {String} The argument name.
     */

    return;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('tagCompile',
function(aRequest) {

    /**
     * @method tagCompile
     * @summary Convert the receiver into a format suitable for inclusion in a
     *     markup DOM.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     * @returns {Element} The new element.
     */

    var elem;

    //  Default for action tags is to not be transformed, but to have a
    //  'tibet-action' CSS class added to their markup.

    elem = aRequest.at('node');
    TP.elementAddClass(elem, 'tibet-action');

    return elem;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Type.defineMethod('tshExecute',
function(aRequest) {

    /**
     * @method tshExecute
     * @summary Runs the receiver, effectively invoking its action.
     * @param {TP.sig.ShellRequest} aRequest The request containing command
     *     input for the shell.
     * @returns {Object} A value which controls how the outer TSH processing
     *     loop should continue. TP.CONTINUE and TP.BREAK are common values.
     */

    //  Typically this is overridden.
    return TP.DESCEND;
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.ActionTag.Inst.defineMethod('act',
function(aSignal) {

    /**
     * @method act
     * @summary Performs the action the receiver is responsible for. This
     *     method should be overridden in subtypes to provide concrete behavior.
     * @description The act method is typically invoked indirectly by the handle
     *     functionality found in this type, however you can invoke it directly
     *     when you've got a handle to a specific action element. When invoked
     *     via handle the signal which is currently being processed is provided
     *     as the first argument.
     * @param {TP.sig.Signal} aSignal The signal instance which triggered this
     *     activity. Only valid when being invoked in response to a handle call.
     * @returns {TP.core.ActionTag} The receiver.
     */

    var request,
        shell;

    //  check with the type to see if we can run
    if (TP.notTrue(this.getType().canAct(this.getNativeNode()))) {
        return this;
    }

    request = this.constructActRequest(aSignal);

    shell = TP.core.TSH.getDefaultInstance();
    shell[TP.composeHandlerName('ShellRequest')](request);

    return;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Inst.defineMethod('constructActRequest',
function(aSignal) {

    /**
     * @method constructActRequest
     * @summary Returns a TP.sig.Request subtype instance suitable for the
     *     receiver's requirements. This is typically a TP.sig.ShellRequest so
     *     the TIBET Shell can be used to process/execute the tag.
     * @param {TP.sig.Signal|TP.core.Hash} aSignal A signal or hash containing
     *     parameter data.
     * @returns {TP.sig.Request} A proper TP.sig.Request for the action.
     */

    return TP.sig.ShellRequest.construct(
                    TP.hc('cmdLiteral', true,
                            'cmdNode', this.getNativeNode(),
                            'cmdExecute', true,
                            'cmdPhases', 'Execute',
                            'cmdSilent', true,
                            'cmdTrigger', aSignal,
                            TP.STDIN, TP.ac(aSignal.get('payload'))
                    ));
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Inst.defineMethod('getActionParam',
function(aRequest, parameterName) {

    /**
     * @method getActionParam
     * @summary Checks the receiver for child <param> tags and returns the
     *     value associated with the named parameter if found.
     * @param {TP.sig.Request} aRequest The request being processed.
     * @param {String} parameterName The name of the parameter to find.
     * @returns {String} The parameter value, if any.
     */

    return this.getType().getActionParam(aRequest, parameterName);
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Inst.defineMethod('getRequestName',
function() {

    /**
     * @method getRequestName
     * @summary Returns the request name used for this service when no override
     *     has been given on the element.
     * @returns {String} A specific request name.
     */

    return this.getType().get('requestName');
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Inst.defineMethod('getRequestType',
function() {

    /**
     * @method getRequestType
     * @summary Returns the request type used for this service when no override
     *     has been given on the element.
     * @returns {TP.sig.Request} A specific request type.
     */

    var name,
        type;

    name = this.getType().get('requestType') || 'TP.sig.Request';

    type = TP.sys.getTypeByName(name);
    if (TP.notValid(type)) {
        this.raise('TP.sig.InvalidType',
                    'Request type not found for: ' + this.asString());

        type = TP.sig.Request;
    }

    return type;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Inst.defineMethod('getDownstreamSegment',
function() {

    /**
     * @method getUpstreamSegment
     * @summary Returns the 'downstream' segment for this action - that is, any
     *     following action element in a command sequence.
     * @returns {TP.core.ActionTag|null} The downstream segment of this
     *     action or null if it's the last segment.
     */

    var retVal;

    retVal = this.detectSibling(
                function(aNode) {
                    if (TP.isElement(aNode) &&
                        TP.elementGetLocalName(aNode) === 'cmd') {
                        return true;
                    }

                    return false;
                },
                TP.NEXT);

    return retVal;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Inst.defineMethod('getUpstreamSegment',
function() {

    /**
     * @method getUpstreamSegment
     * @summary Returns the 'upstream' segment for this action - that is, any
     *     preceding action element in a command sequence.
     * @returns {TP.core.ActionTag|null} The upstream segment of this
     *     action or null if it's the first segment.
     */

    var retVal;

    retVal = this.detectSibling(
                function(aNode) {
                    if (TP.isElement(aNode) &&
                        TP.elementGetLocalName(aNode) === 'cmd') {
                        return true;
                    }

                    return false;
                },
                TP.PREVIOUS);

    return retVal;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Inst.defineMethod('getRedirectionType',
function() {

    /**
     * @method getRedirectionType
     * @summary Returns what kind of redirection type, if any, the receiver
     *     has.
     * @returns {Constant} One of the following: TP.ADD, TP.GET, TP.SET,
     *     TP.FILTER, TP.TRANSFORM (or TP.NONE if there is no redirection)
     */

    var pipe;

    pipe = this.getAttribute('tsh:pipe', true);

    if (TP.TSH_ADD_PIPES.contains(pipe)) {
        return TP.ADD;
    } else if (TP.TSH_GET_PIPES.contains(pipe)) {
        return TP.GET;
    } else if (TP.TSH_SET_PIPES.contains(pipe)) {
        return TP.SET;
    } else if (TP.TSH_FILTER_PIPES.contains(pipe)) {
        return TP.FILTER;
    } else if (TP.TSH_TRANSFORM_PIPES.contains(pipe)) {
        return TP.TRANSFORM;
    }

    return TP.NONE;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Inst.defineMethod('isLastSegment',
function() {

    /**
     * @method isLastSegment
     * @summary Returns whether or not this node is the last 'segment' of
     *     commands in a script.
     * @returns {Boolean} Whether or not this is the 'last segment' of a script.
     */

    return TP.notValid(this.getDownstreamSegment());
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Inst.defineHandler('Signal',
function(aSignal) {

    /**
     * @method handleSignal
     * @summary Responds to an inbound signal by running the receiver's
     *     action(s) via the act() method.
     * @param {TP.sig.Signal} aSignal The signal instance which triggered this
     *     call.
     */

    var sig;

    if (this.shouldSignalChange()) {
        sig = this.signal('TP.sig.WillRun');
        if (sig.shouldPrevent()) {
            return;
        }
    }

    try {
        this.act(aSignal);
    } finally {
        if (this.shouldSignalChange()) {
            this.signal('TP.sig.DidRun');
        }
    }

    return;
});

//  ------------------------------------------------------------------------

TP.core.ActionTag.Inst.defineMethod('isOutermostAction',
function() {

    /**
     * @method isOutermostAction
     * @summary Returns true if the receiver is the outermost action handler
     *     (not '<action> element).
     * @description The XForms specification states the when an action handler
     *     is the outermost handler model updates occur immediately, but when
     *     enclosed in an action element they can have a deferred update effect.
     *     The result is that all elements which can potentially defer their
     *     updates need to know if they're "outermost" so they know whether to
     *     message the model or simply flag it for later rebuild processing. We
     *     also allow action tags as children of ev:listeners and in that case
     *     we also consider them "nested" rather than top-most actions.
     * @returns {Boolean} True if the receiver is the top-most action.
     */

    var node,
        tag;

    node = this.getNativeNode();

    //  go up the parent chain and if we don't find an xctrls:action above
    //  us then we're outermost and should not defer model updating
    while (TP.isElement(node = node.parentNode) &&
            TP.isCallable(node.getAttribute)) {
        tag = TP.elementGetAttribute(node, 'tibet:tag', true);
        if (tag === 'xctrls:action' || tag === 'ev:listener') {
            return false;
        }
    }

    return true;
});

//  ========================================================================
//  TP.core.PipeSegmentElementNode
//  ========================================================================

/**
 * @type {TP.core.PipeSegmentElementNode}
 */

//  ------------------------------------------------------------------------

TP.core.ActionTag.defineSubtype('PipeSegmentElementNode');

//  This type is intended to be used as a trait type only, so we don't allow
//  instance creation
TP.core.PipeSegmentElementNode.isAbstract(true);

//  ------------------------------------------------------------------------

TP.core.PipeSegmentElementNode.Type.defineMethod('cmdFilterInput',
function(aRequest) {

    /**
     * @method cmdFilterInput
     * @summary Run when the receiver is being used in a filtering pipe.
     * @param {TP.sig.Request} aRequest The request to process.
     */

    this.processInput(aRequest, 'filterInput');

    return;
});

//  ------------------------------------------------------------------------

TP.core.PipeSegmentElementNode.Type.defineMethod('cmdTransformInput',
function(aRequest) {

    /**
     * @method cmdTransformInput
     * @summary Run when the receiver is being used in a transforming pipe.
     * @param {TP.sig.Request} aRequest The request to process.
     */

    this.processInput(aRequest, 'transformInput');

    return;
});

//  ------------------------------------------------------------------------

TP.core.PipeSegmentElementNode.Type.defineMethod('filterInput',
function(anInput, cmdNode, aRequest) {

    /**
     * @method filterInput
     * @summary Filters an input object using information from the request
     *     provided. This method must be overridden by subtypes to avoid having
     *     an TP.sig.InvalidFilter exception raised.
     * @param {Object} anInput The object to test/filter.
     * @param {Node} cmdNode The original filtration node.
     * @param {TP.sig.Request} aRequest The request containing command input for
     *     the shell.
     * @exception TP.sig.InvalidFilter
     * @returns {Boolean} True if the object should remain in the output stream,
     *     false otherwise.
     */

    this.raise('TP.sig.InvalidFilter');

    return false;
});

//  ------------------------------------------------------------------------

TP.core.PipeSegmentElementNode.Type.defineMethod('getDefaultAction',
function(aRequest) {

    /**
     * @method getDefaultAction
     * @summary Returns the proper action name to use based on the pipe symbol
     *     being processed.
     * @param {TP.sig.Request} aRequest The request to process.
     * @returns {String} 'filterInput' or 'transformInput'.
     */

    var node,
        pipe;

    if (!TP.isElement(node = aRequest.at('cmdNode'))) {
        return;
    }

    pipe = TP.elementGetAttribute(node, 'tsh:pipe', true);
    if (/\?/.test(pipe)) {
        return 'filterInput';
    }

    return 'transformInput';
});

//  ------------------------------------------------------------------------

TP.core.PipeSegmentElementNode.Type.defineMethod('processInput',
function(aRequest, functionName) {

    /**
     * @method processInput
     * @summary Performs common processing of the input in terms of setting up
     *     a loop for iterating on splatted input, providing the proper
     *     collect/select branching for filtering vs. transforming, etc. This
     *     method is typically invoked for you and will call either filter() or
     *     transform() to do the real work of the receiving tag.
     * @param {TP.sig.Request} aRequest The request containing command input for
     *     the shell.
     * @param {String} functionName 'filterInput' or 'transformInput'.
     */

    var node,
        input,

        len,
        i,
        content,
        msg,
        result;

    //  Make sure that we have a node to work from.
    if (!TP.isNode(node = aRequest.at('cmdNode'))) {
        msg = 'No action node.';
        aRequest.fail(msg);

        return;
    }

    //  Check input, and whether it's required.
    if (TP.notValid(input = this.getActionInput(aRequest))) {
        if (this.shouldFailOnEmptyInput()) {
            msg = 'No action input.';
            aRequest.fail(msg);

            return;
        } else {
            //  Mimic stdin, which provides an Array
            input = TP.ac();
        }
    }

    len = input.getSize();
    for (i = 0; i < len; i++) {
        content = input.at(i);
        if (TP.notValid(content)) {
            continue;
        }

        //  if we're splatted then the return/output variable is expected to
        //  be a collection rather than a single item
        if (aRequest.at('cmdIterate')) {
            if (TP.isCollection(content)) {
                switch (functionName) {
                    case 'filterInput':

                        //  even though the filter call can process things
                        //  in a loop we interpret the splat as a directive
                        //  to return an array of results rather than a
                        //  single string so we loop here
                        /* eslint-disable no-loop-func */
                        result = content.select(
                            function(item) {

                                return this.filterInput(item,
                                                        node,
                                                        aRequest);
                            }.bind(this));
                        /* eslint-enable no-loop-func */

                        break;

                    case 'transformInput':

                        //  even though the transform call can process
                        //  things in a loop we interpret the splat as a
                        //  directive to return an array of results rather
                        //  than a single string so we loop here
                        /* eslint-disable no-loop-func */
                        result = content.collect(
                            function(item) {

                                return this.transformInput(item,
                                                            node,
                                                            aRequest);
                            }.bind(this));
                        /* eslint-enable no-loop-func */

                        break;

                    default:

                        msg = 'Invalid operation: ' + functionName;
                        aRequest.fail(msg);

                        return;
                }
            } else {
                TP.ifWarn() ?
                    TP.warn('Splatting with non-collection content.') : 0;

                result = TP.ac(this[functionName](content, node, aRequest));
            }
        } else {
            //  no splat, no repeat
            result = this[functionName](content, node, aRequest);
        }
    }

    if (aRequest.didFail()) {
        //  If the request failed, it will have already printed the failure code
        //  and message. Make sure that any result is appended to any output so
        //  that it doesn't replace the failure code and/or message (and prepend
        //  any result with the label 'Result: ').
        aRequest.atPut('cmdAppend', true);
        aRequest.stdout(TP.sc('Result: ') + result);
    } else {
        aRequest.complete(result);
    }

    return;
});

//  ------------------------------------------------------------------------

TP.core.PipeSegmentElementNode.Type.defineMethod('shouldFailOnEmptyInput',
function() {

    /**
     * @method shouldFailOnEmptyInput
     * @summary Returns true when the receiver's type will typically fail() any
     *     request which can't provide viable input data. The default is true.
     * @returns {Boolean} Whether processing should stop if input data is null
     *     or undefined.
     */

    return true;
});

//  ------------------------------------------------------------------------

TP.core.PipeSegmentElementNode.Type.defineMethod('transformInput',
function(anInput, cmdNode, aRequest) {

    /**
     * @method transformInput
     * @summary Transforms an input object using information from the request
     *     provided. This method must be overridden by subtypes to avoid having
     *     an TP.sig.InvalidTransform exception raised.
     * @param {Object} anInput The object to transform.
     * @param {Node} cmdNode The original transformation node.
     * @param {TP.sig.Request} aRequest The request containing command input for
     *     the shell.
     * @exception TP.sig.InvalidTransform
     * @returns {Object} The transformed input.
     */

    this.raise('TP.sig.InvalidTransform');

    return;
});

//  ------------------------------------------------------------------------

TP.core.PipeSegmentElementNode.Type.defineMethod('tshExecute',
function(aRequest) {

    /**
     * @method tshExecute
     * @summary Run when the receiver is executed directly, or as part of a
     *     cmdRunContent invocation from the interactive shell. This method
     *     relies on the default action implied by the current pipe symbol to
     *     dispatch to the proper cmd*Input method.
     * @param {TP.sig.Request} aRequest The request to process.
     * @returns {Object} A value which controls how the outer TSH processing
     *     loop should continue.
     */

    var action;

    action = this.getDefaultAction(aRequest);

    switch (action) {
        case 'filterInput':
            return this.cmdFilterInput(aRequest);
        case 'transformInput':
            return this.cmdTransformInput(aRequest);
        default:
            return TP.CONTINUE;
    }
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
