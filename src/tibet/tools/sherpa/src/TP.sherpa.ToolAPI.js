//  ------------------------------------------------------------------------
//  Tool API traits
//  ------------------------------------------------------------------------

TP.lang.Object.defineSubtype('sherpa.ToolAPI');

//  ------------------------------------------------------------------------

TP.sherpa.ToolAPI.Inst.defineMethod('getConfigForTool',
function(toolName, options) {

    /**
     * @method getConfigForTool
     * @summary
     * @returns
     */

    var methodName;

    methodName = 'getConfigFor' + toolName.asTitleCase();
    if (TP.canInvoke(this, methodName)) {
        return this[methodName](options);
    }

    return TP.hc();
});

//  ------------------------------------------------------------------------

TP.sherpa.ToolAPI.Inst.defineMethod('getContentForTool',
function(toolName, options) {

    /**
     * @method getContentForTool
     * @summary
     * @returns
     */

    var methodName;

    methodName = 'getContentFor' + toolName.asTitleCase();
    if (TP.canInvoke(this, methodName)) {
        return this[methodName](options);
    }

    //  TODO: As a fallback, we do a this.as(toolName + 'Content')
});

//  ------------------------------------------------------------------------
//  Assistant
//  ------------------------------------------------------------------------

TP.definePrimitive('getAssistantTPElement',
function(anObject) {

    if (TP.canInvoke(anObject, 'getAssistantTPElement')) {
        return anObject.getAssistantTPElement();
    }

    return null;
});

//  ------------------------------------------------------------------------
//  Editor
//  ------------------------------------------------------------------------

TP.definePrimitive('getAspectObjectForEditorNamed',
function(anObject, anAspectName) {

    if (TP.canInvoke(anObject, 'getAspectObjectForEditorNamed')) {
        return anObject.getAspectObjectForEditorNamed(anAspectName);
    }

    return anObject;
});

//  ------------------------------------------------------------------------

TP.definePrimitive('getDefaultAspectObjectForEditor',
function(anObject) {

    if (TP.canInvoke(anObject, 'getDefaultAspectObjectForEditor')) {
        return anObject.getDefaultAspectObjectForEditor();
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.definePrimitive('getContentForEditor',
function(anObject) {

    if (TP.canInvoke(anObject, 'getContentForEditor')) {
        return anObject.getContentForEditor();
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.sherpa.ToolAPI.Inst.defineMethod('getContentForEditor',
function(options) {

    /**
     * @method getContentForEditor
     * @summary
     * @returns
     */

    var targetID;

    targetID = options.at('targetID');

    return TP.xhtmlnode('<textarea>' + this.get(targetID) + '</textarea>');
});

//  ------------------------------------------------------------------------
//  Inspector
//  ------------------------------------------------------------------------

TP.sherpa.ToolAPI.Inst.defineMethod('getConfigForInspector',
function(options) {

    /**
     * @method getConfigForInspector
     * @summary
     * @returns
     */

    return TP.hc();
});

//  ------------------------------------------------------------------------

TP.sherpa.ToolAPI.Inst.defineMethod('getContentForInspector',
function(options) {

    /**
     * @method getContentForInspector
     * @summary
     * @returns
     */

    var targetID,
        data,
        dataURI,

        contentElem;

    targetID = options.at('targetID');

    if (targetID === this.getID()) {

        data = this.getDataForInspector(options);

        dataURI = TP.uc(options.at('bindLoc'));
        dataURI.setResource(data);

        return TP.elem('<sherpa:navlist bind:in="' + dataURI.asString() + '"/>');
    }

    contentElem = TP.xhtmlnode(
                '<div>' +
                '<textarea><![CDATA[' + this.get(targetID) + ']]></textarea>' +
                '</div>');

    if (!TP.isElement(contentElem)) {

        contentElem = TP.xhtmlnode(
                '<div>' +
                    '<textarea>' +
                        TP.xmlLiteralsToEntities(this.get(targetID)) +
                    '</textarea>' +
                '</div>');

    }

    return contentElem;
});

//  ------------------------------------------------------------------------

TP.sherpa.ToolAPI.Inst.defineMethod('getDataForInspector',
function(options) {

    /**
     * @method getDataForInspector
     * @summary
     * @returns
     */

    return TP.keys(this);
});

//  ------------------------------------------------------------------------

TP.sherpa.ToolAPI.Inst.defineMethod('resolveIDForInspector',
function(anID, options) {

    /**
     * @method resolveIDForInspector
     * @summary
     * @returns
     */

    return this;
});

//  ------------------------------------------------------------------------
//  Context Menu
//  ------------------------------------------------------------------------

TP.sherpa.ToolAPI.Inst.defineMethod('getContentForContextMenu',
function(options) {

    /**
     * @method getContentForContextMenu
     * @summary
     * @returns
     */

    return TP.elem('<sherpa:haloMenuContent/>');
});

//  ========================================================================
//  Function Additions
//  ========================================================================

Function.Inst.defineMethod('getContentForEditor',
function(options) {

    /**
     * @method getContentForEditor
     * @summary
     * @returns
     */

    var methodEditorTPElem;

    if (TP.isMethod(this)) {

        methodEditorTPElem = TP.sherpa.methodeditor.getResourceElement(
                                'template',
                                TP.ietf.Mime.XHTML);

        return TP.unwrap(methodEditorTPElem);
    }

    return null;
});

//  ========================================================================
//  TP.core.URI Additions
//  ========================================================================

TP.core.URI.Inst.defineMethod('getContentForEditor',
function(options) {

    /**
     * @method getContentForEditor
     * @summary
     * @returns
     */

    var uriEditorTPElem;

    uriEditorTPElem = TP.sherpa.urieditor.getResourceElement(
                            'template',
                            TP.ietf.Mime.XHTML);

    return TP.unwrap(uriEditorTPElem);
});

//  ========================================================================
//  TP.core.CustomTag Additions
//  ========================================================================

TP.core.CustomTag.addTraits(TP.sherpa.ToolAPI);

//  ------------------------------------------------------------------------

TP.core.CustomTag.Inst.defineMethod('getDataForInspector',
function(options) {

    /**
     * @method getDataForInspector
     * @summary
     * @returns
     */

    var targetID;

    targetID = options.at('targetID');

    if (targetID === this.getID()) {

        return TP.ac('Structure', 'Style', 'Tests');

    } else if (targetID === 'Structure') {

        //  NB: We're returning the TP.core.URI instance itself here.
        return this.getType().getResourceURI('template');

    } else if (targetID === 'Style') {

        //  NB: We're returning the TP.core.URI instance itself here.
        return this.getType().getResourceURI('style');
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.core.CustomTag.Inst.defineMethod('getContentForInspector',
function(options) {

    var targetID,
        data,
        dataURI,

        uriEditorTPElem;

    targetID = options.at('targetID');

    data = this.getDataForInspector(options);

    dataURI = TP.uc(options.at('bindLoc'));
    dataURI.setResource(data);

    if (targetID === this.getID()) {

        return TP.elem('<sherpa:navlist bind:in="' + dataURI.asString() + '"/>');

    } else if (targetID === 'Structure' || targetID === 'Style') {

        uriEditorTPElem = TP.sherpa.urieditor.getResourceElement(
                            'template',
                            TP.ietf.Mime.XHTML);
        uriEditorTPElem = uriEditorTPElem.clone();

        uriEditorTPElem.setAttribute('bind:in', dataURI.asString());

        return TP.unwrap(uriEditorTPElem);
    }

    return TP.xhtmlnode('<div>' +
                        '<textarea>' + this.get(targetID) + '</textarea>' +
                        '</div>');
});

//  ========================================================================
//  TP.core.TemplatedTag Additions
//  ========================================================================

TP.core.TemplatedTag.Inst.defineMethod('getDefaultAspectObjectForEditor',
function() {

    /**
     * @method
     * @summary
     * @returns
     */

    return this.getType().getResourceURI('template', TP.ietf.Mime.XHTML);
});

//  ------------------------------------------------------------------------

TP.core.TemplatedTag.Inst.defineMethod('getAspectObjectForEditorNamed',
function(anAspectName) {

    /**
     * @method
     * @summary
     * @returns
     */

    switch (anAspectName) {

        case 'structure':
            return this.getType().getResourceURI('template', TP.ietf.Mime.XHTML);

        case 'style':
            return this.getType().getResourceURI('style', TP.ietf.Mime.CSS);

        default:
            break;
    }

    return null;
});

//  ========================================================================
//  TP.core.CompiledTag Additions
//  ========================================================================

TP.core.CompiledTag.Inst.defineMethod('getDataForInspector',
function(options) {

    /**
     * @method getDataForInspector
     * @summary
     * @returns
     */

    var targetID,
        ourType;

    targetID = options.at('targetID');

    if (targetID === 'Structure') {

        ourType = this.getType();

        if (TP.owns(ourType, 'tagCompile')) {
            return ourType.tagCompile;
        }
    }

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.core.CompiledTag.Inst.defineMethod('getDefaultAspectObjectForEditor',
function() {

    /**
     * @method
     * @summary
     * @returns
     */

    var ourType;

    ourType = this.getType();

    if (TP.owns(ourType, 'tagCompile')) {
        return ourType.tagCompile;
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.core.CompiledTag.Inst.defineMethod('getAspectObjectForEditorNamed',
function(anAspectName) {

    /**
     * @method
     * @summary
     * @returns
     */

    switch (anAspectName) {

        case 'structure':
            return this.getDefaultAspectObjectForEditor();

        case 'style':
            return this.getType().getResourceURI('template', TP.ietf.Mime.CSS);

        default:
            break;
    }

    return null;
});

//  ========================================================================
//  TP.tsh.Element Additions
//  ========================================================================

TP.tsh.Element.Inst.defineMethod('getDefaultAspectObjectForEditor',
function() {

    /**
     * @method
     * @summary
     * @returns
     */

    var ourType;

    ourType = this.getType();

    if (TP.owns(ourType, 'tshExecute')) {
        return ourType.tshExecute;
    }

    return null;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
