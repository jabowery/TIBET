//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ============================================================================

//  ========================================================================
//  OBJECT BINDING
//  ========================================================================

TP.definePrimitive('defineBinding',
function(target, targetAttributeName, resourceOrURI, sourceAttributeName,
         sourceFacetName, transformationFunc) {

    /**
     * @method defineBinding
     * @summary Adds a binding to the supplied target object.
     * @param {Object} target The target object to define the binding on.
     * @param {String} targetAttributeName The target attribute name.
     * @param {Object} resourceOrURI The resource specification.
     * @param {String} sourceAttributeName The source attribute name. If not
     *     specified, this will default to targetAttributeName.
     * @param {String} sourceFacetName The source facet name. If TP.ALL is
     *     specified, then all facets from the source will bound to. If not
     *     specified, this will default to 'value'.
     * @param {Function} transformationFunc A Function to transform the value
     *     before it is supplied to the observer of the binding. It takes one
     *     parameter, the new value from the model and returns the
     *     transformation parameter. This parameter is optional.
     * @returns {Object} The target object.
     */

    var resource,

        finalTarget,

        sourceAttr,

        facetName,
        signalName,
        aspectKey,

        methodName,

        handler,

        resourceValue,

        i,
        allFacets;

    if (TP.isEmpty(targetAttributeName)) {
        return this.raise('TP.sig.InvalidParameter',
            'No attribute name provided for bind.');
    }

    if (TP.isString(resourceOrURI)) {
        resource = TP.uc(TP.TIBET_URN_PREFIX + resourceOrURI);
    } else if (TP.isKindOf(resourceOrURI, TP.core.TIBETURL)) {
        resource = resourceOrURI.getConcreteURI();
    } else {
        resource = resourceOrURI;
    }

    //  Prefer URIs but can bind to any object in theory.
    if (TP.notValid(resource)) {
        return this.raise('TP.sig.InvalidResource',
            'No resource spec provided for bind.');
    }

    finalTarget = target;

    if (TP.isKindOf(finalTarget, TP.core.TIBETURL)) {
        finalTarget = finalTarget.getConcreteURI();
    }

    //  Get the source attribute. If there is no source attribute, then use the
    //  target attribute as the source attribute.
    if (TP.notValid(sourceAttr = sourceAttributeName)) {
        sourceAttr = targetAttributeName;
    }

    //  Get the source facet. If there is no source facet, then default it to
    //  'value'.
    if (TP.notValid(facetName = sourceFacetName)) {
        facetName = 'value';
    }

    //  Choose the correct subtype of TP.sig.FacetSignal to use, depending on
    //  facet.
    switch (facetName) {

        //  Specifying TP.ALL means that we use the supertype of all facet
        //  signals.
        case TP.ALL:
            signalName = 'TP.sig.FacetChange';
            break;

        case 'readonly':
            signalName = 'TP.sig.ReadonlyChange';
            break;

        case 'relevant':
            signalName = 'TP.sig.RelevantChange';
            break;

        case 'required':
            signalName = 'TP.sig.RequiredChange';
            break;

        case 'valid':
            signalName = 'TP.sig.ValidChange';
            break;

        case 'value':
        default:
            signalName = 'TP.sig.ValueChange';
            break;
    }

    if (sourceAttr.isAccessPath()) {

        //  Do a 'get' to establish the interest in the path - we're not really
        //  interested in the value though. We don't do this if it's a URI,
        //  though, since the URI will do that automatically.
        if (!TP.isURI(resource)) {
            resource.get(sourceAttr);
        }
    } else {
        //  If the facet is 'value' as well, but the sourceAttr *isn't*, then we
        //  go ahead and set up for a spoofed <aspect>Change signal (if the
        //  sourceAttr is 'value' we'd rather have a signal name of
        //  'TP.sig.ValueChange' than 'ValueChange').
        if (facetName === 'value' && sourceAttr !== 'value') {
            signalName = TP.makeStartUpper(sourceAttr) + 'Change';
        }
    }

    //  Make sure that target object has a local method to handle the change
    methodName = TP.composeHandlerName(signalName);

    if (TP.notValid(handler = finalTarget.getMethod(methodName))) {

        //  Define a handler function
        handler = function(aSignal) {

            var origin,

                aspect,
                facet,

                mapKey,

                entry,
                targetAttr,
                transformFunc,

                source,
                newVal,

                parsedVal;

            try {
                origin = aSignal.getOrigin();

                aspect = aSignal.at('aspect');

                facet = aSignal.at('facet');

                //  Compute a map key in the same way we did above when we made
                //  the registration and see if the map has it.
                mapKey = TP.gid(origin) +
                                TP.JOIN +
                                TP.str(aspect) +
                                TP.JOIN +
                                facet;

                //  If we found a target attribute registration under the key,
                //  then perform the set()
                if (TP.notEmpty(entry =
                                handler.$observationsMap.at(mapKey))) {

                    //  The target attribute is the first item in the entry pair
                    //  and any (optional) transformation Function is the last.
                    targetAttr = entry.first();
                    transformFunc = entry.last();

                    newVal = aSignal.getValue();

                    //  If what we got back was a String, and that String can be
                    //  parsed into another 'JavaScript primitive' data type
                    //  (Number, Boolean, RegExp, etc.), then we do that here
                    //  *before* we call the transformation function.
                    if (TP.isString(newVal) &&
                        TP.isValid(parsedVal =
                                    TP.getParsedPrimitiveValue(newVal))) {
                        newVal = parsedVal;
                    }

                    //  If there was a transformation Function registered, then
                    //  execute it.
                    if (TP.isCallable(transformFunc)) {

                        source = aSignal.getSource();
                        newVal = transformFunc(source, newVal);
                    }

                    this.setFacet(targetAttr, facet, newVal, false);
                }
            } catch (e) {
                this.raise('TP.sig.InvalidBinding', TP.ec(e));
            }
        };

        //  Allocate an aspect map that various aspects will register themselves
        //  with. This allows a set of source aspects to share a single change
        //  handler function.
        handler.$observationsMap = TP.hc();
        finalTarget.defineHandler(signalName, handler);
    }

    if (facetName !== TP.ALL) {

        //  The key into the aspect map is the global ID of the resource, the
        //  source attr name and the source facet name all joined together.
        aspectKey = TP.gid(resource) + TP.JOIN +
                    TP.str(sourceAttr) + TP.JOIN +
                    facetName;

        //  Add an entry to make a mapping between a source aspect and a target
        //  aspect.
        handler.$observationsMap.atPut(aspectKey,
                                        TP.ac(targetAttributeName,
                                                transformationFunc));
    } else {

        //  TP.ALL was specified - set up an entry for each facet.

        allFacets = TP.FACET_NAMES.concat('value');
        for (i = 0; i < allFacets.getSize(); i++) {

            aspectKey = TP.gid(resource) + TP.JOIN +
                        TP.str(sourceAttr) + TP.JOIN +
                        allFacets.at(i);

            handler.$observationsMap.atPut(aspectKey,
                                            TP.ac(targetAttributeName,
                                                    transformationFunc));
        }
    }

    //  PERF

    //  If the resource is a URI and we can obtain the resource result value of
    //  it, make sure that it is configured to signal Change notifications.

    //  NB: We assume 'async' of false here.
    if (TP.isURI(resource) &&
        TP.isValid(resourceValue =
            resource.getResource(TP.hc('resultType', TP.WRAP)).get('result'))) {
        resourceValue.shouldSignalChange(true);
    }

    //  Go ahead and make the observation.
    finalTarget.observe(resource, signalName);

    return finalTarget;
});

//  ------------------------------------------------------------------------

TP.defineMetaInstMethod('defineBinding',
function(targetAttributeName, resourceOrURI, sourceAttributeName,
         sourceFacetName, transformationFunc) {

    /**
     * @method defineBinding
     * @summary Adds a binding to the receiver.
     * @param {String} targetAttributeName The target attribute name.
     * @param {Object} resourceOrURI The resource specification.
     * @param {String} sourceAttributeName The source attribute name. If not
     *     specified, this will default to targetAttributeName.
     * @param {String} sourceFacetName The source facet name. If TP.ALL is
     *     specified, then all facets from the source will bound to. If not
     *     specified, this will default to 'value'.
     * @param {Function} transformationFunc A Function to transform the value
     *     before it is supplied to the observer of the binding. It takes one
     *     parameter, the new value from the model and returns the
     *     transformation parameter. This parameter is optional.
     * @returns {Object} The receiver.
     */

    return TP.defineBinding(
            this, targetAttributeName, resourceOrURI,
            sourceAttributeName, sourceFacetName, transformationFunc);
});

//  ------------------------------------------------------------------------

TP.lang.RootObject.Type.defineMethod('defineBinding',
function(targetAttributeName, resourceOrURI, sourceAttributeName,
         sourceFacetName, transformationFunc) {

    /**
     * @method defineBinding
     * @summary Adds a binding to the type receiver.
     * @param {String} targetAttributeName The target attribute name.
     * @param {Object} resourceOrURI The resource specification.
     * @param {String} sourceAttributeName The source attribute name. If not
     *     specified, this will default to targetAttributeName.
     * @param {String} sourceFacetName The source facet name. If TP.ALL is
     *     specified, then all facets from the source will bound to. If not
     *     specified, this will default to 'value'.
     * @param {Function} transformationFunc A Function to transform the value
     *     before it is supplied to the observer of the binding. It takes one
     *     parameter, the new value from the model and returns the
     *     transformation parameter. This parameter is optional.
     * @returns {Object} The receiver.
     */

    return TP.defineBinding(
            this, targetAttributeName, resourceOrURI,
            sourceAttributeName, sourceFacetName, transformationFunc);
});

//  ------------------------------------------------------------------------

TP.lang.RootObject.Inst.defineMethod('defineBinding',
function(targetAttributeName, resourceOrURI, sourceAttributeName,
         sourceFacetName, transformationFunc) {

    /**
     * @method defineBinding
     * @summary Adds a binding to the instance receiver.
     * @param {String} targetAttributeName The target attribute name.
     * @param {Object} resourceOrURI The resource specification.
     * @param {String} sourceAttributeName The source attribute name. If not
     *     specified, this will default to targetAttributeName.
     * @param {String} sourceFacetName The source facet name. If TP.ALL is
     *     specified, then all facets from the source will bound to. If not
     *     specified, this will default to 'value'.
     * @param {Function} transformationFunc A Function to transform the value
     *     before it is supplied to the observer of the binding. It takes one
     *     parameter, the new value from the model and returns the
     *     transformation parameter. This parameter is optional.
     * @returns {Object} The receiver.
     */

    return TP.defineBinding(
            this, targetAttributeName, resourceOrURI,
            sourceAttributeName, sourceFacetName, transformationFunc);
});

//  ------------------------------------------------------------------------

TP.definePrimitive('destroyBinding',
function(target, targetAttributeName, resourceOrURI, sourceAttributeName,
         sourceFacetName) {

    /**
     * @method destroyBinding
     * @summary Removes a binding from the supplied target object.
     * @param {Object} target The target object to remove the binding from.
     * @param {String} targetAttributeName The target attribute name.
     * @param {Object} resourceOrURI The resource specification.
     * @param {String} sourceAttributeName The source attribute name. If not
     *     specified, this will default to targetAttributeName.
     * @param {String} sourceFacetName The source facet name. If TP.ALL is
     *     specified, then all facets from the source will be unbound. If not
     *     specified, this will default to 'value'.
     * @returns {Object} The target object.
     */

    var resource,
        sourceAttr,

        facetName,
        signalName,
        aspectKey,

        methodName,

        handler,

        i,
        allFacets;

    if (TP.isEmpty(targetAttributeName)) {
        return this.raise('TP.sig.InvalidParameter',
            'No attribute name provided for bind.');
    }

    if (TP.isString(resourceOrURI)) {
        resource = TP.uc(TP.TIBET_URN_PREFIX + resourceOrURI);
    } else if (TP.isKindOf(resourceOrURI, TP.core.TIBETURL)) {
        resource = resourceOrURI.getConcreteURI();
    } else {
        resource = resourceOrURI;
    }

    //  Prefer URIs but can bind to any object in theory.
    if (TP.notValid(resource)) {
        return this.raise('TP.sig.InvalidResource',
            'No resource spec provided for bind.');
    }

    //  Get the source attribute. If there is no source attribute, then use the
    //  target attribute as the source attribute.
    if (TP.notValid(sourceAttr = sourceAttributeName)) {
        sourceAttr = targetAttributeName;
    }

    //  Get the source facet. If there is no source facet, then default it to
    //  'value'.
    if (TP.notValid(facetName = sourceFacetName)) {
        facetName = 'value';
    }

    //  Choose the correct subtype of TP.sig.FacetSignal to use, depending on
    //  facet.
    switch (facetName) {

        //  Specifying TP.ALL means that we use the supertype of all facet
        //  signals.
        case TP.ALL:
            signalName = 'TP.sig.FacetChange';
            break;

        case 'readonly':
            signalName = 'TP.sig.ReadonlyChange';
            break;

        case 'relevant':
            signalName = 'TP.sig.RelevantChange';
            break;

        case 'required':
            signalName = 'TP.sig.RequiredChange';
            break;

        case 'valid':
            signalName = 'TP.sig.ValidChange';
            break;

        case 'value':
        default:
            signalName = 'TP.sig.ValueChange';
            break;
    }

    if (!sourceAttr.isAccessPath()) {
        //  If the facet is 'value' as well, but the sourceAttr *isn't*, then we
        //  go ahead and set up for a spoofed <aspect>Change signal (if the
        //  sourceAttr is 'value' we'd rather have a signal name of
        //  'TP.sig.ValueChange' than 'ValueChange').
        if (facetName === 'value' && sourceAttr !== 'value') {
            signalName = TP.makeStartUpper(sourceAttr) + 'Change';
        }
    }

    //  Make sure that target object has a local method to handle the change
    methodName = TP.composeHandlerName(signalName);

    if (TP.isValid(handler = target.getMethod(methodName)) &&
        TP.isValid(handler.$observationsMap)) {

        if (facetName !== TP.ALL) {

            //  The key into the aspect map is the global ID of the resource,
            //  the source attr name and the source facet name all joined
            //  together.
            aspectKey = TP.gid(resource) + TP.JOIN +
                        TP.str(sourceAttr) + TP.JOIN +
                        facetName;

            //  There was a valid handler and a valid key map - remove our
            //  source aspect from it.
            handler.$observationsMap.removeKey(aspectKey);
        } else {

            //  TP.ALL was specified - remove the entry for each facet.

            allFacets = TP.FACET_NAMES.concat('value');
            for (i = 0; i < allFacets.getSize(); i++) {

                aspectKey = TP.gid(resource) + TP.JOIN +
                            TP.str(sourceAttr) + TP.JOIN +
                            allFacets.at(i);

                handler.$observationsMap.removeKey(aspectKey);
            }
        }
    }

    //  Ignore the target.
    target.ignore(resource, signalName);

    return target;
});

//  ------------------------------------------------------------------------

TP.defineMetaInstMethod('destroyBinding',
function(targetAttributeName, resourceOrURI, sourceAttributeName,
         sourceFacetName) {

    /**
     * @method destroyBinding
     * @summary Removes a binding from the receiver.
     * @param {String} targetAttributeName The target attribute name.
     * @param {Object} resourceOrURI The resource specification.
     * @param {String} sourceAttributeName The source attribute name. If not
     *     specified, this will default to targetAttributeName.
     * @param {String} sourceFacetName The source facet name. If TP.ALL is
     *     specified, then all facets from the source will be unbound. If not
     *     specified, this will default to 'value'.
     * @returns {Object} The receiver.
     */

    return TP.destroyBinding(
            this, targetAttributeName, resourceOrURI,
            sourceAttributeName, sourceFacetName);
});

//  ------------------------------------------------------------------------

TP.lang.RootObject.Type.defineMethod('destroyBinding',
function(targetAttributeName, resourceOrURI, sourceAttributeName,
         sourceFacetName) {

    /**
     * @method destroyBinding
     * @summary Removes a binding from the type receiver.
     * @param {String} targetAttributeName The target attribute name.
     * @param {Object} resourceOrURI The resource specification.
     * @param {String} sourceAttributeName The source attribute name. If not
     *     specified, this will default to targetAttributeName.
     * @param {String} sourceFacetName The source facet name. If TP.ALL is
     *     specified, then all facets from the source will be unbound. If not
     *     specified, this will default to 'value'.
     * @returns {Object} The receiver.
     */

    return TP.destroyBinding(
            this, targetAttributeName, resourceOrURI,
            sourceAttributeName, sourceFacetName);
});

//  ------------------------------------------------------------------------

TP.lang.RootObject.Inst.defineMethod('destroyBinding',
function(targetAttributeName, resourceOrURI, sourceAttributeName,
         sourceFacetName) {

    /**
     * @method destroyBinding
     * @summary Removes a binding from the instance receiver.
     * @param {String} targetAttributeName The target attribute name.
     * @param {Object} resourceOrURI The resource specification.
     * @param {String} sourceAttributeName The source attribute name. If not
     *     specified, this will default to targetAttributeName.
     * @param {String} sourceFacetName The source facet name. If TP.ALL is
     *     specified, then all facets from the source will be unbound. If not
     *     specified, this will default to 'value'.
     * @returns {Object} The receiver.
     */

    return TP.destroyBinding(
            this, targetAttributeName, resourceOrURI,
            sourceAttributeName, sourceFacetName);
});

//  ========================================================================
//  MARKUP BINDING
//  ========================================================================

TP.totalSetupTime = 0;

TP.totalBranchQueryTime = 0;
TP.totalInlineQueryTime = 0;
TP.totalTextQueryTime = 0;

TP.totalUpdateTime = 0;

TP.totalInitialGetTime = 0;

//  ------------------------------------------------------------------------
//  TP.core.DocumentNode
//  ------------------------------------------------------------------------

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.DocumentNode.Inst.defineAttribute('$signalingBatchID');
TP.core.DocumentNode.Inst.defineAttribute('$repeatTemplates');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.DocumentNode.Inst.defineHandler('FacetChange',
function(aSignal) {

    /**
     * @method handleFacetChange
     * @summary Handles when an object (usually a URI of some sort) changes and
     *     some components on the receiver surface (i.e. usually GUI widgets)
     *     need to be updated in response to that change.
     * @param {Change} aSignal The signal instance which triggered this handler.
     */

    var changedPaths,

        ourBatchID,
        signalBatchID,

        signalFlag,

        sigOrigin,
        primarySource,

        changedPrimaryLoc,
        changedPrimaryURI,

        doc,

        query,
        elems,

        tpDocElem,

        boundAttrNodes,
        i,
        attrs,
        j,
        attrVal,

        changedPathKeys,
        keysToProcess,

        matcher,
        len,

        attrName,

        ownerElem,
        ownerTPElem,

        aspect,
        facet;

    //  See if the signal has a payload of TP.CHANGE_PATHS. If so, that means
    //  that there were specific paths to data that changed and we can more
    //  'intelligent' about updating just the items that are dependent on that
    //  data.
    changedPaths = aSignal.at(TP.CHANGE_PATHS);

    //  If the underlying machinery that sent this signal supports 'signal
    //  batching', then we can leverage that to avoid making multiple passes
    //  through the updating logic.

    //  The first step is to check for a batching ID.
    if (TP.isValid(changedPaths)) {
        if (TP.notValid(ourBatchID = this.get('$signalingBatchID'))) {

            //  If there's already a TP.END_SIGNAL_BATCH id before we've even
            //  set our cached batch ID, then there must've only been one path
            //  so we go ahead and process the signal.
            if (TP.isValid(signalBatchID = aSignal.at(TP.END_SIGNAL_BATCH))) {
                //  empty
            } else {
                if (TP.isValid(
                        signalBatchID = aSignal.at(TP.START_SIGNAL_BATCH))) {
                    this.set('$signalingBatchID', signalBatchID);
                }

                //  At the start of a batch (or a batchID wasn't provided). In
                //  either case, don't update - just return
                return;
            }
        } else if (TP.isValid(
                    signalBatchID = aSignal.at(TP.END_SIGNAL_BATCH))) {
            if (ourBatchID !== signalBatchID) {
                //  The batch is ending, but it didn't match our cached batch ID
                //  then return
                return;
            }

            //  Otherwise, we clear our cached batch ID proceed ahead.
            this.set('$signalingBatchID', null);
        } else {
            //  This wasn't the end of the batch - return.
            return;
        }
    }

    //  Turn off any kind of DOM loaded signaling. This just adds overhead and
    //  is unnecessary - in this mode, dependent items are themselves
    //  responsible for signaling that their content got replaced.
    signalFlag = TP.sys.shouldSignalDOMLoaded();
    TP.sys.shouldSignalDOMLoaded(false);

    //  Grab the signal origin and do some testing. The signal is either going
    //  to be coming from a data source URI or an 'on page' item that is in a
    //  'direct to GUI' binding relationship.
    sigOrigin = aSignal.getOrigin();

    if (TP.isKindOf(sigOrigin, TP.core.URI)) {

        //  The changed data source is a URI

        //  The primary source is the overall 'whole data' object that changed.
        primarySource = sigOrigin.getResource().get('result');
        changedPrimaryLoc = sigOrigin.getPrimaryLocation();

        //  Compute a RegExp that will be used to match 'top level' (i.e. not
        //  nested under further data scopes) binding expressions.
        matcher = TP.rc(TP.regExpEscape(changedPrimaryLoc));

    } else {

        //  The changed data source is another item in a 'direct to GUI' binding
        //  relationship.

        //  Note that, for these kinds of expressions, we only match top-level
        //  expressions (i.e. these are usually something like TIBET 'uicanvas'
        //  URLs that don't respect any sort of binding data scope).

        //  The primary source is the value that changed on the signal origin -
        //  there is no 'larger object' for us to consider.
        primarySource = sigOrigin.get('value');
        changedPrimaryLoc = sigOrigin.getID();

        changedPrimaryURI = TP.uc(changedPrimaryLoc);

        //  Grab the 'canvas' from the primary location URI. If it's the same as
        //  the current GUI canvas window, then we're updating the correct
        //  window.
        if (changedPrimaryURI.getCanvas() === TP.sys.uiwin(true)) {

            if (TP.isKindOf(sigOrigin, TP.core.ElementNode)) {

                //  If signal origin was a TP.core.ElementNode, then we want to
                //  use its local ID to compute our RegExp to match 'top level'
                //  binding expressions.
                changedPrimaryLoc = sigOrigin.getLocalID();

            } else if (TP.isKindOf(sigOrigin, TP.core.AttributeNode)) {

                //  If signal origin was a TP.core.AttributeNode, then we want
                //  to use its owner element's local ID and then a '@' separator
                //  and then its local name to compute our RegExp to match 'top
                //  level' binding expressions.
                changedPrimaryLoc = sigOrigin.getOwnerElement().getLocalID() +
                                    '@' + sigOrigin.getLocalName();
            }

            //  Build a RegExp that will match any of the following:
            //      'tibet://uicanvas#foo'
            //      '#foo'
            //      'tibet://uicanvas#foo@bar'
            //      '#foo@bar'
            matcher = TP.rc('(tibet://uicanvas#' +
                            TP.regExpEscape(changedPrimaryLoc) + '|' +
                            '#' + TP.regExpEscape(changedPrimaryLoc) + ')');
        }
    }

    doc = this.getNativeNode();

    //  Query for all elements containing namespaced attributes of 'io', 'in',
    //  'scope' or repeat. This is the most sophisticated 'namespace like' query
    //  we can give the native querySelectorAll() call since it doesn't really
    //  recognize namespaces... we'll fix that later.
    query = '*[*|io], *[*|in], *[*|scope], *[*|repeat]';

    elems = TP.ac(doc.documentElement.querySelectorAll(query));

    boundAttrNodes = TP.ac();

    //  Loop over all of the elements that were found.
    for (i = 0; i < elems.length; i++) {
        attrs = elems[i].attributes;

        //  Loop over all of the attributes of the found element.
        for (j = 0; j < attrs.length; j++) {

            attrVal = attrs[j].value;

            //  If the attribute was in the BIND namespace and either matched
            //  our matcher OR contained ACP variables, then add it to our list
            //  of bound attributes.
            if (attrs[j].namespaceURI === TP.w3.Xmlns.BIND &&
                (matcher.test(attrVal) ||
                    TP.regex.ACP_PATH_CONTAINS_VARIABLES.test(attrVal))) {

                boundAttrNodes.push(attrs[j]);
            }
        }
    }

    //  Grab the TP.core.ElementNode that is our document Element.
    tpDocElem = this.getDocumentElement();

    //  If the signal had a payload of TP.CHANGE_PATHS then we can drive the
    //  updating process directly from those paths.
    if (TP.isValid(changedPaths)) {

        //  TIMING: var startUpdate = Date.now();

        //  Grab the keys of the changed paths and sort them so that the
        //  'shortest' keys are first. This will cause the 'least specific'
        //  paths to be sorted to the top.

        changedPathKeys = changedPaths.getKeys();
        changedPathKeys.sort(
            function(a, b) {
                return a.length - b.length;
            });

        //  Start with the shortest path key. This is the 'least specific path'.
        keysToProcess = TP.ac(changedPathKeys.first());

        //  Then iterate over all path keys that have changed. If the key starts
        //  with any of the keys that are in the keys that we're going to
        //  process, then it must be a 'more specific' version of that key, so
        //  we skip it. Otherwise, we add it to the list of keys that we're
        //  going to process. In this way, we end up with a reasonably
        //  parsimonious, yet complete, set of paths that we're going to update.
        for (i = 0; i < changedPathKeys.getSize(); i++) {

            //  NB: We use getSize() here as we expect that this Array could
            //  change size as we add keys to it.
            for (j = 0; j < keysToProcess.getSize(); j++) {
                if (changedPathKeys.at(i).startsWith(keysToProcess.at(j))) {
                    continue;
                }

                keysToProcess.push(changedPathKeys.at(i));
            }
        }

        //  Iterate over all of the keys and update any items that are dependent
        //  on them.
        keysToProcess.forEach(
                function(changedPath) {

                    var actions,
                        actionLen,
                        k,

                        initialVal,

                        pathAction,
                        pathParts,
                        pathType;

                    //  This will be a list of actions for the path - TP.CREATE,
                    //  TP.UPDATE, TP.DELETE, etc.
                    actions = changedPaths.at(changedPath).getKeys();

                    //  We have to iterate for each action.
                    actionLen = actions.getSize();
                    for (k = 0; k < actionLen; k++) {

                        //  The initial value is the primary source, but this
                        //  might change below.
                        initialVal = primarySource;

                        pathAction = actions.at(k);

                        //  Grab the path parts and type for the path that
                        //  changed.
                        pathParts = TP.getAccessPathParts(changedPath);
                        pathType = TP.getAccessPathType(changedPath);

                        //  If the path is an XPath and the changed path started
                        //  with a '/', then update the first part to contain
                        //  the '/' (TP.getAccessPathParts() will - correctly -
                        //  not include that '/', but we want it in this
                        //  context).
                        if (pathType === TP.XPATH_PATH_TYPE &&
                            changedPath.startsWith('/')) {
                            pathParts.atPut(0, '/' + pathParts.at(0));
                        } else if (pathType === TP.TIBET_PATH_TYPE) {

                            //  If it wasn't an XPath, reset the initial value
                            //  to its 'value'.
                            initialVal = initialVal.get('value');
                        }

                        //  Unshift the pointer scheme onto the front of the
                        //  list of path parts.
                        pathParts.unshift(
                                '#' + TP.getPointerScheme(changedPath) + '()');

                        //  Unshift the primary location onto the front.
                        pathParts.unshift(changedPrimaryLoc);

                        //  Refresh all 'branches' (i.e. items, including
                        //  top-level bound expressions and scoped expressions,
                        //  of course) using all of the information that we
                        //  compiled.
                        tpDocElem.refreshBranches(
                            primarySource, aSignal, elems, initialVal,
                            pathType, pathParts, pathAction, false);
                    }
                });

        //  TIMING: var endUpdate = Date.now();
        //  TIMING: TP.totalUpdateTime += (endUpdate - startUpdate);

    } else {

        //  TIMING: var startSetup = Date.now();

        aspect = aSignal.at('aspect');
        facet = aSignal.at('facet');

        //  If our signal origin is a URI and the aspect is one of URI's
        //  'special aspects', then we just return here.
        if (TP.isURI(aSignal.getOrigin()) &&
            TP.core.URI.SPECIAL_ASPECTS.contains(aspect)) {

            //  Set the DOM content loaded signaling whatever it was when we
            //  entered this method.
            TP.sys.shouldSignalDOMLoaded(signalFlag);

            return;
        }

        //  If we have an aspect and the facet that we're updating is *not*
        //  'value', then that means we're updating other facets such as
        //  'readonly', 'required', etc. This means that we just use the
        //  singular aspect as the 'path parts' and pretend that this is a
        //  TIBET-type path, no matter how the 'value' facet is bound.
        if (TP.notEmpty(aspect) && facet !== 'value') {

            //  Refresh all 'branches' using the aspect from the path, since
            //  we're updating 'non value facet' bindings..
            tpDocElem.refreshBranches(
                    primarySource, aSignal, elems, primarySource,
                    TP.TIBET_PATH_TYPE, TP.ac(aspect), TP.UPDATE, false);
        } else if (TP.notEmpty(facet)) {

            //  Otherwise, if the signal's origin is a URI (usually a data-bound
            //  URI), then (because we don't have 'changed data paths' to go
            //  by), we just update all of the bind expressions that are on the
            //  computed bound elements.
            if (TP.isKindOf(sigOrigin, TP.core.URI)) {

                tpDocElem.refreshBranches(
                        primarySource, aSignal, elems, primarySource,
                        null, null, null, false);
            } else {

                //  Otherwise, the signal's origin was not a URI, so it must've
                //  been another GUI control within the page. Because we don't
                //  have 'changed data paths' to go by, we update all 'direct
                //  GUI' bindings.

                //  Sort the attribute nodes so that 'bind:in' attributes come
                //  first. This is important when an element has both 'bind:in'
                //  and 'bind:io' attributes, since we want the 'in' bindings to
                //  be refreshed first to have that data available to the 'io'
                //  bindings.
                boundAttrNodes.sort(
                    function(a, b) {

                        if (a.nodeName === 'bind:in' &&
                            b.nodeName !== 'bind:in') {
                            return -1;
                        } else if (a.nodeName !== 'bind:in' &&
                                    b.nodeName === 'bind:in') {
                            return 1;
                        }

                        return 0;
                    });

                len = boundAttrNodes.getSize();
                for (i = 0; i < len; i++) {

                    attrName = boundAttrNodes.at(i).localName;

                    //  We only worry about updating 'bind:io' and 'bind:in'
                    //  paths.
                    if (attrName === 'io' || attrName === 'in') {

                        attrVal = boundAttrNodes.at(i).value;

                        if (matcher.test(attrVal)) {

                            ownerElem = boundAttrNodes.at(i).ownerElement;
                            ownerTPElem = TP.wrap(ownerElem);

                            //  Note that we use sigOrigin here as the
                            //  primarySource and initialValue. We let the
                            //  observers of this element decide how to use this
                            //  element based on their standard data binding /
                            //  decoding methods (isSingleValued,
                            //  isScalarValued, etc.)
                            ownerTPElem.refreshLeaf(
                                    sigOrigin, aSignal,
                                    sigOrigin, boundAttrNodes[i], null);
                        }
                    }
                }
            }
        }

        //  TIMING: var endSetup = Date.now();
        //  TIMING: TP.totalSetupTime += (endSetup - startSetup);
    }

    //  Set the DOM content loaded signaling whatever it was when we entered
    //  this method.
    TP.sys.shouldSignalDOMLoaded(signalFlag);

    return;
});

//  ------------------------------------------------------------------------

TP.core.DocumentNode.Inst.defineHandler('UIRefresh',
function(aSignal) {

    /**
     * @method handleUIRefresh
     * @summary Refreshes the receiver's bound data.
     * @param {TP.sig.UIRefresh} aSignal The signal instance which triggered
     *     this handler.
     */

    this.refresh();

    return this;
});

//  ------------------------------------------------------------------------

TP.core.DocumentNode.Inst.defineMethod('refresh',
function(shouldRender) {

    /**
     * @method refresh
     * @summary Updates the receiver's content by refreshing all bound elements
     *     in the document. For an HTML document this will refresh content under
     *     the body, while in an XML document all elements including the
     *     documentElement are refreshed.
     * @param {Boolean} [shouldRender] Whether or not to force (or not force)
     *     re-rendering if the data source changes. If not supplied, this
     *     parameter will default to true if the bound data changed and false if
     *     it didn't.
     * @returns {Boolean} Whether or not the bound value was different than the
     *     receiver already had and, therefore, truly changed.
     */

    var node,
        body;

    node = this.getNativeNode();

    if (TP.isHTMLDocument(node) || TP.isXHTMLDocument(node)) {
        if (TP.isElement(body = TP.documentGetBody(node))) {
            return TP.tpnode(body).refresh(shouldRender);
        }
    } else {
        return TP.tpnode(node.documentElement).refresh(shouldRender);
    }

    return false;
});

//  ------------------------------------------------------------------------
//  TP.core.ElementNode
//  ------------------------------------------------------------------------

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

//  The attributes for this element type that are considered to 'bidi
//  attributes' that can not only be bound to data source but be bound *back* to
//  the data source so that when they are changed by the user, they update the
//  data source.
TP.core.ElementNode.Type.defineAttribute('bidiAttrs', TP.ac());

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.core.ElementNode.Type.defineMethod('computeBindingInfo',
function(targetElement, attributeValue) {

    /**
     * @method computeBindingInfo
     * @summary Gets binding information from the attribute named by the
     *     supplied attribute name on the receiver.
     * @param {Element} targetElement The element the attribute is on.
     * @param {String} attributeValue The element the attribute is on.
     * @returns {TP.core.Hash} A hash of binding information keyed by the
     *     binding target name.
     */

    var attrVal,

        entryStr,
        bindEntries,

        keys,
        key,

        len,
        i,

        fullExpr,

        entry,
        hadBrackets,
        preEntry,
        postEntry,

        sigilIndex,
        formatExpr,

        transformInfo,
        transformFunc,
        dataLocs;

    attrVal = attributeValue;

    //  Otherwise, parse out each name: value pair.

    //  First, try to get the attribute as a JSON string. This allows for
    //  attribute values like:
    //
    //      {value: urn:tibet:fluffy}
    //
    //      which are converted to:
    //
    //      {"value": "urn:tibet:fluffy"}
    entryStr = TP.reformatJSToJSON(attrVal);

    //  If we couldn't get a JSON String, try to default it to {"value":"..."}
    if (!TP.isJSONString(entryStr)) {
        entryStr = '{"value":"' + attrVal + '"}';
    }

    //  Try to parse the entry string into a TP.core.Hash.
    bindEntries = TP.json2js(entryStr);

    if (TP.isEmpty(bindEntries)) {
        return this.raise('TP.sig.InvalidBinding',
                            'Source Element: ' + TP.str(targetElement) +
                            ' Generated bindings: ' + entryStr);
    }

    keys = bindEntries.getKeys();

    //  Loop over all of the extracted binding entries.
    len = bindEntries.getSize();
    for (i = 0; i < len; i++) {

        key = keys.at(i);
        entry = bindEntries.at(key);

        //  If the binding statement had embedded [[...]], then
        hadBrackets = TP.regex.BINDING_STATEMENT_DETECT.test(entry);
        if (hadBrackets) {
            formatExpr = null;

            //  Slice out the expression from the entry and reset the entry
            preEntry = entry.slice(0, entry.indexOf('[['));
            postEntry = entry.slice(entry.indexOf(']]') + 2);
            entry = entry.slice(entry.indexOf('[[') + 2, entry.indexOf(']]'));

            //  If the entry has a formatting expression, then extract it into a
            //  separate formatting expression.
            if (TP.regex.ACP_FORMAT.test(entry)) {

                sigilIndex = entry.indexOf('.%');

                formatExpr = entry.slice(sigilIndex);
                entry = entry.slice(0, sigilIndex).trim();
            }

            fullExpr = entry;

            if (TP.notEmpty(formatExpr)) {
                fullExpr += formatExpr;
            }

            fullExpr = preEntry + '[[' + fullExpr + ']]' + postEntry;

            //  Sometimes the expression is quoted to allow whitespace in the
            //  *value* portion of the 'JSON-y' structure that we use to define
            //  bindings, but we don't want surrounding quotes here - strip them
            //  off.
            fullExpr = fullExpr.unquoted();
        } else {

            //  Otherwise, the entry had no embedded brackets and we can just
            //  use that as the full expression.
            fullExpr = entry;
        }

        //  If the expression contains ACP variables, then we *must* generate a
        //  transformation Function to process them properly. The expression
        //  might or might not have surrounding '[[...]]', but we take care of
        //  that here.
        if (TP.regex.ACP_PATH_CONTAINS_VARIABLES.test(fullExpr)) {

            //  If the expression doesn't start with '[[' AND end with ']]',
            //  then we fix that here.
            if (!/^\s*\[\[/.test(fullExpr) && !/\]\]\s*$/.test(fullExpr)) {
                fullExpr = '[[' + fullExpr + ']]';
            }

            //  Compute the transform Function and dependent data expressions.
            transformInfo = this.computeTransformationFunction(fullExpr);

            //  The Function object that does the transformation.
            transformFunc = transformInfo.first();

            //  The referenced expressions.
            dataLocs = transformInfo.last();
        } else if (hadBrackets &&
            (!/^\s*\[\[/.test(fullExpr) || !/\]\]\s*$/.test(fullExpr) ||
            TP.regex.ACP_FORMAT.test(fullExpr))) {

            //  The full expression had 'surrounding content' (i.e. literal
            //  content on either or both sides of the leading or trailing
            //  square brackets). We need a transformation expression to handle
            //  this.
            transformInfo = this.computeTransformationFunction(fullExpr);

            //  The Function object that does the transformation.
            transformFunc = transformInfo.first();

            //  The referenced expressions.
            dataLocs = transformInfo.last();
        } else {

            //  Otherwise, the data locations consist of one expression, which
            //  is the whole entry.
            dataLocs = TP.ac(entry);
        }

        bindEntries.atPut(key, TP.hc('targetAttrName', key,
                                        'transformFunc', transformFunc,
                                        'dataExprs', dataLocs));
    }

    return bindEntries;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Type.defineMethod('computeTransformationFunction',
function(attributeValue) {

    /**
     * @method computeTransformationFunction
     * @summary Computes a 'transformation function' for values that are bound
     *     by virtue of the binding expressions that are in the supplied
     *     attribute value.
     * @param {String} attributeValue The attribute value to extract binding
     *     information to compute the transformation function and data
     *     expressions from.
     * @returns {Array} An Array of a Function, which is the Function that will
     *     transform the values being updated and an Array which contains all of
     *     the data expressions that are embedded in the attribute value.
     */

    var finalExpr,
        isSimpleExpr,

        referencedExprs,

        sigilIndex,

        exprParts,
        exprWithBrackets,
        exprWithoutBrackets,

        hasSurroundingContent,

        formatExpr,
        valueExpr,

        splitURI,
        computedValueExpr,

        transformFunc;

    finalExpr = attributeValue;

    isSimpleExpr = true;

    referencedExprs = TP.ac();

    //  While we can still extract binding expressions from the value, keep
    //  looping. This allows us to have multiple expressions in a single value
    //  (i.e. 'foo [[bar]] is called: [[baz]]')
    TP.regex.BINDING_STATEMENT_EXTRACT.lastIndex = 0;
    while (TP.isValid(exprParts =
            TP.regex.BINDING_STATEMENT_EXTRACT.exec(attributeValue))) {

        //  We want the expression both with and without the surrounding
        //  brackets ([[...]])
        exprWithBrackets = exprParts.first();
        exprWithoutBrackets = exprParts.last();

        //  If the attribute value doesn't exactly equal the expression without
        //  brackets surrounded by brackets, then it has 'surrounding content'.
        hasSurroundingContent =
                '[[' + exprWithoutBrackets + ']]' !== attributeValue;

        //  If the expression without brackets has an ACP format, then we slice
        //  around and extract separate value and format expressions.
        if (TP.regex.ACP_FORMAT.test(exprWithoutBrackets)) {

            sigilIndex = exprWithoutBrackets.indexOf('.%');

            valueExpr = exprWithoutBrackets.slice(0, sigilIndex).trim();
            formatExpr = ' .% ' + exprWithoutBrackets.slice(
                                                    sigilIndex + 2).trim();
        } else {

            //  Otherwise, the value expression is the whole expression without
            //  brackets and the format expression is empty.
            valueExpr = exprWithoutBrackets;
            formatExpr = '';
        }

        //  If the expression to execute is a path that contains variables, then
        //  we use the 'value' of the URI and leverage the transformation
        //  function installed below to form a final value.
        if (TP.regex.ACP_PATH_CONTAINS_VARIABLES.test(valueExpr)) {

            isSimpleExpr = false;

            //  If the expression to execute is a fully-formed URI, then we
            //  don't take the scope values into consideration. We build a URI
            //  location consisting of the URI's primary href with a
            //  '#tibet(...)' XPointer that will return the source object
            //  itself. This is important in the transformation function when we
            //  run the 'transform' call, because the expression is going to
            //  expect to run against the core source object itself. We then
            //  reset the expression to execute to be just the fragment text.
            if (TP.isURIString(valueExpr)) {

                //  Grab the primary URI from a URI computed from the value
                //  expression and append a '#tibet(.)' on it (which will
                //  retrieve the whole value).
                splitURI = TP.uc(valueExpr);
                valueExpr = splitURI.getPrimaryLocation() + '#tibet(.)';

                //  Set the 'computed' value expression to just the fragment.
                computedValueExpr = splitURI.getFragmentExpr();
            } else {
                //  Set the 'computed' value expression to the whole value
                //  expression.
                computedValueExpr = valueExpr;
            }

            //  Make sure to replace that expression in the expression to
            //  execute with a 'formatting expression', so that the templating
            //  function below will work.
            finalExpr = finalExpr.replace(
                            exprWithBrackets,
                            '{{' + computedValueExpr + formatExpr + '}}');

            //  Unquote any final expression (note that this only removes
            //  surrounding quotes - not embedded ones).
            finalExpr = finalExpr.unquoted('"');
        } else {

            //  If the expression has surrounding literal content we flip the
            //  'isSimpleExpr' flag to false and install a more complex
            //  transformation function below.
            if (TP.notEmpty(formatExpr) || hasSurroundingContent) {

                isSimpleExpr = false;

                finalExpr = finalExpr.replace(
                                exprWithBrackets,
                                '{{value' + formatExpr + '}}');
                finalExpr = finalExpr.unquoted('"');
            }
        }

        //  Keep a list of the 'referenced value expressions'.
        referencedExprs.push(valueExpr);
    }

    //  If this is not a simple expression, then we install a transformation
    //  Function that will transform the data before returning it.
    if (!isSimpleExpr) {

        transformFunc = function(source, val, targetTPElem,
                                 repeatSource, index, isXMLResource) {
            var wrappedVal,

                params,

                last,

                retVal;

            //  Wrap the value - it helps when trying to extract a value from it
            //  to get the most 'intelligent' data type.
            wrappedVal = TP.wrap(val);

            //  Iterating context
            if (TP.isNumber(index)) {

                if (isXMLResource) {

                    last = repeatSource.getSize();

                    params = TP.hc(
                                '$REQUEST', null,
                                'TP', TP,
                                'APP', APP,
                                '$SOURCE', source,
                                '$TAG', targetTPElem,
                                '$TARGET', targetTPElem.getDocument(),
                                '$_', wrappedVal,
                                '$INPUT', repeatSource,
                                '$INDEX', index,
                                '$FIRST', index === 1,
                                '$MIDDLE', index > 1 && index < last,
                                '$LAST', index !== last,
                                '$EVEN', index % 2 === 0,
                                '$ODD', index % 2 !== 0,
                                '$#', index);
                } else {

                    last = repeatSource.getSize() - 1;

                    params = TP.hc(
                                '$REQUEST', null,
                                'TP', TP,
                                'APP', APP,
                                '$SOURCE', source,
                                '$TAG', targetTPElem,
                                '$TARGET', targetTPElem.getDocument(),
                                '$_', wrappedVal,
                                '$INPUT', repeatSource,
                                '$INDEX', index,
                                '$FIRST', index === 0,
                                '$MIDDLE', index > 0 && index < last,
                                '$LAST', index !== last,
                                '$EVEN', index % 2 === 0,
                                '$ODD', index % 2 !== 0,
                                '$#', index);
                }
            } else {

                //  Non-iterating context
                params = TP.hc(
                            '$REQUEST', null,
                            'TP', TP,
                            'APP', APP,
                            '$TAG', targetTPElem,
                            '$TARGET', targetTPElem.getDocument(),
                            '$_', wrappedVal,
                            '$INPUT', val);
            }

            //  Don't try to template invalid values.
            if (TP.isValid(val)) {
                retVal = transformFunc.$$templateFunc.transform(val, params);
            } else {
                //  null or undefined, but let's be pendantic
                retVal = val;
            }

            return retVal;
        };

        //  Compile the 'final expression' into a templating Function and
        //  stash a reference to it on our transformation Function.
        transformFunc.$$templateFunc = finalExpr.compile();

    } else {

        //  Otherwise, we generated a simple transformation Function that will
        //  just return the 'reduced value'. This is necessary especially for
        //  XML where val will be an Element, but we want the text value of
        //  the Element.
        transformFunc = function(source, val) {
            return TP.val(val);
        };
    }

    //  Return an Array containing the transformation Function and an Array of
    //  the referenced expressions.
    return TP.ac(transformFunc, referencedExprs);
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineAttribute('scopeValues');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('$deleteRepeatRowAt',
function(indexes) {

    /**
     * @method $deleteRepeatRowAt
     * @summary Removes the rows at the indexes provided.
     * @description Note that the indexes supplied to this method should match
     *     the type of data source object of the repeat. If the data source of
     *     the repeat is an XML object, these indexes should be '1-based' (like
     *     XPath). If it is an JS or JSON object, these indexes should be
     *     '0-based' (like JSONPath).
     * @param {Array.<Number>} indexes An Array of Numbers that indicate the
     *     indexes of the items to remove.
     * @returns {TP.core.ElementNode} The receiver.
     */

    var elem,

        wrapperElement,

        len,
        i,
        index,

        deletionElement,

        followingScopedSiblings,

        len2,
        j,
        scopedSibling,
        scopeVal,

        thisref;

    elem = this.getNativeNode();

    //  Whichever element has a 'tibet:nomutationtracking' attribute on it is
    //  acting as a common wrapper for the 'rows' making up the repeat. This may
    //  be a <tbody> element if we're repeating rows in a <table>, but it
    //  doesn't have to be.
    if (TP.elementHasAttribute(elem, 'tibet:nomutationtracking', true)) {
        wrapperElement = elem;
    } else {
        wrapperElement = TP.byCSSPath(
                            '> *[tibet|nomutationtracking]',
                            elem,
                            true,
                            false);
    }

    if (!TP.isElement(wrapperElement)) {
        //  TODO: Raise exception
        return;
    }

    //  Loop over all of the supplied indices
    len = indexes.getSize();
    for (i = 0; i < len; i++) {

        index = indexes.at(i);

        //  The deletion element would be the element with the same index as the
        //  row we're deleting. If we find one, we delete that row and decrement
        //  the number of all numeric scoped elements *at the same level* with
        //  an index equal to or greater than the delete index.
        deletionElement = TP.byCSSPath(
                                '> *[bind|scope="[' + index + ']"]',
                                wrapperElement,
                                true,
                                false);

        //  If we couldn't find the row to delete, then continue to the next
        //  index to delete.
        if (!TP.isElement(deletionElement)) {
            continue;
        }

        //  Now, grab all of the scoped siblings that follow the element that
        //  we're going to delete.
        followingScopedSiblings = TP.byCSSPath(
                                    '~ *[bind|scope^="["][bind|scope$="]"]',
                                    deletionElement,
                                    false,
                                    false);

        //  Now that we've found the scoped siblings, we can remove the deletion
        //  element
        TP.nodeDetach(deletionElement);

        //  Iterate over all of the scoped siblings and adjust their index. Note
        //  how we start by using the index we just deleted. Then we increment
        //  that number and advance.

        len2 = followingScopedSiblings.getSize();
        for (j = 0; j < len2; j++) {

            scopedSibling = followingScopedSiblings.at(j);

            if (TP.notEmpty(scopeVal = TP.elementGetAttribute(
                                    scopedSibling, 'bind:scope', true))) {

                if (TP.regex.SIMPLE_NUMERIC_PATH.test(scopeVal)) {

                    TP.elementSetAttribute(
                            scopedSibling,
                            'bind:scope',
                            '[' + index + ']',
                            true);

                    //  Note how we increment this *after* we set the attribute.
                    //  This is because we're shifting everything 'up' and so we
                    //  want to start renumbering *at the same index* as the
                    //  deletion element was.
                    index += 1;
                }
            }
        }
    }

    //  Send a UIDidDelete with ourself as the target and the set of indexes
    //  that the insertion happened at.
    thisref = this;

    (function() {
        thisref.signal('TP.sig.UIDidDelete',
                        TP.hc('target', thisref, 'indexes', indexes));
    }).queueForNextRepaint(this.getNativeWindow());

    TP.$elementCSSFlush(elem);

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('flushBindingInfoCacheFor',
function(attributeValue) {

    /**
     * @method flushBindingInfoCacheFor
     * @summary Flushes the binding information cache for the supplied attribute
     *     value.
     * @param {String} attributeValue The attribute value to obtain binding
     *     information from.
     * @returns {TP.core.ElementNode} The receiver.
     */

    var elem,
        doc,

        registry;

    //  Grab the native Element and Document.
    elem = this.getNativeNode();
    doc = TP.nodeGetDocument(elem);

    //  If there's no 'bind registry' installed on the Document, then just
    //  return.
    if (TP.notValid(registry = doc[TP.BIND_INFO_REGISTRY])) {
        return this;
    }

    registry.removeKey(attributeValue);

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('getBindingInfoFrom',
function(attributeValue, flushCache) {

    /**
     * @method getBindingInfoFrom
     * @summary Gets binding information from the attribute named by the
     *     supplied attribute name on the receiver.
     * @param {String} attributeValue The attribute value to obtain binding
     *     information from.
     * @param {Boolean} [flushCache=false] Whether or not to flush any currently
     *     cached binding info for the supplied attribute value.
     * @returns {TP.core.Hash} A hash of binding information keyed by the
     *     binding target name.
     */

    var elem,
        doc,

        registry,

        bindEntries;

    //  Grab the native Element and Document.
    elem = this.getNativeNode();
    doc = TP.nodeGetDocument(elem);

    //  If there's no 'bind registry' installed on the Document, then create
    //  one. This registry is used to avoid computing the binding information
    //  from the attribute value each time we need it. It's computed once and
    //  then stored under a key that is the whole attribute value. In this way,
    //  it can be shared amongst multiple attributes and elements, as long as
    //  the value of the attribute is exactly the same.
    if (TP.notValid(registry = doc[TP.BIND_INFO_REGISTRY])) {
        registry = TP.hc();
        doc[TP.BIND_INFO_REGISTRY] = registry;
    }

    if (TP.isTrue(flushCache)) {
        registry.removeKey(attributeValue);
    }

    //  If the attribute value (acting as a key) is already in the registry,
    //  then just exit here - we don't want dups in the registry.
    if (registry.hasKey(attributeValue)) {
        return registry.at(attributeValue);
    }

    //  Ask the type to compute the binding info and put it into the registry.
    bindEntries = this.getType().computeBindingInfo(elem, attributeValue);
    registry.atPut(attributeValue, bindEntries);

    return bindEntries;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('getBindingScopeValues',
function() {

    /**
     * @method getBindingScopeValues
     * @summary Returns the binding scope values by starting at the receiver
     *      and traversing the DOM tree up to the #document node, gathering
     *      'bind:scope' attribute values along the way. This will be used to
     *      qualify binding expressions on the receiver.
     * @returns {Array} An Array of binding scope values.
     */

    var elem,

        localScopeNode,

        scopeVals;

    //  If we've already cached our scope values, then there's no need to
    //  recompute them - just return the cached values.
    if (TP.notEmpty(scopeVals = this.get('scopeValues'))) {
        return scopeVals;
    }

    elem = this.getNativeNode();

    scopeVals = TP.ac();

    //  Check to see if there is a local 'scope' attribute on the element
    //  itself. This will be used to qualify any expressions on the element
    //  itself.
    if (TP.notEmpty(localScopeNode = TP.elementGetAttributeNodesInNS(
                            elem, /\w+:(scope|repeat)/, TP.w3.Xmlns.BIND))) {
        scopeVals.push(localScopeNode[0].value);
    }

    //  Gather the 'bind:scope' setting up the chain.
    TP.nodeAncestorsPerform(
        elem,
        function(aNode) {

            var scopeAttrVal;

            //  Have to check to make sure we're not at the #document node.
            if (TP.isElement(aNode)) {

                //  Get any 'scope' attributes belonging to the TP.w3.Xmlns.BIND
                //  namespace.

                //  First, check to see if there's a 'bind:repeat' attribute. If
                //  so, we want to use it's value first.
                scopeAttrVal = TP.elementGetAttribute(
                                        aNode, 'bind:repeat', true);

                if (TP.notEmpty(scopeAttrVal)) {
                    scopeVals.push(scopeAttrVal);
                }

                //  If the scope value is a URI, then we break here - we now
                //  have a fully-formed set of scopes.
                if (TP.isURIString(scopeAttrVal)) {
                    return TP.BREAK;
                }

                //  Then, check to see if there's a 'bind:scope' attribute. If
                //  so, we want to use it's value next.
                scopeAttrVal = TP.elementGetAttribute(
                                        aNode, 'bind:scope', true);

                if (TP.notEmpty(scopeAttrVal)) {
                    scopeVals.push(scopeAttrVal);
                }

                //  If the scope value is a URI, then we break here - we now
                //  have a fully-formed set of scopes.
                if (TP.isURIString(scopeAttrVal)) {
                    return TP.BREAK;
                }
            }
        });

    //  Make sure to reverse the scope values, since we want the 'most
    //  significant' to be first.
    scopeVals.reverse();

    //  Cache the values. Note here how we supply false to *not* broadcast a
    //  change signal - otherwise, the binding machinery will get involved and
    //  send extra notifications.
    this.$set('scopeValues', scopeVals, false);

    return scopeVals;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('$getBoundElements',
function(wantsShallowScope) {

    /**
     * @method $getBoundElements
     * @summary Returns an Array of the bound elements under the receiver.
     * @param {Boolean} wantsShallowScope Whether or not to produce bound
     *     elements that are 'under' a nested scope (i.e. either a bind:scope or
     *     bind:repeat) under the receiver.
     * @returns {Element[]} An Array of bound elements.
     */

    var elem,

        doc,

        subscopeQuery,
        allScopes,
        shallowSubscopes,

        allBoundQuery,
        boundElems;

    elem = this.getNativeNode();

    doc = TP.nodeGetDocument(elem);

    //  If the caller wants the 'shallow set', then we do *not* want to return
    //  elements that are under subscopes of the receiver. We need to compute
    //  the set of subscopes that *are* under the receiver, so that we can use
    //  them later for filtering.
    if (wantsShallowScope) {

        //  Grab all of the scoping elements in the whole document.
        subscopeQuery = '*[*|scope], *[*|repeat]';
        allScopes = TP.ac(doc.documentElement.querySelectorAll(subscopeQuery));

        //  Filter all of the scopes in the document so that only those that are
        //  at the shallowest level (i.e. not containing any other scoping
        //  elements themselves) are left.
        shallowSubscopes = allScopes.filter(
                function(aSubscope) {

                    var k;

                    //  We don't want ourself in the list
                    if (aSubscope === elem) {
                        return false;
                    }

                    if (!elem.contains(aSubscope)) {
                        return false;
                    }

                    for (k = 0; k < allScopes.length; k++) {
                        if (allScopes[k] !== aSubscope &&
                            allScopes[k].contains(aSubscope)) {
                            return false;
                        }
                    }

                    return true;
                });
    }

    //  Grab all of the bound elements, including scoping element, in the whole
    //  document.
    allBoundQuery = '*[*|io], *[*|in], *[*|scope], *[*|repeat]';
    boundElems = TP.ac(doc.documentElement.querySelectorAll(allBoundQuery));

    //  Filter all of the bound elements so that they're a) under ourself and
    //  b) if only shallow scopes are requested that they're only under a
    //  shallow scope (hence making it so that they're under one of *our*
    //  shallow scopes).
    boundElems = boundElems.filter(
            function(aNewElem) {

                var k;

                //  We don't want ourself in the list
                if (aNewElem === elem) {
                    return false;
                }

                if (elem.contains(aNewElem)) {

                    if (wantsShallowScope) {

                        for (k = 0; k < shallowSubscopes.length; k++) {

                            //  The element was contained in a subscope - return
                            //  false to filter it out.
                            if (shallowSubscopes[k].contains(aNewElem)) {
                                return false;
                            }
                        }
                    }

                    return true;
                }

                return false;
            });

    //  If there are shallow subscopes, then we add them to the result.
    if (TP.notEmpty(shallowSubscopes)) {
        boundElems = boundElems.concat(shallowSubscopes);
    }

    return boundElems;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('getBoundValues',
function(scopeVals, bindingInfoValue) {

    /**
     * @method getBoundValues
     * @summary Returns a hash of the bound values of the receiver.
     * @param {String[]} scopeVals The list of scoping values (i.e. parts
     *     that, when combined, make up the entire bind scoping path).
     * @param {String} bindingInfoValue A String, usually in a JSON-like format,
     *     that details the binding information for the receiver. That is, the
     *     bounds aspects of the receiver and what they're bound to.
     * @returns {TP.core.Hash} A hash of the bound values where the key is the
     *     bound aspect and the value is the value of that aspect in the bound
     *     data source.
     */

    var retVal,

        bindingInfo;

    retVal = TP.hc();

    //  Extract the binding information from the supplied binding information
    //  value String. This may have already been parsed and cached, in which
    //  case we get the cached values back.
    bindingInfo = this.getBindingInfoFrom(bindingInfoValue);

    //  Iterate over each binding expression in the binding information.
    bindingInfo.perform(
        function(bindEntry) {

            var aspectName,

                bindVal,

                dataExprs,
                i,
                dataExpr,

                allVals,
                fullExpr,

                wholeURI,

                result;

            aspectName = bindEntry.first();

            bindVal = bindEntry.last();

            //  There will be 1...n data expressions here. Iterate over them and
            //  compute a model reference.
            dataExprs = bindVal.at('dataExprs');
            for (i = 0; i < dataExprs.getSize(); i++) {
                dataExpr = dataExprs.at(i);

                if (TP.notEmpty(scopeVals)) {
                    //  Concatenate the binding value onto the scope values
                    //  array (thereby creating a new Array) and use it to
                    //  join all of the values together.
                    allVals = scopeVals.concat(dataExpr);
                    fullExpr = TP.uriJoinFragments.apply(TP, allVals);

                    //  If we weren't able to compute a real URI from the
                    //  fully expanded URI value, then raise an exception
                    //  and return here.
                    if (!TP.isURIString(fullExpr)) {
                        this.raise('TP.sig.InvalidURI');

                        break;
                    }

                    wholeURI = TP.uc(fullExpr);
                } else {
                    //  Scope values is empty - this is (hopefully) a fully
                    //  qualified binding expression.

                    //  If we weren't able to compute a real URI from the
                    //  fully expanded URI value, then raise an exception
                    //  and return here.
                    if (!TP.isURIString(dataExpr = TP.trim(dataExpr))) {
                        this.raise('TP.sig.InvalidURI');

                        break;
                    }

                    wholeURI = TP.uc(dataExpr);
                }

                if (!TP.isURI(wholeURI)) {
                    this.raise('TP.sig.InvalidURI');

                    break;
                }

                if (TP.isValid(result = wholeURI.getResource().get('result'))) {
                    retVal.atPut(aspectName, result);
                }
            }
        });

    return retVal;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('getFullyExpandedBindingExpressions',
function() {

    /**
     * @method getFullyExpandedBindingExpressions
     * @summary Returns all of the 'fully expanded' binding expressions for the
     *     receiver.
     * @description These are computed by taking all of the scoping values plus
     *     the local expression and then expanding them into the fully expanded
     *     binding expression.
     * @returns {TP.core.Hash} A hash of the aspect names and the fully-formed
     *     binding expressions on the receiver for each name.
     */

    var elem,

        attrName,

        scopeVals,

        results,

        attrVal,

        info;

    elem = this.getNativeNode();

    //  Grab the name of the attribute, according to our precedence hierarchy.
    //  First, bind:in, then bind:io, then bind:out.
    if (TP.elementHasAttribute(elem, 'bind:in', true)) {
        attrName = 'bind:in';
    } else if (TP.elementHasAttribute(elem, 'bind:io', true)) {
        attrName = 'bind:io';
    } else if (TP.elementHasAttribute(elem, 'bind:out', true)) {
        attrName = 'bind:out';
    } else if (TP.elementHasAttribute(elem, 'bind:scope', true)) {
        attrName = 'bind:scope';
    } else if (TP.elementHasAttribute(elem, 'bind:repeat', true)) {
        attrName = 'bind:repeat';
    }

    if (TP.isEmpty(attrName)) {
        return null;
    }

    //  Get all of the scoping values and the local attribute value for the
    //  attribute name computed above.
    scopeVals = this.getBindingScopeValues();

    results = TP.hc();

    //  If the attribute is a 'bind:scope' or 'bind:repeat', then all we really
    //  need are the scoping values themselves.
    if (attrName === 'bind:scope' || attrName === 'bind:repeat') {
        results.atPut('scope', TP.uriJoinFragments.apply(TP, scopeVals));
    } else {
        attrVal = this.getAttribute(attrName);

        //  Grab the binding info for that local attribute value.
        info = this.getBindingInfoFrom(attrVal);

        info.perform(
            function(kvPair) {

                var dataExpr,

                    allVals,
                    fullExpr;

                //  Get the data expression for the named aspect.
                //  TODO: Support more than 1 data expression.
                dataExpr = kvPair.last().at('dataExprs').first();

                //  Join together the data expression along with the scoping
                //  values to calculate the 'fully formed' binding expression.
                allVals = scopeVals.concat(dataExpr);

                fullExpr = TP.uriJoinFragments.apply(TP, allVals);

                results.atPut(kvPair.first(), fullExpr);
            });
    }

    return results;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('$getNearestRepeatIndex',
function() {

    /**
     * @method $getNearestRepeatIndex
     * @summary Returns the 'nearest' repeat index to the receiver. The receiver
     *     might be nested in multiple repeat contexts and this will return the
     *     'most specific' one to the receiver.
     * @returns {Number} The repeat index 'nearest' to the receiver in it's
     *     ancestor chain or TP.NOT_FOUND.
     */

    var scopeVals,

        len,
        i,

        repeatIndex,

        val;

    //  Grab all of the binding scope values. If there aren't any, then we just
    //  return TP.NOT_FOUND
    scopeVals = this.getBindingScopeValues();

    if (TP.isEmpty(scopeVals)) {
        return TP.NOT_FOUND;
    }

    //  Reverse the values, since we want to find the nearest (i.e. the most
    //  specific) index (we might be in a nested repeat)
    scopeVals.reverse();

    repeatIndex = TP.NOT_FOUND;

    //  Iterate up through the scoping values, looking for a numeric scope.
    len = scopeVals.getSize();
    for (i = 0; i < len; i++) {

        val = scopeVals.at(i);

        //  If attribute value contains '[N]', where N is an integer, then we
        //  extract that and convert it to a Number.
        if (TP.regex.SIMPLE_NUMERIC_PATH.test(val)) {
            repeatIndex = TP.regex.SIMPLE_NUMERIC_PATH.exec(
                                        val).at(1).asNumber();
            break;
        }
    }

    return repeatIndex;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('$getRepeatSourceAndIndex',
function() {

    /**
     * @method $getRepeatSourceAndIndex
     * @summary Returns the repeating data source and index for the receiver if
     *     the receiver is under a 'bind:repeat' and is participating in the
     *     repeating iteration mechanics.
     * @returns {Array} An Array containing the repeat source and repeat index.
     */

    var elem,

        repeatElem,
        repeatAttrVal,

        repeatSource,

        repeatScopeVals,
        repeatPath,

        attrVal,
        repeatIndex;

    elem = this.getNativeNode();

    //  Iterate up through the ancestor chain, looking for the nearest ancestor
    //  with a 'bind:repeat'. If one is found, then grab the value of the
    //  'bind:repeat' attribute before exiting.
    repeatElem = TP.nodeDetectAncestor(
                    elem,
                    function(aNode) {
                        var isRepeat;

                        isRepeat = TP.isElement(aNode) &&
                                    TP.elementHasAttribute(
                                            aNode, 'bind:repeat', true);

                        if (isRepeat) {
                            repeatAttrVal =
                                    TP.elementGetAttribute(
                                            aNode, 'bind:repeat', true);
                        }

                        return isRepeat;
                    });

    //  If we successfully detected a 'bind:repeat' ancestor, then try to
    //  calculate a repeat resource and our index within that repeat resource.
    if (TP.isElement(repeatElem)) {

        //  Try to calculate a repeat resource

        //  NB: Note how we do *not* want the getResource() call to collapse
        //  it's results for these calls - we always want a collection.

        //  If it's a URI String, then we can calculate a TP.core.URI from it
        //  and just grab that resource's value.

        if (TP.isURIString(repeatAttrVal)) {
            repeatSource = TP.uc(repeatAttrVal).getResource(
                            TP.request('shouldCollapse', false)).get('value');
        } else {

            //  Otherwise, get the 'bind:repeat' ancestor's binding scope
            //  values, compute a path from them and use that as the URI.
            repeatScopeVals = TP.wrap(repeatElem).
                                getBindingScopeValues().concat(repeatAttrVal);
            repeatPath = TP.uriJoinFragments.apply(TP, repeatScopeVals);

            repeatSource = TP.uc(repeatPath).getResource(
                            TP.request('shouldCollapse', false)).get('value');
        }

        //  Try to calculate a repeat index

        //  If we have a numeric 'bind:scope' attribute, then that means that
        //  we're the actual 'row' in the repeat.
        if (TP.elementHasAttribute(elem, 'bind:scope', true)) {
            if (TP.notEmpty(attrVal = TP.elementGetAttribute(
                                            elem, 'bind:scope', true))) {

                //  If attribute value contains '[N]', where N is an integer,
                //  then we extract that and convert it to a Number.
                if (TP.regex.SIMPLE_NUMERIC_PATH.test(attrVal)) {
                    repeatIndex = TP.regex.SIMPLE_NUMERIC_PATH.exec(
                                                attrVal).at(1).asNumber();
                }
            }
        }

        //  If we could not get a repeat index from ourself, then we look up the
        //  ancestor chain looking for one.
        if (!TP.isNumber(repeatIndex)) {

            TP.nodeDetectAncestor(
                elem,
                function(aNode) {
                    if (TP.isElement(aNode) &&
                        TP.notEmpty(attrVal = TP.elementGetAttribute(
                                                aNode, 'bind:scope', true))) {

                        //  If attribute value contains '[N]', where N is an
                        //  integer, then we extract that and convert it to a
                        //  Number.
                        if (TP.regex.SIMPLE_NUMERIC_PATH.test(attrVal)) {
                            repeatIndex = TP.regex.SIMPLE_NUMERIC_PATH.exec(
                                                    attrVal).at(1).asNumber();
                            return true;
                        }
                    }

                    return false;
                });
        }

        //  Return an Array containing the repeat source and repeat index.
        return TP.ac(repeatSource, repeatIndex);
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('$getRepeatTemplate',
function() {

    /**
     * @method $getRepeatTemplate
     * @summary Returns the repeat template Element for the receiver.
     * @returns {Element} The repeat template Element.
     */

    var elem,

        templateID,
        templateInfo,

        repeatContent;

    elem = this.getNativeNode();

    //  If we successfully detected a 'bind:repeat' ancestor, then try to
    //  calculate a repeat resource and our index within that repeat resource.
    if (TP.elementHasAttribute(elem, 'bind:repeat', true)) {

        //  Grab the unique templateID that should've been placed on us when our
        //  template content was captured.
        templateID = TP.elementGetAttribute(elem, 'tibet:templateID', true);
        if (TP.isEmpty(templateID)) {
            //  TODO: Raise an exception
            return null;
        }

        //  The template content was stored on our TP.core.Document when it was
        //  captured and was stored under our templateID.
        if (TP.notValid(
                templateInfo = this.getDocument().get('$repeatTemplates'))) {
            //  TODO: Raise an exception
            return null;
        }

        if (TP.notValid(repeatContent = templateInfo.at(templateID))) {
            //  TODO: Raise an exception
            return null;
            /*
            repeatContent = this.$captureRepeatContent(elems);
            if (!TP.owns(this, 'addContent')) {
                this.defineMethod(
                    'addContent',
                    function(newContent, aRequest, stdinContent) {
                        this.callNextMethod();
                        this.$captureRepeatContent();
                    });
                this.defineMethod(
                    'insertContent',
                    function(newContent, aRequest, stdinContent) {
                        this.callNextMethod();
                        this.$captureRepeatContent();
                    });
                this.defineMethod(
                    'replaceWith',
                    function(newContent, aRequest, stdinContent) {
                        this.callNextMethod();
                        this.$captureRepeatContent();
                    });
                this.defineMethod(
                    'setContent',
                    function(newContent, aRequest, stdinContent) {
                        this.callNextMethod();
                        this.$captureRepeatContent();
                    });
            }
            */
        }

        return repeatContent;
    }

    return null;
}, {
    patchCallee: false
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('$getRepeatValue',
function() {

    /**
     * @method $getRepeatValue
     * @summary Returns the repeating data source for the receiver if the
     *     receiver is itself a 'bind:repeat'.
     * @returns {Object} The object representing the receiver's repeat value.
     *     This should be a Collection that can be iterated on.
     */

    var elem,

        repeatAttrVal,

        repeatSource,

        repeatScopeVals,
        repeatPath;

    elem = this.getNativeNode();

    //  If we successfully detected a 'bind:repeat' ancestor, then try to
    //  calculate a repeat resource and our index within that repeat resource.
    if (TP.elementHasAttribute(elem, 'bind:repeat', true)) {

        //  Try to calculate a repeat resource

        //  NB: Note how we do *not* want the getResource() call to collapse
        //  it's results for these calls - we always want a collection.

        //  If it's a URI String, then we can calculate a TP.core.URI from it
        //  and just grab that resource's value.
        if (TP.isURIString(repeatAttrVal)) {
            repeatSource = TP.uc(repeatAttrVal).getResource(
                            TP.request('shouldCollapse', false)).get('value');
        } else {

            //  Otherwise, get the 'bind:repeat' ancestor's binding scope
            //  values, compute a path from them and use that as the URI.
            repeatScopeVals = this.
                                getBindingScopeValues().concat(repeatAttrVal);
            repeatPath = TP.uriJoinFragments.apply(TP, repeatScopeVals);

            repeatSource = TP.uc(repeatPath).getResource(
                            TP.request('shouldCollapse', false)).get('value');
        }

        return repeatSource;
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('$insertRepeatRowAt',
function(indexes) {

    /**
     * @method $insertRepeatRowAt
     * @summary Insert rows at the indexes provided.
     * @description Note that the indexes supplied to this method should match
     *     the type of data source object of the repeat. If the data source of
     *     the repeat is an XML object, these indexes should be '1-based' (like
     *     XPath). If it is an JS or JSON object, these indexes should be
     *     '0-based' (like JSONPath).
     * @param {Array.<Number>} indexes An Array of Numbers that indicate the
     *     indexes of the items to insert new items at.
     * @returns {TP.core.ElementNode} The receiver.
     */

    var elem,

        templateID,
        templateInfo,

        repeatContent,

        wrapperElement,

        index,

        len,
        i,

        newElement,

        insertionPoint,

        followingScopedSiblings,
        len2,
        j,
        scopedSibling,
        scopeVal,

        firstRow,

        thisref;

    elem = this.getNativeNode();

    templateID = TP.elementGetAttribute(elem, 'tibet:templateID', true);
    if (TP.isEmpty(templateID)) {
        //  TODO: Raise an exception
        return this;
    }

    if (TP.notValid(
            templateInfo = this.getDocument().get('$repeatTemplates'))) {
        //  TODO: Raise an exception
        return this;
    }

    //  This will be a DocumentFragment that we stuffed away when the receiver
    //  was rebuilt.
    if (TP.notValid(repeatContent = templateInfo.at(templateID))) {
        return this;
    }

    //  If the repeat content's child element list has a size of 1, then we
    //  reach under there and use that element as the repeat content
    if (TP.nodeGetChildElements(repeatContent).getSize() === 1) {
        repeatContent = repeatContent.firstElementChild;
    }

    //  Whichever element has a 'tibet:nomutationtracking' attribute on it is
    //  acting as a common wrapper for the 'rows' making up the repeat. This may
    //  be a <tbody> element if we're repeating rows in a <table>, but it
    //  doesn't have to be.
    if (TP.elementHasAttribute(elem, 'tibet:nomutationtracking', true)) {
        wrapperElement = elem;
    } else {
        wrapperElement = TP.byCSSPath(
                            '> *[tibet|nomutationtracking]',
                            elem,
                            true,
                            false);
    }

    if (!TP.isElement(wrapperElement)) {
        //  TODO: Raise exception
        return;
    }

    //  Loop over all of the supplied indices
    len = indexes.getSize();
    for (i = 0; i < len; i++) {

        index = indexes.at(i);

        //  Make sure to clone the content and set it's 'bind:scope' to the
        //  index that we're inserting at.
        newElement = TP.nodeCloneNode(repeatContent);
        TP.elementSetAttribute(newElement,
                                'bind:scope',
                                '[' + index + ']',
                                true);

        //  An insertion point would be the element with the same index as the
        //  row we're inserting. If we find one, we insert the new row before
        //  that and increment the number of all numeric scoped elements *at the
        //  same level* with an index equal to or greater than the insert index.
        insertionPoint = TP.byCSSPath(
                                '> *[bind|scope="[' + index + ']"]',
                                wrapperElement,
                                true,
                                false);

        //  There was no insertion point - just append the element.
        if (!TP.isElement(insertionPoint)) {
            newElement = TP.nodeAppendChild(wrapperElement, newElement, false);
        } else {

            //  Otherwise, go ahead and insert the element and then renumber all
            //  of the ones coming after. Note the reassignment.
            newElement = TP.nodeInsertBefore(
                            wrapperElement, newElement, insertionPoint, false);

            //  Now, grab all of the scoped siblings that follow the element
            //  that we're going to insert.
            followingScopedSiblings = TP.byCSSPath(
                                        '~ *[bind|scope^="["][bind|scope$="]"]',
                                        newElement,
                                        false,
                                        false);

            //  Iterate over all of the scoped siblings and adjust their index.
            //  Note how we start by incrementing the index 1 past where we just
            //  inserted the new row. Then we set the sibling to that scope
            //  number and advance.

            len2 = followingScopedSiblings.getSize();
            for (j = 0; j < len2; j++) {

                scopedSibling = followingScopedSiblings.at(j);

                if (TP.notEmpty(scopeVal = TP.elementGetAttribute(
                                        scopedSibling, 'bind:scope', true))) {

                    if (TP.regex.SIMPLE_NUMERIC_PATH.test(scopeVal)) {

                        index += 1;
                        TP.elementSetAttribute(
                                scopedSibling,
                                'bind:scope',
                                '[' + index + ']',
                                true);
                    }
                }
            }
        }

        //  Awaken any content under the newly inserted Element.
        TP.nodeAwakenContent(newElement);

        //  Bubble any xmlns attributes upward to avoid markup clutter.
        TP.elementBubbleXMLNSAttributes(newElement);

        if (i === 0) {
            firstRow = newElement;
        }
    }

    if (TP.isElement(firstRow)) {
        //  Focus the first autofocus or focusable descendant of the new row.
        //  TODO: Should this be configurable (i.e. via another 'bind:'
        //  attribute - 'bind:focusfirst' or something).
        (function() {
            TP.wrap(firstRow).focusAutofocusedOrFirstFocusableDescendant();
        }).queueForNextRepaint(this.getNativeWindow());
    }

    //  Send a UIDidInsert with ourself as the target and the set of indexes
    //  that the insertion happened at.
    thisref = this;

    (function() {
        thisref.signal('TP.sig.UIDidInsert',
                        TP.hc('target', thisref, 'indexes', indexes));
    }).queueForNextRepaint(this.getNativeWindow());

    TP.$elementCSSFlush(elem);

    return newElement;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('isBoundElement',
function() {

    /**
     * @method isBoundElement
     * @summary Whether or not the receiver is a bound element.
     * @returns {Boolean} Whether or not the receiver is bound.
     */

    var elem;

    elem = this.getNativeNode();

    return TP.elementHasAttribute(elem, 'bind:in', true) ||
            TP.elementHasAttribute(elem, 'bind:out', true) ||
            TP.elementHasAttribute(elem, 'bind:io', true);
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('isScopingElement',
function() {

    /**
     * @method isScopingElement
     * @summary Returns whether or not the receiver is a 'scoping' element (that
     *     is, an Element containing a 'bind:scope' or 'bind:repeat').
     * @returns {Boolean} Whether or not the receiver is a scoping element.
     */

    var elem;

    elem = this.getNativeNode();

    return TP.elementHasAttribute(elem, 'bind:scope', true) ||
            TP.elementHasAttribute(elem, 'bind:repeat', true);
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('refreshBranches',
function(primarySource, aSignal, elems, initialVal, aPathType, pathParts, pathAction, isScoped) {

    var elem,

        subscopes,

        nextElems,

        boundAttrNodes,
        attrs,
        i,
        j,

        theVal,

        primaryLocMatcher,

        len,

        boundAttr,
        attrName,
        attrVal,

        ownerElem,

        isScopingElement,

        branchURI,
        branchVal,

        pathType,

        repeatScopeVals,
        repeatPath,
        repeatFragExpr,

        ownerTPElem,

        searchParts,

        partsNegativeSlice,
        predicatePhaseOneComplete,

        didProcess,

        lastPart,

        startPredIndex,
        endPredIndex,
        hasPredicate,
        predicateStmt,

        searchPath,

        branchMatcher,
        leafMatcher,

        jsonContent,

        remainderParts,

        needsRefresh,

        insideRepeatScope,

        indexes,
        newRowElem;

    elem = this.getNativeNode();

    //  TIMING: var startQuery = Date.now();

    //  Grab all of the elements that contain 'scope' or 'repeat' attributes.
    //  Note that we can't filter for the 'bind:' (TP.w3.Xmlns.BIND) namespace
    //  on those attributes here because the 'querySelectorAll' call has no
    //  namespace support :-(. It is, however, very fast. We'll filter for that
    //  later.
    subscopes = TP.ac(elem.querySelectorAll('*[*|scope], *[*|repeat]'));

    subscopes = subscopes.filter(
            function(aSubscope) {

                var k;

                //  We don't want ourself in the list
                if (aSubscope === elem) {
                    return false;
                }

                if (!elem.contains(aSubscope)) {
                    return false;
                }

                for (k = 0; k < subscopes.length; k++) {
                    if (subscopes[k] !== aSubscope &&
                        subscopes[k].contains(aSubscope)) {
                        return false;
                    }
                }

                return true;
            });

    //  Get the set of elements that are contained within the receiver, but in a
    //  'shallow' fashion - that is, 'under' the receiver but not under any
    //  nested scopes (i.e. 'bind:scope' or 'bind:repeat') that are also under
    //  the receiver.
    nextElems = elems.filter(
            function(anElem) {

                var k;

                //  We don't want ourself in the list
                if (anElem === elem) {
                    return false;
                }

                if (elem.contains(anElem)) {
                    for (k = 0; k < subscopes.length; k++) {
                        if (subscopes[k].contains(anElem)) {
                            return false;
                        }
                    }

                    return true;
                }
                return false;
            });

    nextElems = nextElems.concat(subscopes);

    //  Iterate over all of those elements containing binding attributes and
    //  grab the attribute nodes that are in the TP.w3.Xmlns.BIND namespace.
    boundAttrNodes = TP.ac();
    for (i = 0; i < nextElems.length; i++) {
        attrs = nextElems[i].attributes;

        for (j = 0; j < attrs.length; j++) {

            //  Make sure the attribute is in the binding namespace. This also
            //  accounts for the deficency of the querySelectorAll() call above.
            if (attrs[j].namespaceURI === TP.w3.Xmlns.BIND) {
                boundAttrNodes.push(attrs[j]);
            }
        }
    }

    //  Sort the attribute nodes so that 'bind:in' attributes come first. This
    //  is important when an element has both 'bind:in' and 'bind:io'
    //  attributes, since we want the 'in' bindings to be refreshed first to
    //  have that data available to the 'io' bindings.
    boundAttrNodes.sort(
        function(a, b) {

            if (a.nodeName === 'bind:in' && b.nodeName !== 'bind:in') {
                return -1;
            } else if (a.nodeName !== 'bind:in' && b.nodeName === 'bind:in') {
                return 1;
            }

            return 0;
        });

    //  TIMING: var endQuery = Date.now();
    //  TIMING: TP.totalBranchQueryTime += (endQuery - startQuery);

    if (TP.isPlainObject(initialVal)) {
        theVal = TP.hc(initialVal);
    } else {
        theVal = initialVal;
    }

    if (TP.isEmpty(pathParts)) {

        primaryLocMatcher =
            TP.rc(TP.regExpEscape(aSignal.getOrigin().getPrimaryLocation()));

        //  Loop over all of the found binding attributes.
        len = boundAttrNodes.getSize();
        for (i = 0; i < len; i++) {

            boundAttr = boundAttrNodes.at(i);

            attrName = boundAttr.localName;
            attrVal = boundAttr.value;

            ownerElem = boundAttr.ownerElement;
            ownerTPElem = TP.wrap(ownerElem);

            //  Are we processing a nested scope?

            /* eslint-disable no-extra-parens */
            isScopingElement = (attrName === 'scope' || attrName === 'repeat');
            /* eslint-enable no-extra-parens */

            if (isScopingElement) {

                if (TP.isURIString(attrVal) &&
                    !primaryLocMatcher.test(attrVal)) {
                    continue;
                }

                //  If the attribute value is a whole URI, then just grab the
                //  result of the URI and use that as the branch value to
                //  process 'the next level down' in the branching.
                if (TP.isURIString(attrVal)) {
                    branchURI = TP.uc(attrVal);
                    if (branchURI.hasFragment()) {
                        branchVal = branchURI.getResource().get('result');
                    } else {
                        branchVal = theVal;
                    }

                    //  Try to detect the type of path based on tasting the
                    //  branch value. This makes things much easier later on.
                    if (TP.isXMLNode(branchVal)) {
                        pathType = TP.ifInvalid(aPathType, TP.XPATH_PATH_TYPE);
                    } else if (TP.isKindOf(branchVal, TP.core.Node)) {
                        pathType = TP.ifInvalid(aPathType, TP.XPATH_PATH_TYPE);
                    } else if (TP.regex.JSON_POINTER.test(attrVal) ||
                                TP.regex.JSON_PATH.test(attrVal)) {
                        pathType = TP.ifInvalid(aPathType, TP.JSON_PATH_TYPE);
                    }

                } else {
                    if (TP.isArray(theVal) &&
                        theVal.first() !== TP.NULL &&
                        TP.isXMLNode(TP.unwrap(theVal.first()))) {
                        theVal.unshift(TP.NULL);
                    }

                    if (TP.isXMLNode(theVal)) {
                        branchVal = TP.wrap(theVal).get(TP.xpc(attrVal));
                        pathType = TP.ifInvalid(aPathType, TP.XPATH_PATH_TYPE);
                    } else if (TP.isKindOf(theVal, TP.core.Node)) {
                        branchVal = theVal.get(TP.xpc(attrVal));
                        pathType = TP.ifInvalid(aPathType, TP.XPATH_PATH_TYPE);
                    } else if (TP.regex.JSON_POINTER.test(attrVal) ||
                                TP.regex.JSON_PATH.test(attrVal)) {
                        if (TP.isKindOf(theVal, TP.core.JSONContent)) {
                            branchVal = TP.jpc(attrVal).executeGet(theVal);
                        } else {
                            jsonContent = TP.core.JSONContent.construct(theVal);
                            branchVal = TP.jpc(attrVal).executeGet(jsonContent);
                        }
                        pathType = TP.ifInvalid(aPathType, TP.JSON_PATH_TYPE);
                    } else if (TP.notValid(theVal)) {
                        branchVal = null;
                    } else {
                        branchVal = theVal.get(attrVal);
                    }
                }

                pathType = TP.ifInvalid(pathType, aPathType);

                if (attrName === 'repeat') {

                    if (!TP.isURIString(attrVal)) {
                        repeatScopeVals =
                            this.getBindingScopeValues().concat(attrVal);
                        repeatPath =
                            TP.uriJoinFragments.apply(TP, repeatScopeVals);
                        repeatFragExpr = TP.uc(repeatPath).getFragmentExpr();
                        TP.apc(repeatFragExpr).executeGet(primarySource);
                    }

                    //  Make sure that branchVal is an Array
                    if (!TP.isArray(branchVal)) {
                        branchVal = TP.ac(branchVal);
                    }

                    //  NB: This modifies the supplied 'elems' Array to add the
                    //  newly generated elements. They will be refreshed below.
                    ownerTPElem.$regenerateRepeat(branchVal, elems);
                    ownerTPElem.$showHideRepeatRows(branchVal);
                }

                ownerTPElem.refreshBranches(
                                primarySource, aSignal, elems, branchVal,
                                pathType, null, pathAction, true);
            } else {

                //  If we're not scoped (i.e. we're running top-level
                //  expressions) and the expression that we're processing
                //  doesn't contain ACP variables and the primary location
                //  matcher doesn't match the expression, then it's a top-level
                //  expression pointing at another data location - don't process
                //  them.
                if (!isScoped &&
                    !TP.regex.ACP_PATH_CONTAINS_VARIABLES.test(attrVal) &&
                    !primaryLocMatcher.test(attrVal)) {
                    continue;
                }

                //  Otherwise, go ahead and process this as a leaf.
                ownerTPElem.refreshLeaf(
                    primarySource, aSignal, theVal, boundAttr, aPathType);
            }
        }

    } else {

        searchParts = pathParts;

        partsNegativeSlice = 0;

        predicatePhaseOneComplete = false;

        //  Work in reverse order, trying to find the 'most specific'
        //  branching elements.
        while (TP.notEmpty(searchParts)) {

            didProcess = false;

            lastPart = searchParts.last();
            startPredIndex = lastPart.indexOf('[');

            //  Note that we don't allow statements such as '[0]' to qualify as
            //  predicates we want to process, hence looking for a '[' at a
            //  position greater than 0.
            hasPredicate = startPredIndex > 0;

            if (hasPredicate && predicatePhaseOneComplete) {
                endPredIndex = lastPart.lastIndexOf(']') + 1;
                predicateStmt = lastPart.slice(startPredIndex, endPredIndex);
                lastPart = lastPart.slice(0, startPredIndex);
                searchParts.atPut(searchParts.getSize() - 1, lastPart);
            } else {
                predicateStmt = null;
            }

            if (searchParts.getSize() > 1) {
                if (TP.isURIString(searchParts.first())) {
                    //  Has a full URL
                    searchPath = TP.uriJoinFragments.apply(TP, searchParts);
                } else if (searchParts.first().startsWith('#')) {
                    //  Starts with XPointer scheme
                    searchPath = TP.uriJoinFragments.apply(TP, searchParts);
                } else {
                    searchPath = TP.joinAccessPathParts(searchParts, aPathType);
                }
            } else {
                searchPath = searchParts.first();
            }

            //  If the search path contains a complete URL, then we build the
            //  branch matcher directly from that.
            if (TP.isURIString(searchPath) || searchPath.startsWith('#')) {
                branchMatcher =
                    TP.rc('^' + TP.regExpEscape(searchPath) + '$');
            } else {
                branchMatcher =
                    TP.rc('^(' + '(#[()a-zA-Z0-9]+)?' +
                            TP.regExpEscape(searchPath) +
                            '|.)$');
            }

            //  If there is only one search part, and it is a URI, then we've
            //  'trimmed back' to the most general part of the source URI. In
            //  that case, we only want to match 'leafs' that are looking at the
            //  'whole' URI, not all of the ones that have subparts that match.
            if (searchParts.getSize() === 1 && TP.isURIString(searchPath)) {
                leafMatcher = TP.rc('^' + TP.regExpEscape(searchPath) + '$');
            } else {
                leafMatcher = TP.rc(TP.regExpEscape(searchPath));
            }

            len = boundAttrNodes.getSize();
            for (j = 0; j < len; j++) {
                boundAttr = boundAttrNodes.at(j);

                attrName = boundAttr.localName;
                attrVal = boundAttr.value;

                ownerElem = boundAttr.ownerElement;
                ownerTPElem = TP.wrap(ownerElem);

                isScopingElement =
                        attrName === 'scope' || attrName === 'repeat';

                if (isScopingElement && branchMatcher.test(attrVal)) {

                    //  If the scoping element has a '.', then it wants to scope
                    //  to the data (probably a collection) that was supplied to
                    //  this method and is currently in theVal.
                    if (attrVal === '.') {
                        return ownerTPElem.refreshBranches(
                                primarySource, aSignal, elems, theVal,
                                aPathType, pathParts, pathAction, true);
                    }

                    if (TP.isURIString(attrVal)) {
                        branchURI = TP.uc(attrVal);
                        if (branchURI.hasFragment()) {
                            branchVal = branchURI.getResource().get('result');
                        } else {
                            branchVal = theVal;
                        }
                    } else {

                        if (TP.isArray(theVal) &&
                            theVal.first() !== TP.NULL &&
                            TP.isXMLNode(TP.unwrap(theVal.first()))) {
                            theVal.unshift(TP.NULL);
                        }

                        if (TP.isXMLNode(theVal)) {

                            branchVal = TP.wrap(theVal).get(TP.xpc(attrVal));
                            pathType = TP.ifInvalid(aPathType,
                                                    TP.XPATH_PATH_TYPE);

                        } else if (TP.isKindOf(theVal, TP.core.Node)) {

                            branchVal = theVal.get(TP.xpc(attrVal));
                            pathType = TP.ifInvalid(aPathType,
                                                    TP.XPATH_PATH_TYPE);

                        } else if (TP.regex.JSON_POINTER.test(attrVal) ||
                                    TP.regex.JSON_PATH.test(attrVal)) {

                            if (TP.isKindOf(theVal, TP.core.JSONContent)) {
                                branchVal = TP.jpc(attrVal).executeGet(theVal);
                            } else {
                                jsonContent = TP.core.JSONContent.construct(
                                                            theVal);
                                branchVal = TP.jpc(attrVal).executeGet(
                                                            jsonContent);
                            }

                            pathType = TP.ifInvalid(aPathType,
                                                    TP.JSON_PATH_TYPE);
                        } else {
                            branchVal = theVal.get(attrVal);
                            pathType = TP.ifInvalid(aPathType,
                                                    TP.TIBET_PATH_TYPE);
                        }
                    }

                    if (partsNegativeSlice === 0) {
                        remainderParts = TP.ac();
                    } else {
                        remainderParts = pathParts.slice(partsNegativeSlice);
                    }

                    pathType = TP.ifInvalid(pathType, aPathType);

                    if (hasPredicate && predicatePhaseOneComplete) {
                        remainderParts.unshift(predicateStmt);
                    }

                    needsRefresh = true;

                    insideRepeatScope =
                        TP.regex.SIMPLE_NUMERIC_PATH.test(attrVal) &&
                        TP.elementHasClass(ownerElem, 'item');

                    if ((attrName === 'repeat' || insideRepeatScope) &&
                        TP.isEmpty(remainderParts) &&
                        attrVal === searchPath) {

                        if (insideRepeatScope) {
                            ownerElem = TP.nodeDetectAncestor(
                                ownerElem,
                                function(aNode) {
                                    return TP.isElement(aNode) &&
                                            TP.elementHasAttribute(
                                                    aNode, 'bind:repeat', true);
                                });

                            ownerTPElem = TP.wrap(ownerElem);
                        }

                        indexes = aSignal.at('indexes');

                        switch (pathAction) {

                            case TP.CREATE:
                            case TP.INSERT:

                                if (TP.notEmpty(indexes)) {
                                    newRowElem =
                                        ownerTPElem.$insertRepeatRowAt(indexes);

                                    if (TP.owns(
                                        ownerTPElem, 'generatedItemCount')) {
                                        ownerTPElem.set(
                                        'generatedItemCount',
                                        ownerTPElem.get('generatedItemCount') +
                                                1);
                                    }

                                    TP.wrap(newRowElem).
                                        refreshBoundDescendants();

                                } else {

                                    ownerTPElem.empty();

                                    //  NB: This modifies the supplied 'elems'
                                    //  Array to add the newly generated
                                    //  elements. They will be refreshed below.
                                    ownerTPElem.$regenerateRepeat(
                                                    branchVal, elems);
                                    ownerTPElem.$showHideRepeatRows(branchVal);

                                    TP.wrap(ownerTPElem).
                                            refreshBoundDescendants();
                                }

                                needsRefresh = false;

                                break;

                            case TP.DELETE:

                                if (TP.notEmpty(indexes)) {
                                    ownerTPElem.$deleteRepeatRowAt(indexes);
                                    ownerTPElem.set(
                                    'generatedItemCount',
                                    ownerTPElem.get('generatedItemCount') - 1);
                                } else {
                                    ownerTPElem.empty();
                                    ownerTPElem.set('generatedItemCount', 0);
                                }

                                needsRefresh = false;

                                break;

                            default:
                                break;
                        }
                    }

                    didProcess = true;

                    if (needsRefresh) {
                        ownerTPElem.refreshBranches(
                                primarySource, aSignal, elems, branchVal,
                                pathType, remainderParts, pathAction, true);
                    } else {
                        break;
                    }

                } else if (!isScopingElement && leafMatcher.test(attrVal)) {

                    ownerTPElem.refreshLeaf(
                        primarySource, aSignal, theVal, boundAttr, aPathType);

                    didProcess = true;
                }
            }

            //  If we didn't process at least once, and the last part of the
            //  path is a simple numeric path, and there is a value at the end
            //  of that path, then we may have an insertion.
            if (!didProcess &&
                TP.regex.SIMPLE_NUMERIC_PATH.test(lastPart) &&
                TP.isDefined(branchVal = TP.wrap(theVal).get(lastPart)) &&
                (pathAction === TP.CREATE || pathAction === TP.INSERT)) {

                indexes = aSignal.at('indexes');

                if (TP.notEmpty(indexes)) {
                    newRowElem = this.$insertRepeatRowAt(indexes);
                    if (TP.owns(
                        this, 'generatedItemCount')) {
                        this.set(
                        'generatedItemCount',
                        this.get('generatedItemCount') +
                                1);
                    }

                    TP.wrap(newRowElem).refreshBoundDescendants();
                } else {

                    ownerTPElem.empty();

                    //  NB: This modifies the supplied 'elems' Array to add the
                    //  newly generated elements. They will be refreshed below.
                    ownerTPElem.$regenerateRepeat(branchVal, elems);
                    ownerTPElem.$showHideRepeatRows(branchVal);

                    TP.wrap(ownerTPElem).refreshBoundDescendants();
                }
            }

            if (hasPredicate && !predicatePhaseOneComplete) {
                predicatePhaseOneComplete = true;
            } else {
                predicatePhaseOneComplete = false;
                partsNegativeSlice--;
                searchParts = pathParts.slice(0, partsNegativeSlice);
            }
        }
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('refreshLeaf',
function(primarySource, aSignal, initialVal, bindingAttr, aPathType) {

    var facet,

        pathOptions,

        aspect,

        entry,

        exprs,
        expr,

        pathType,

        path,

        attrValue,

        info,
        infoKeys,

        sigOrigin,

        theVal,

        len,
        i,

        transformFunc,
        finalVal,

        jsonContent,

        isXMLResource,
        repeatInfo,
        repeatIndex,
        repeatSource;

    //  TIMING: var start = Date.now();

    facet = TP.ifInvalid(aSignal.at('facet'), 'value');

    attrValue = bindingAttr.value;
    info = this.getBindingInfoFrom(attrValue);

    infoKeys = info.getKeys();

    theVal = TP.collapse(initialVal);

    pathOptions = TP.hc();
    if (this.isScalarValued(aspect)) {
        pathOptions.atPut('extractWith', 'value');
    }

    if (this.isSingleValued(aspect)) {
        pathOptions.atPut('shouldCollapse', true);
    }

    len = infoKeys.getSize();
    for (i = 0; i < len; i++) {

        aspect = infoKeys.at(i);
        entry = info.at(aspect);

        //  If the facet isn't 'value', then we just set the facet using the new
        //  value extracted from the signal and continue on.
        if (facet !== 'value') {
            this.setFacet(aspect, facet, aSignal.at(TP.NEWVAL), true);
        } else {

            exprs = entry.at('dataExprs');

            if (TP.isEmpty(exprs)) {
                continue;
            }

            //  This should only have one expression. If it has more than
            //  one, then we need to raise an exception.
            if (exprs.getSize() > 1) {
                //  TODO: Raise
                continue;
            }

            //  TODO: Support more than 1 expr
            expr = exprs.at(0);

            if (TP.regex.BARENAME.test(expr)) {
                expr = 'tibet://uicanvas' + expr;
            }

            pathType = aPathType;

            if (TP.isValid(pathType)) {

                switch (pathType) {
                    case TP.XPATH_PATH_TYPE:

                        if (TP.isXMLNode(theVal) ||
                            TP.isKindOf(theVal, TP.core.Node)) {
                            //  empty
                        } else {
                            pathType = null;
                        }

                        break;

                    case TP.JSON_PATH_TYPE:
                        if (TP.isKindOf(theVal, TP.core.JSONContent)) {
                            //  empty
                        } else {
                            pathType = null;
                        }

                        break;

                    default:
                        break;
                }
            }

            if (TP.isURIString(expr)) {

                sigOrigin = aSignal.getOrigin();
                if (TP.isKindOf(sigOrigin, TP.core.URI)) {
                    finalVal = TP.uc(expr).getResource().get('result');
                } else {
                    finalVal = initialVal;
                }

            } else if (TP.isValid(pathType)) {

                switch (pathType) {

                    case TP.XPATH_PATH_TYPE:
                        path = TP.xpc(expr, pathOptions);

                        if (TP.isXMLNode(theVal)) {
                            finalVal = path.executeGet(TP.wrap(theVal));
                        } else if (TP.isKindOf(theVal, TP.core.Node)) {
                            finalVal = path.executeGet(theVal);
                        }
                        break;

                    case TP.JSON_PATH_TYPE:

                        if (!/^\$\./.test(expr)) {
                            expr = '$.' + expr;
                        }

                        path = TP.jpc(expr, pathOptions);

                        //  Because of the check above, theVal has to be a
                        //  JSONContent object here.
                        finalVal = path.executeGet(theVal);

                        break;

                    case TP.TIBET_PATH_TYPE:
                        path = TP.tpc(expr, pathOptions);

                        finalVal = path.executeGet(theVal);
                        break;

                    default:
                        finalVal = theVal.get(expr);
                        break;
                }

            } else {

                if (TP.regex.COMPOSITE_PATH.test(expr)) {
                    if (TP.isValid(entry.at('transformFunc'))) {
                        finalVal = theVal;
                    } else {
                        finalVal =
                            TP.wrap(theVal).get(TP.apc(expr, pathOptions));
                    }
                } else if (TP.regex.ACP_PATH_CONTAINS_VARIABLES.test(expr)) {
                    finalVal = theVal;
                } else if (TP.isPlainObject(theVal)) {
                    finalVal = TP.hc(theVal).get(expr);
                } else if (TP.isXMLNode(theVal)) {
                    finalVal = TP.wrap(theVal).get(TP.xpc(expr, pathOptions));
                } else if (TP.isKindOf(theVal, TP.core.Node)) {
                    finalVal = theVal.get(TP.xpc(expr, pathOptions));
                } else if (TP.regex.JSON_POINTER.test(expr) ||
                            TP.regex.JSON_PATH.test(expr)) {
                    if (TP.isKindOf(theVal, TP.core.JSONContent)) {
                        finalVal =
                            TP.jpc(expr, pathOptions).executeGet(theVal);
                    } else {
                        jsonContent = TP.core.JSONContent.construct(theVal);
                        finalVal =
                            TP.jpc(expr, pathOptions).executeGet(jsonContent);
                    }
                } else if (TP.notValid(theVal)) {
                    finalVal = null;
                } else if (TP.regex.QUOTED_CONTENT.test(expr)) {
                    finalVal = TP.regex.QUOTED_CONTENT.match(expr).at(2);
                } else {
                    finalVal = theVal.get(expr);
                }
            }

            // if (TP.notValid(finalVal) &&
            // TP.regex.ACP_PATH_CONTAINS_VARIABLES.test(expr)) {
            //  finalVal = theVal;
            // }

            if (TP.isValid(finalVal)) {
                if (TP.isCallable(transformFunc = entry.at('transformFunc'))) {

                    if (TP.isCollection(finalVal)) {
                        isXMLResource =
                            TP.isXMLNode(TP.unwrap(finalVal.first()));
                    } else {
                        isXMLResource =
                            TP.isXMLNode(TP.unwrap(finalVal));
                    }

                    //  Important for the logic in the transformation Function
                    //  to set this to NaN and let the logic below set it if it
                    //  finds it.
                    repeatIndex = NaN;

                    if (TP.isValid(
                            repeatInfo = this.$getRepeatSourceAndIndex())) {
                        repeatSource = repeatInfo.first();
                        repeatIndex = repeatInfo.last();
                    }

                    finalVal = transformFunc(
                                    aSignal.getSource(),
                                    finalVal,
                                    this,
                                    repeatSource,
                                    repeatIndex,
                                    isXMLResource);
                }
            }

            if (aspect === 'value') {
                this.setValue(finalVal, true);
            } else {
                this.setFacet(aspect, facet, finalVal, true);
            }
        }
    }

    //  TIMING: var end = Date.now();
    //  TIMING: TP.totalInitialGetTime += (end - start);

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('$regenerateRepeat',
function(aCollection, elems) {

    /**
     * @method $regenerateRepeat
     * @summary Regenerates any repeat content under the receiver, if the
     *     receiver is configured to have 'repeating content'.
     * @param {Object} aCollection The collection data model that will be used
     *     for the repeating content. Note that this method merely generates the
     *     blank repeating rows - it is up to other methods to refresh the data
     *     bindings within them.
     * @param {Element[]} elems The list of elements that the bind engine is
     *     currently processing, of which is this element. We will splice any
     *     new content that this method generates into this collection so that
     *     the engine will recursively process into this new content.
     * @returns {TP.core.ElementNode} The receiver.
     */

    var existingItemCount,

        elem,

        repeatContent,

        bodyFragment,

        isXMLResource,

        scopeIndex,

        len,
        i,

        newElement,

        newElems,
        elemIndex,
        args;

    if (TP.notValid(aCollection)) {
        return;
    }

    //  If we have already generated items and the count of those generated
    //  items is the same as the collection, then we don't need to regenerate so
    //  we can just exit here.
    if (TP.isDefined(existingItemCount = this.get('generatedItemCount'))) {
        if (existingItemCount === aCollection.getSize()) {
            return this;
        }
    }

    elem = this.getNativeNode();

    if (TP.notValid(repeatContent = this.$getRepeatTemplate())) {
        //  TODO: Raise an exception
        return this;
    }

    bodyFragment = TP.nodeGetDocument(elem).createDocumentFragment();

    //  Detect whether we're drawing GUI for model which is a chunk of XML data
    //  - we'll use this information later.
    isXMLResource = TP.isXMLNode(TP.unwrap(aCollection.first()));

    //  If the repeat content's child element list has a size of 1, then we
    //  reach under there and use that element as the repeat content
    if (TP.nodeGetChildElements(repeatContent).getSize() === 1) {
        repeatContent = repeatContent.firstElementChild;
    }

    //  Iterate over the resource and build out a chunk of markup for each
    //  item in the resource.
    len = aCollection.getSize();
    for (i = 0; i < len; i++) {

        //  Make sure to clone the content.
        newElement = TP.nodeCloneNode(repeatContent);

        //  If this is an XML resource, then we need to bump the number by 1
        //  because XPath is 1-based.
        if (isXMLResource) {
            scopeIndex = i + 1;
        } else {
            scopeIndex = i;
        }

        //  Stamp a 'bind:scope' with an attribute containing the numeric
        //  scoping index (i.e. '[2]'). This will be used in bind scoping
        //  computations.
        TP.elementSetAttribute(
                newElement, 'bind:scope', '[' + scopeIndex + ']', true);

        //  Append this new chunk of markup to the document fragment we're
        //  building up and then loop to the top to do it again.
        bodyFragment.appendChild(newElement);
    }

    //  Put an attribute on ourself that will prevent Mutation signals from
    //  being sent from content under us. This also marks us as the 'repeating
    //  body' (i.e. the element containing the repeating content).
    TP.elementSetAttribute(elem, 'tibet:nomutationtracking', true, true);

    //  Make sure to empty the repeat element of any existing content
    TP.nodeEmptyContent(elem);

    //  Finally, append the whole fragment under the receiver element
    TP.nodeAppendChild(elem, bodyFragment, false);

    //  Bubble any xmlns attributes upward to avoid markup clutter.
    TP.nodeGetElementsByTagName(elem, '*').forEach(
            function(anElem) {
                TP.elementBubbleXMLNSAttributes(anElem);
            });

    //  Awaken any content that has been inserted under this element.
    TP.nodeAwakenContent(elem);

    //  Grab any bound elements under this element. We will need to splice them
    //  into the list of elements that the engine is processing, of which we are
    //  one. This ensures that any nested binding constructs (i.e. nested
    //  repeats, for instance) are recursively processed.
    newElems = this.$getBoundElements(false);

    //  Splice the new elements just after our spot in the list of elements that
    //  the engine is currently processing.
    elemIndex = elems.indexOf(elem);
    args = TP.ac(elemIndex + 1, 0).concat(newElems);
    Array.prototype.splice.apply(elems, args);

    //  Capture how many repeating rows we generated. We'll use that to compare
    //  above to see if more rows need to be generated when the data set changes
    //  and we're called on to redraw.
    this.defineAttribute('generatedItemCount');
    this.set('generatedItemCount', aCollection.getSize());

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('$registerRepeatContent',
function() {

    /**
     * @method $registerRepeatContent
     * @summary Registers the content under the receiver as repeat content with
     *     the receiver's TP.core.Document for iteration purposes.
     * @returns {TP.core.ElementNode} The receiver.
     */

    var elem,
        doc,

        nestedRepeatElems,
        nestedRepeatTPElems,

        i,

        repeatContent,

        elemsWithIDs,
        len,
        j,
        elemWithID,

        repeatItems,

        templateID,
        templateInfo;

    elem = this.getNativeNode();

    //  If this attribute is present, then we've already register - just bail
    //  out.
    if (TP.elementHasAttribute(elem, 'tibet:templateID', true)) {
        return this;
    }

    doc = TP.nodeGetDocument(elem);

    //  Cause any repeats that haven't registered their content to grab it
    //  before we start other processing.
    //  To do this, we need any repeats that are under us (but only the ones
    //  under us, which is we need to use the filter here).
    nestedRepeatElems =
            TP.ac(doc.documentElement.querySelectorAll('*[*|repeat]'));
    nestedRepeatElems = nestedRepeatElems.filter(
                    function(anElem) {
                        return elem !== anElem && elem.contains(anElem);
                    });

    //  To avoid mutation events as register the repeat content will cause DOM
    //  modifications, we wrap all of the found 'bind:repeat' Elements at once
    //  here.
    nestedRepeatTPElems = TP.wrap(nestedRepeatElems);

    for (i = 0; i < nestedRepeatTPElems.getSize(); i++) {
        nestedRepeatTPElems.at(i).$registerRepeatContent();
    }

    //  Append a 'wrap element' as the container of the repeat content. This is
    //  especially useful if the repeat content has no root element itself and
    //  therefore we would end up with 1...n sibling nodes, which are harder to
    //  manage.
    repeatContent = TP.documentConstructElement(this.getNativeDocument(),
                                                'span',
                                                TP.w3.Xmlns.XHTML);

    //  Add a class of 'item' for easier managability.
    TP.elementAddClass(repeatContent, 'item');

    //  Strip out all 'id's on elements... if an Element has an ID, warn here.
    elemsWithIDs = TP.byCSSPath('*[id]', elem, false, false);

    //  Loop over any elements that were found with IDs.
    len = elemsWithIDs.getSize();
    for (j = 0; j < len; j++) {

        elemWithID = elemsWithIDs.at(j);

        if (!TP.elementHasGeneratedID(elemWithID)) {
            TP.ifWarn() ?
                TP.warn('Stripping ID from Element in repeat template: ' +
                        TP.str(elemWithID) + '. ' +
                        'IDs are supposed to be unique in markup.') : 0;
        }

        TP.elementRemoveAttribute(elemWithID, 'id', true);
    }

    //  Grab the childNodes of the receiver as a DocumentFragment.
    //  NOTE: This *removes* these child nodes from the receiver.
    repeatItems = TP.nodeListAsFragment(elem.childNodes);

    //  Append that DocumentFragment into our repeat content container.
    TP.nodeAppendChild(repeatContent, repeatItems, false);

    //  Generate a unique ID for our repeat content. We'll use this to register
    //  the repeat content with our TP.core.DocumentNode.
    templateID = TP.genID('bind_repeat_template');

    //  Create a registry on our TP.core.DocumentNode for repeat content if it's
    //  not already there.
    if (TP.notValid(
            templateInfo = this.getDocument().get('$repeatTemplates'))) {
        templateInfo = TP.hc();
        this.getDocument().set('$repeatTemplates', templateInfo);
    }

    //  Register our repeat content under the unique ID we generated.
    templateInfo.atPut(templateID, repeatContent);
    TP.elementSetAttribute(elem, 'tibet:templateID', templateID, true);

    return repeatContent;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('setAttrBindRepeatindex',
function(index) {

    /**
     * @method setAttrBindRepeatindex
     * @summary Sets the repeat index that the receiver will use to start
     *     repeating from.
     * @param {Number} index The index to start repeating from.
     */

    this.$setAttribute('bind:repeatindex', index);

    this.$showHideRepeatRows();

    //  setting an attribute returns void according to the spec
    return;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('setAttrBindRepeatsize',
function(size) {

    /**
     * @method setAttrBindRepeatsize
     * @summary Sets the repeat size that the receiver will use to display
     *     'pages' of repeating data.
     * @param {Number} size The size of the data 'page'.
     */

    this.$setAttribute('bind:repeatsize', size);

    this.$showHideRepeatRows();

    //  setting an attribute returns void according to the spec
    return;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('setBoundValue',
function(aValue, scopeVals, bindingInfoValue, ignoreBidiInfo) {

    /**
     * @method setBoundValue
     * @summary Sets the bound value of the receiver to the supplied value. This
     *     takes the supplied value and sets that value onto the model.
     * @param {Object} aValue The value to set onto the model.
     * @param {String[]} scopeVals The list of scoping values (i.e. parts that,
     *     when combined, make up the entire bind scoping path).
     * @param {String} bindingInfoValue A String, usually in a JSON-like format,
     *     that details the binding information for the receiver. That is, the
     *     bounds aspects of the receiver and what they're bound to.
     * @param {Boolean} [ignoreBidiInfo=false] Whether or not to ignore the
     *     receiver's bidirectional attribute information. If this parameter is
     *     true, this method will always set the bound value whether or not the
     *     bound attribute is considered to be both a getter and setter.
     * @returns {TP.core.ElementNode} The receiver.
     */

    var bindingInfo,
        bidiAttrs;

    //  Extract the binding information from the supplied binding information
    //  value String. This may have already been parsed and cached, in which
    //  case we get the cached values back.
    bindingInfo = this.getBindingInfoFrom(bindingInfoValue);

    if (TP.notTrue(ignoreBidiInfo)) {
        //  Grab the list of our 'bidirectional' instance (not DOM) attributes.
        //  This will tell us which aspects can be 'set' from GUI to model.
        bidiAttrs = this.getType().get('bidiAttrs');
    }

    //  Make sure that the receiver is configured with bidi instance attributes.
    //  If there are none, that means that we have no GUI to model capable
    //  aspects, so warn and exit here.
    if (TP.isEmpty(bidiAttrs)) {
        TP.ifWarn() ?
            TP.warn('No bidi attrs defined for bound control: ' +
                    TP.name(this) + '.') : 0;

        return this;
    }

    //  Iterate over each binding expression in the binding information.
    bindingInfo.perform(
        function(bindEntry) {

            var attrName,

                bindVal,

                dataExprs,
                i,
                dataExpr,

                allVals,
                fullExpr,

                wholeURI,
                primaryURI,

                frag,

                result,
                newValue;

            attrName = bindEntry.first();

            //  If the attribute isn't one of the bidi attributes, then we can
            //  just exit here (i.e. its not an attribute that we can 'set' from
            //  the UI)
            if (TP.notTrue(ignoreBidiInfo) &&
                !bidiAttrs.contains(attrName)) {
                return;
            }

            bindVal = bindEntry.last();

            //  There will be 1...n data expressions here. Iterate over them and
            //  compute a model reference.
            dataExprs = bindVal.at('dataExprs');
            for (i = 0; i < dataExprs.getSize(); i++) {
                dataExpr = dataExprs.at(i);

                if (TP.notEmpty(scopeVals)) {
                    //  Concatenate the binding value onto the scope values
                    //  array (thereby creating a new Array) and use it to
                    //  join all of the values together.
                    allVals = scopeVals.concat(dataExpr);
                    fullExpr = TP.uriJoinFragments.apply(TP, allVals);

                    //  If we weren't able to compute a real URI from the
                    //  fully expanded URI value, then raise an exception
                    //  and return here.
                    if (!TP.isURIString(fullExpr)) {
                        this.raise('TP.sig.InvalidURI');

                        break;
                    }

                    wholeURI = TP.uc(fullExpr);
                } else {
                    //  Scope values is empty - this is (hopefully) a fully
                    //  qualified binding expression.

                    //  If we weren't able to compute a real URI from the
                    //  fully expanded URI value, then raise an exception
                    //  and return here.
                    dataExpr = TP.trim(dataExpr);
                    if (!TP.isURIString(dataExpr) &&
                            !TP.regex.URI_FRAGMENT.test(dataExpr)) {
                        this.raise('TP.sig.InvalidURI');
                        break;
                    }

                    wholeURI = TP.uc(dataExpr);
                }

                if (!TP.isURI(wholeURI)) {
                    this.raise('TP.sig.InvalidURI');

                    break;
                }

                primaryURI = wholeURI.getPrimaryURI();
                frag = wholeURI.getFragment();

                //  Grab the result from the 'primary URI'. If the value can't
                //  be retrieved, then create an Object and set it's 'value'
                //  value to the value that we're trying to set. Then set that
                //  as the 'whole resource' of the primary URI.
                if (TP.notValid(
                        result = primaryURI.getResource().get('result'))) {

                    newValue = TP.lang.Object.construct();
                    newValue.defineAttribute('value');
                    newValue.set('value', aValue);

                    primaryURI.setResource(newValue);

                } else {

                    //  If no fragment could be computed, then we set the 'whole
                    //  value'.
                    if (TP.isEmpty(frag)) {
                        result.set('value', aValue);
                    } else {
                        //  If we got a Window wrapper as the result from the
                        //  primary URI, then we're a 'direct to GUI' binding.
                        //  Use the *whole* URI to get a reference to the
                        //  (wrapped) element and set its value.
                        if (TP.isKindOf(result, TP.core.Window)) {
                            result = wholeURI.getResource().get('result');
                            result.set('value', aValue);
                        } else {
                            result.set(TP.apc(frag), aValue);
                        }
                    }
                }
            }
        }.bind(this));

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('setBoundValueIfBound',
function(aValue) {

    /**
     * @method setBoundValueIfBound
     * @summary Sets the bound value of the receiver to the supplied value if
     *     the receiver is bound. This takes the supplied value and sets that
     *     value onto the model.
     * @description This method is a convenience wrapper for setBoundValue()
     *     that assumes that the receiver's binding scope values and binding
     *     attribute value will be used.
     * @param {Object} aValue The value to set onto the model.
     * @returns {TP.core.ElementNode} The receiver.
     */

    var elem,

        attrName;

    elem = this.getNativeNode();

    //  NB: 'bind:in' doesn't matter here - that goes 'in', these go 'out'.

    if (TP.elementHasAttribute(elem, 'bind:io', true)) {
        attrName = 'bind:io';
    } else if (TP.elementHasAttribute(elem, 'bind:out', true)) {
        attrName = 'bind:out';
    }

    if (TP.isEmpty(attrName)) {
        return this;
    }

    //  Call setBoundValue, using the supplied value and assuming our binding
    //  scope values and the value of the found binding attribute.
    this.setBoundValue(aValue,
                        this.getBindingScopeValues(),
                        this.getAttribute(attrName));

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('$showHideRepeatRows',
function(aCollection) {

    /**
     * @method $showHideRepeatRows
     * @summary This method shows or hides repeating rows based on the values of
     *     the receiver's 'bind:repeatindex' and 'bind:repeatsize' attribute
     *     values.
     * @description Note that the 'bind:repeatindex' is 1-based, so the first
     *     row is '1', not '0'. Also, this method will default the
     *     'bind:repeatsize' to the length of the collection, if one isn't
     *     specified.
     * @param {Object} aCollection The collection data model that is used for
     *     the repeating content.
     * @returns {TP.core.ElementNode} The receiver.
     */

    var elem,

        collection,
        resourceLength,

        allRepeatRows,

        startIndex,
        endIndex,
        repeatSize,

        indices,

        len,
        i;

    elem = this.getNativeNode();

    //  If a collection wasn't supplied, then go obtain the 'repeat source'.
    if (!TP.isCollection(collection = aCollection)) {
        collection = this.$getRepeatValue();
    }

    //  The maximum number of rows.
    resourceLength = collection.getSize();

    allRepeatRows = TP.byCSSPath(
                        '> *[bind|scope^="["][bind|scope$="]"]',
                        elem,
                        false,
                        false);

    //  If we have a 'bind:repeatindex', then we can compute a starting index
    //  from it.
    if (this.hasAttribute('bind:repeatindex')) {
        if (!TP.isNumber(startIndex =
                            this.getAttribute('bind:repeatindex').asNumber())) {
            startIndex = 1;
        }
    } else {
        startIndex = 1;
    }

    //  If we have a 'bind:repeatsize', then we can compute how many rows we
    //  should be displaying.
    if (this.hasAttribute('bind:repeatsize')) {

        //  If we have a 'bind:repeatsize', then we can compute an ending index
        //  from that and the startIndex
        if (TP.isNumber(repeatSize =
                        this.getAttribute('bind:repeatsize').asNumber())) {
            endIndex = startIndex + repeatSize;
        } else {
            endIndex = resourceLength - startIndex;
        }

        endIndex -= 1;
    } else {
        endIndex = resourceLength;
    }

    //  The startIndex has to be at least 1.
    startIndex = startIndex.max(1);

    //  The endIndex cannot be larger than the number of rows.
    endIndex = endIndex.min(resourceLength);

    //  Generate a list of numbers from startIndex...endIndex.
    indices = Array.generateNumericSequence(startIndex, endIndex);

    //  Itereate over all of the repeating content rows in the receiver and show
    //  or hide them, depending on whether their index exists in the numeric
    //  sequence.
    len = allRepeatRows.getSize();
    for (i = 0; i < len; i++) {

        //  NB: We add 1 here to account for the fact that our indexes are
        //  1-based, but the collection here is 0-based.
        if (indices.indexOf(i + 1) !== TP.NOT_FOUND) {
            TP.elementShow(allRepeatRows.at(i));
        } else {
            TP.elementHide(allRepeatRows.at(i));
        }
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineHandler('UIRefresh',
function(aSignal) {

    /**
     * @method handleUIRefresh
     * @summary Refreshes the receiver's bound data.
     * @param {TP.sig.UIRefresh} aSignal The signal instance which triggered
     *     this handler.
     * @returns {TP.core.ElementNode} The receiver.
     */

    this.refresh();

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('$refresh',
function(shouldRender) {

    /**
     * @method $refresh
     * @summary Updates the receiver's content by refreshing all bound aspects
     *     in the receiver.
     * @param {Boolean} [shouldRender] Whether or not to force (or not force)
     *     re-rendering if the data source changes. If not supplied, this
     *     parameter will default to true if the bound data changed and false if
     *     it didn't.
     * @returns {Boolean} Whether or not the bound value was different than the
     *     receiver already had and, therefore, truly changed.
     */

    var elem,

        attrVal,

        scopeVals,

        repeatFullExpr,
        repeatWholeURI,
        repeatResult,

        bindingInfo,

        valChanged,

        willRender;

    elem = this.getNativeNode();

    //  NB: This check is done in order of precedence of these attributes
    if (TP.elementHasAttribute(elem, 'bind:io', true)) {
        attrVal = this.getAttribute('bind:io');
    } else if (TP.elementHasAttribute(elem, 'bind:in', true)) {
        attrVal = this.getAttribute('bind:in');
    } else if (TP.elementHasAttribute(elem, 'bind:scope', true)) {
        return this.refreshBoundDescendants();
    } else if (TP.elementHasAttribute(elem, 'bind:repeat', true)) {

        scopeVals = this.getBindingScopeValues();

        repeatFullExpr = TP.uriJoinFragments.apply(TP, scopeVals);
        repeatWholeURI = TP.uc(repeatFullExpr);

        //  NB: Note how we do *not* want the getResource() call to collapse
        //  it's results here - we always want a collection.
        repeatResult = repeatWholeURI.getResource(
                        TP.request('shouldCollapse', false)).get('result');

        this.$regenerateRepeat(repeatResult, TP.ac());

        return this.refreshBoundDescendants();
    } else {
        //  If this isn't an element around one of those three attributes, then
        //  just call render() and return
        this.render();
        return this;
    }

    //  If there is no attribute value, then just return
    if (TP.isEmpty(attrVal)) {
        return this;
    }

    scopeVals = this.getBindingScopeValues();

    //  Extract the binding information from the supplied binding information
    //  value String. This may have already been parsed and cached, in which
    //  case we get the cached values back.
    bindingInfo = this.getBindingInfoFrom(attrVal);

    valChanged = false;

    //  Iterate over each binding expression in the binding information.
    bindingInfo.perform(
        function(bindEntry) {

            var aspectName,

                bindVal,

                dataExprs,
                i,
                dataExpr,

                allVals,

                fullURI,
                fullExpr,

                wholeURI,

                oldVal,

                result,

                transformFunc;

            aspectName = bindEntry.first();

            bindVal = bindEntry.last();

            //  There will be 1...n data expressions here. Iterate over them and
            //  compute a model reference.
            dataExprs = bindVal.at('dataExprs');
            for (i = 0; i < dataExprs.getSize(); i++) {
                dataExpr = TP.trim(dataExprs.at(i));

                //  If the data expression is a 'whole URI' (without a
                //  fragment), then it's not scoped no matter whether we have
                //  scoping values or not.
                if (TP.isURIString(dataExpr) &&
                    !TP.regex.URI_FRAGMENT.test(dataExpr)) {

                    //  Grab the primary URI from a URI computed from the value
                    //  expression and append a '#tibet(.)' on it (which will
                    //  retrieve the whole value).
                    fullURI = TP.uc(dataExpr);
                    fullExpr = fullURI.getPrimaryLocation() + '#tibet(.)';

                    wholeURI = TP.uc(fullExpr);
                } else if (TP.notEmpty(scopeVals)) {
                    //  Concatenate the binding value onto the scope values
                    //  array (thereby creating a new Array) and use it to
                    //  join all of the values together.
                    allVals = scopeVals.concat(dataExpr);
                    fullExpr = TP.uriJoinFragments.apply(TP, allVals);

                    //  If we weren't able to compute a real URI from the
                    //  fully expanded URI value, then raise an exception
                    //  and return here.
                    if (!TP.isURIString(fullExpr)) {
                        this.raise('TP.sig.InvalidURI');

                        break;
                    }

                    wholeURI = TP.uc(fullExpr);
                } else {
                    //  Scope values is empty - this is (hopefully) a fully
                    //  qualified binding expression.

                    //  If we weren't able to compute a real URI from the
                    //  fully expanded URI value, then raise an exception
                    //  and return here.
                    if (!TP.isURIString(dataExpr) &&
                            !TP.regex.URI_FRAGMENT.test(dataExpr)) {
                        this.raise('TP.sig.InvalidURI');
                        break;
                    }

                    wholeURI = TP.uc(dataExpr);
                }

                if (!TP.isURI(wholeURI)) {
                    this.raise('TP.sig.InvalidURI');
                    break;
                }

                oldVal = this.get(aspectName);

                //  If the content is quoted (with, specifically, quote marks at
                //  either end), then it's a literal value. The result should be
                //  that content with the quotes stripped off.
                if (TP.regex.QUOTED_CONTENT.test(dataExpr)) {
                    result = dataExpr.unquoted();
                } else {
                    //  Otherwise, it's a binding expression to a data source.
                    //  Grab the result from the URI. Then use that value to set
                    //  our value in the receiver for that particular aspect.
                    result = TP.val(wholeURI.getResource().get('result'));
                }

                if (TP.isCallable(
                            transformFunc = bindVal.at('transformFunc'))) {
                    result = transformFunc(null, result, this);
                }

                if (!TP.equal(result, oldVal)) {

                    if (aspectName === 'value') {
                        this.setValue(result);
                    } else {
                        this.setFacet(aspectName, 'value', result);
                    }

                    valChanged = true;
                }
            }
        }.bind(this));

    //  Note here how we force the value of willRender to shouldRender (no
    //  matter whether it's true or false) if shouldRender is supplied.
    if (TP.notValid(shouldRender)) {
        willRender = valChanged;
    } else {
        willRender = shouldRender;
    }

    if (willRender) {
        this.render();
    }

    return valChanged;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('refresh',
function(shouldRender) {

    /**
     * @method refresh
     * @summary Updates the receiver's content by refreshing all bound aspects
     *     in the receiver and all of the descendants of the receiver that are
     *     bound.
     * @param {Boolean} [shouldRender] Whether or not to force (or not force)
     *     re-rendering if the data source changes. If not supplied, this
     *     parameter will default to true if the bound data changed and false if
     *     it didn't.
     * @returns {Boolean} Whether or not the bound value was different than the
     *     receiver already had and, therefore, truly changed.
     */

    var retVal;

    retVal = this.$refresh(shouldRender);

    this.refreshBoundDescendants(shouldRender);

    return retVal;
});

//  ------------------------------------------------------------------------

TP.core.ElementNode.Inst.defineMethod('refreshBoundDescendants',
function(shouldRender) {

    /**
     * @method refreshBoundDescendants
     * @summary Updates bound descendants content by refreshing all bound
     *     aspects in each one.
     * @param {Boolean} [shouldRender] Whether or not to force (or not force)
     *     re-rendering if the data source changes. If not supplied, this
     *     parameter will default to true if the bound data changed and false if
     *     it didn't.
     * @returns {TP.core.ElementNode} The receiver.
     */

    var boundDescendants;

    //  Get the bound descendant elements of the receiver. Note how we pass
    //  'true' here to *just* get elements that are 'shallow'. If we pick up
    //  'scope' or 'repeat' elements, those will recursively call this method
    //  for any 'in' or 'io' elements under them.
    boundDescendants = TP.wrap(this.$getBoundElements(true));

    boundDescendants.forEach(
        function(aDescendant) {

            //  NB: We call the primitive '$refresh' call here - otherwise,
            //  we'll end up recursing. Note that, even though boundDescendants
            //  will contain 'bind:scope' and 'bind:repeat' elements at this
            //  point, they will be filtered out by this method. Their
            //  descendants, the real bind:[in|io|out] elements, will be
            //  refreshed.
            aDescendant.$refresh(shouldRender);
        });

    return this;
});

//  ------------------------------------------------------------------------
//  TP.core.UIElementNode
//  ------------------------------------------------------------------------

TP.core.UIElementNode.Inst.defineHandler('UIEdit',
function(aSignal) {

    /**
     * @method handleUIEdit
     * @summary Handles when the user wants to edit the underlying data source.
     *     For now, this method a) only works for bind:repeat and b) only uses a
     *     simple text field to allow editing.
     * @param {TP.sig.UIEdit} aSignal The signal instance which triggered
     *     this handler.
     */

    var targetElem,
        textNode,

        removeEditorAndSetValue,
        moveEditorTo,

        editor,

        keydownHandler;

    //  It is important to remember that this code is shared by all
    //  TP.core.Element nodes. Therefore, we need to use other checking logic
    //  (like whether or not we have this attribute) to see if we handle this.

    if (!this.hasAttribute('bind:repeat')) {
        return this;
    }

    //  We can handle this - stop propagation so that ancestors up the chain
    //  don't get notified.
    aSignal.stopPropagation();

    //  Compute the target element from the underlying DOM signal.
    targetElem = aSignal.getDOMTarget();

    //  If the target was a Text node, then we use its parent node.
    if (TP.isTextNode(targetElem)) {
        textNode = targetElem;
        targetElem = targetElem.parentNode;
    } else {
        textNode = targetElem.firstChild;
    }

    //  A Function that tears down the editor and sets the bound value.
    removeEditorAndSetValue = function() {

        var newText,
            newTextNode,

            boundElem,
            boundTPElem;

        //  Grab the value from the editor and create a new Text node from it.
        newText = editor.value;
        newTextNode = editor.ownerDocument.createTextNode(newText);

        //  Now, starting from the editor, we need to determine the nearest
        //  'bound element' up our chain. This is the one we'll be setting the
        //  value for.
        boundElem = TP.nodeDetectAncestor(
                        editor,
                        function(aNode) {
                            return TP.isElement(aNode) &&
                                    TP.wrap(aNode).isBoundElement();
                        });

        //  Replace the editor with the newly generated text node
        TP.nodeReplaceChild(editor.parentNode,
                            newTextNode,
                            editor,
                            false);

        //  Wrap the element that we're really setting the value for and set its
        //  bound value.
        boundTPElem = TP.wrap(boundElem);
        boundTPElem.setBoundValue(
                        newText,
                        boundTPElem.getBindingScopeValues(),
                        boundTPElem.getAttribute('bind:in'),
                        true);
    };

    //  A Function that moves the editor to the supplied Element
    moveEditorTo = function(anElem) {

        var elemTextContent,
            elemTextNode;

        //  Grab the text content from the element
        elemTextContent = TP.nodeGetTextContent(anElem);

        //  Replace the underlying text node with the editor.
        elemTextNode = anElem.firstChild;
        editor = TP.nodeReplaceChild(anElem,
                                        editor,
                                        elemTextNode,
                                        false);

        //  Set the value of the editor to the element's text content.
        editor.value = elemTextContent;

        //  Select the text in the editor, but fork to allow the GUI to
        //  refresh, which seems to help out focusing mechanics.
        setTimeout(editor.select, TP.sys.cfg('editor.select.delay', 50));
    };

    //  Replace the text node with an editor and style it.
    editor = TP.nodeReplaceTextWithEditor(textNode);
    TP.elementSetStyleString(editor, 'width: 100%; height: 100%;');

    //  Set up a 'keydown' handler on the editor.
    editor.addEventListener(
            'keydown',
            keydownHandler = function(evt) {
                var editorTargetElem,
                    editorTargetType,

                    keyName,
                    sigName,

                    repeatElem,
                    allBindIns,

                    destinationElement;

                //  NB: We don't use variables captured from the enclosing scope
                //  (except for 'editor') in this handler function, since
                //  closure semantics can cause problems. Therefore, we obtain
                //  everything from 'editor' or from the event parameter.

                //  The current target element is the parent node of the editor.
                editorTargetElem = editor.parentNode;

                //  Get the TIBET type for the editor element.
                editorTargetType = TP.wrap(editorTargetElem).getType();

                //  Grab the key name and consult the editor type's key binding
                //  map for a signal name. This will tell us whether we should
                //  just keep processing keys or move the editor or dismiss the
                //  editor.
                keyName = TP.eventGetDOMSignalName(evt);
                sigName = editorTargetType.getKeybinding(keyName);

                //  If we didn't have a mapping signal, and the key name wasn't
                //  an 'Enter' then we will just keep processing keys
                if (TP.notValid(sigName) && keyName !== 'DOM_Enter_Down') {
                    return;
                }

                //  Grab our ancestor that contains the 'bind:repeat' attribute.
                repeatElem = TP.nodeDetectAncestor(
                                editorTargetElem,
                                function(aNode) {
                                    return TP.isElement(aNode) &&
                                            TP.elementHasAttribute(
                                                aNode, 'bind:repeat', true);
                                });

                //  Grab all of the elements under the element with the
                //  'bind:repeat' that have 'bind:in' attributes.
                allBindIns = TP.byCSSPath('*[bind|in]',
                                            repeatElem,
                                            false,
                                            false);

                //  Based on the signal name, compute the element we should be
                //  going to.
                switch (sigName) {

                    case 'TP.sig.UIFocusFirst':

                        destinationElement = allBindIns.first();
                        break;

                    case 'TP.sig.UIFocusLast':

                        destinationElement = allBindIns.last();
                        break;

                    case 'TP.sig.UIFocusNext':

                        destinationElement =
                                allBindIns.after(editorTargetElem);
                        //  If we couldn't find an element following the target
                        //  element, then we wrap around to the first one.
                        if (!TP.isElement(destinationElement)) {
                            destinationElement = allBindIns.first();
                        }
                        break;

                    case 'TP.sig.UIFocusPrevious':

                        destinationElement =
                                allBindIns.before(editorTargetElem);

                        //  If we couldn't find an element preceding the target
                        //  element, then we wrap around to the last one.
                        if (!TP.isElement(destinationElement)) {
                            destinationElement = allBindIns.last();
                        }
                        break;

                    default:

                        //  No destination element could be computed - just
                        //  dismiss the editor and remove this handler. See
                        //  below.
                        destinationElement = TP.NOT_FOUND;
                        break;
                }

                //  Make sure to both prevent default and stop propagation of
                //  the native event. We don't want keypresses or keyups.
                evt.preventDefault();
                evt.stopPropagation();

                //  If we truly didn't find any destination element, then the
                //  user did something like hit Enter, which means they just
                //  wanted to dismiss the editor.
                if (destinationElement === TP.NOT_FOUND) {

                    //  Remove the editor and set the value.
                    removeEditorAndSetValue();

                    //  Remove the 'keydown' listener handler.
                    this.removeEventListener('keydown', keydownHandler, false);
                } else {

                    //  Otherwise, the user wants to move the editor to another
                    //  element.

                    //  Remove the editor and set the value.
                    removeEditorAndSetValue();

                    //  Move the editor to the destination element.
                    moveEditorTo(destinationElement);
                }
            });

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
