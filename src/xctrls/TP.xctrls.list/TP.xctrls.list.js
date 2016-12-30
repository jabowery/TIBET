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
 * @type {TP.xctrls.list}
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('xctrls:list');

TP.xctrls.list.addTraits(TP.xctrls.Element, TP.core.TemplatedNode);

TP.xctrls.list.addTraits(TP.core.SelectingUIElementNode);
TP.xctrls.list.addTraits(TP.core.D3VirtualList);

TP.xctrls.list.Inst.resolveTrait('select', TP.core.SelectingUIElementNode);
TP.xctrls.list.Inst.resolveTrait('render', TP.core.D3VirtualList);

//  Note how this property is TYPE_LOCAL, by design.
TP.xctrls.list.defineAttribute('themeURI', TP.NO_RESULT);

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

TP.xctrls.list.Type.defineAttribute('opaqueSignalNames',
        TP.ac('TP.sig.DOMMouseDown',
                'TP.sig.DOMMouseUp',
                'TP.sig.DOMMouseOver',
                'TP.sig.DOMMouseOut',
                'TP.sig.DOMFocus',
                'TP.sig.DOMBlur'));

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.xctrls.list.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @method tagAttachDOM
     * @summary Sets up runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        tpElem;

    this.callNextMethod();

    //  Make sure that we have a node to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception
        return;
    }

    //  If we're disabled, make sure our group is too - that's what the focus
    //  management system is going to be looking at.
    if (TP.elementHasAttribute(elem, 'disabled', true)) {
        tpElem = TP.wrap(elem);
        tpElem.get('group').setAttribute('disabled', true);
    }

    return;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Type.defineMethod('tagDetachDOM',
function(aRequest) {

    /**
     * @method tagDetachDOM
     * @summary Sets up runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        tpElem;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have a node to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception
        return;
    }

    tpElem = TP.wrap(elem);

    //  We signed up with ourself for resize signals when our stylesheet was
    //  ready. We're going away now, so we need to clean up.
    tpElem.ignore(tpElem, 'TP.sig.DOMResize');

    return;
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineAttribute(
    'scroller',
    {value: TP.cpc('> .scroller', TP.hc('shouldCollapse', true))});

TP.xctrls.list.Inst.defineAttribute(
    'listcontent',
    {value: TP.cpc('> .scroller .content', TP.hc('shouldCollapse', true))});

TP.xctrls.list.Inst.defineAttribute(
    'listitems',
    {value: TP.cpc('> .scroller .content xctrls|listitem', TP.hc('shouldCollapse', false))});

TP.xctrls.list.Inst.defineAttribute(
    'group',
    {value: TP.cpc('> .scroller > tibet|group', TP.hc('shouldCollapse', true))});

TP.xctrls.list.Inst.defineAttribute(
    'focusedItem',
    {value: TP.cpc('> .scroller xctrls|listitem[pclass|focus]', TP.hc('shouldCollapse', true))});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('focus',
function(moveAction) {

    /**
     * @method focus
     * @summary Focuses the receiver for keyboard input.
     * @param {Constant} moveAction The type of 'move' that the user requested.
     *     This can be one of the following:
     *          TP.FIRST
     *          TP.LAST
     *          TP.NEXT
     *          TP.PREVIOUS
     *          TP.FIRST_IN_GROUP
     *          TP.LAST_IN_GROUP
     *          TP.FIRST_IN_NEXT_GROUP
     *          TP.FIRST_IN_PREVIOUS_GROUP
     *          TP.FOLLOWING
     *          TP.PRECEDING
     * @returns {TP.xctrls.list} The receiver.
     */

    //  We're not a valid focus target, but our group is.
    return this.get('group').focus(moveAction);
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('getDisplayValue',
function() {

    /**
     * @method getDisplayValue
     * @summary Returns the selected value of the select list. This corresponds
     *     to the value of the currently selected item or items.
     * @exception TP.sig.InvalidValueElements
     * @returns {String|Array} A String containing the selected value or an
     *     Array of zero or more selected values if the receiver is set up to
     *     allow multiple selections.
     */

    var selectionModel,
        entryArray;

    selectionModel = this.getSelectionModel();

    entryArray = TP.ifInvalid(selectionModel.at('value'), TP.ac());

    if (!this.allowsMultiples()) {
        return entryArray.first();
    }

    return entryArray;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('getValue',
function() {

    /**
     * @method getValue
     * @summary Returns the value of the receiver. For a UI element this method
     *     will ensure any storage formatters are invoked.
     * @returns {String} The value in string form.
     */

    var value,

        type,
        formats;

    value = this.getDisplayValue();

    //  Given that this type can represent multiple items, it may return an
    //  Array. We should check to make sure the Array isn't empty before doing
    //  any more work.
    if (TP.notEmpty(value)) {

        //  If the receiver has a 'ui:type' attribute, then try first to convert
        //  the content to that type before trying to format it.
        if (TP.notEmpty(type = this.getAttribute('ui:type'))) {
            if (!TP.isType(type = TP.sys.getTypeByName(type))) {
                return this.raise('TP.sig.InvalidType');
            } else {
                value = type.fromString(value);
            }
        }

        //  If the receiver has a 'ui:storage' attribute, then format the return
        //  value according to the formats found there.
        //  the content to that type before trying to format it.
        if (TP.notEmpty(formats = this.getAttribute('ui:storage'))) {
            value = this.$formatValue(value, formats);
        }
    }

    return value;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineHandler('DOMResize',
function(aSignal) {

    /**
     * @method handleDOMResize
     * @param {TP.sig.DOMResize} aSignal The signal that caused this handler to
     *     trip.
     * @returns {TP.xctrls.list} The receiver.
     */

    //  When we resize, we have to re-render. The number of rows changed.
    this.render();

    return this;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineHandler('UIDeactivate',
function(aSignal) {

    /**
     * @method handleUIDeactivate
     * @param {TP.sig.UIDeactivate} aSignal The signal that caused this handler
     *     to trip.
     */

    var domTarget,
        wrappedDOMTarget,

        valueTPElem,
        value;

	//  Make sure that we stop propagation here so that we don't get any more
	//	responders further up in the chain processing this.
    aSignal.shouldStop(true);

    //  Get the resolved DOM target - this should be the list item that was
    //  deactivated (i.e. because of a mouse up or a Enter key up, etc)
    domTarget = aSignal.getResolvedDOMTarget();

    //  Wrap it and if it's actually us (the list - maybe because the user
    //  clicked in a tiny area that doesn't contain a list item), we're not
    //  interested.
    wrappedDOMTarget = TP.wrap(domTarget);
    if (wrappedDOMTarget === this) {
        return;
    }

    //  If the DOM target has either a 'spacer' or 'category' attribute, then
    //  we're not interested in adding or removing it from the selection - exit
    //  here.
    if (TP.elementHasAttribute(domTarget, 'spacer', true) ||
        TP.elementHasAttribute(domTarget, 'category', true)) {
        return this;
    }

    //  Grab the value element of the list item.
    valueTPElem = wrappedDOMTarget.get('xctrls|value');
    if (TP.notValid(valueTPElem)) {
        return;
    }

    //  And it's text content.
    value = valueTPElem.getTextContent();

    //  If the item was already selected, then deselect the value. Otherwise,
    //  select it.
    if (TP.elementHasAttribute(domTarget, 'pclass:selected', true)) {
        this.deselect(value);
    } else {
        this.select(value);
    }

    return;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('isScalarValued',
function(aspectName) {

    /**
     * @method isScalarValued
     * @summary Returns true if the receiver deals with scalar values.
     * @description See the TP.core.Node's 'isScalarValued()' instance method
     *     for more information.
     * @param {String} [aspectName] An optional aspect name that is being used
     *     by the caller to determine whether the receiver is scalar valued for.
     * @returns {Boolean} For input types, this returns true.
     */

    return true;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('$refreshSelectionModelFor',
function(anAspect) {

    /**
     * @method $refreshSelectionModelFor
     * @summary Refreshes the underlying selection model based on state settings
     *     in the UI.
     * @description Note that the aspect can be one of the following:
     *          'value'     ->  The value of the element (the default)
     * @param {String} anAspect The property of the elements to use to
     *      determine which elements should be selected.
     * @returns {TP.xctrls.list} The receiver.
     */

    var selectionModel,
        selectAll,

        aspect,

        valueEntry;

    //  Grab the selection model.
    selectionModel = this.getSelectionModel();

    //  If it has a TP.ALL key, then we add the entire content of the data to
    //  the selection model. This method is typically called by the
    //  removeSelection method and it means that it needs the whole list of data
    //  (if they're all selected) so that it can individually remove items from
    //  it.
    selectAll = this.getSelectionModel().hasKey(TP.ALL);
    if (selectAll) {

        //  We default the aspect to 'value'
        aspect = TP.ifInvalid(anAspect, 'value');

        //  Empty the selection model in preparation for rebuilding it with
        //  individual items registered under the 'value' aspect.
        selectionModel.empty();

        //  Copy the data Array
        valueEntry = TP.copy(this.get('data'));

        //  Remove any 'category' or 'spacer' data rows. This is ok because the
        //  removeSelection method works on the *values*, not the indices.
        valueEntry = valueEntry.select(
                        function(anItem) {
                            if (/^category/.test(anItem) ||
                                /^spacer/.test(anItem)) {
                                return false;
                            }

                            return true;
                        });

        selectionModel.atPut(aspect, valueEntry);
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('scrollAndComputeFocusElement',
function(moveAction) {

    /**
     * @method scrollAndComputeFocusElement
     * @summary Scroll to a particular row based on the supplied move action and
     *     re-render the receiver.
     * @param {Constant} moveAction The type of 'move' that the user requested.
     *     This can be one of the following:
     *          TP.FIRST
     *          TP.LAST
     *          TP.NEXT
     *          TP.PREVIOUS
     *          TP.FIRST_IN_GROUP
     *          TP.LAST_IN_GROUP
     *          TP.FIRST_IN_NEXT_GROUP
     *          TP.FIRST_IN_PREVIOUS_GROUP
     *          TP.FOLLOWING
     *          TP.PRECEDING
     * @returns {TP.xctrls.list} The receiver.
     */

    var lastDataItemIndex,

        currentFocusedTPElem,

        pageSize,

        startIndex,
        endIndex,

        listTPElems,

        firstVisualItem,
        lastVisualItem,

        successorTPElem,

        focusRowNum;

    lastDataItemIndex = this.get('data').getSize() - 1;

    currentFocusedTPElem = this.get('focusedItem');
    listTPElems = this.get('listitems');

    pageSize = this.getPageSize();

    startIndex = this.getStartIndex();
    endIndex = startIndex + pageSize - 1;

    firstVisualItem = listTPElems.at(0);

    if (endIndex === lastDataItemIndex) {
        lastVisualItem = listTPElems.last();
    } else {
        lastVisualItem = listTPElems.at(listTPElems.getSize() - 2);
    }

    successorTPElem = null;

    switch (moveAction) {
        case TP.FIRST:

            this.scrollTopToRow(0);
            this.render();
            listTPElems = this.get('listitems');
            successorTPElem = listTPElems.first();
            break;

        case TP.LAST:

            this.scrollTopToRow(lastDataItemIndex);
            this.render();
            listTPElems = this.get('listitems');
            successorTPElem = listTPElems.last();
            break;

        case TP.FIRST_IN_GROUP:

            focusRowNum = (startIndex - pageSize).max(0);

            this.scrollTopToRow(focusRowNum);
            this.render();
            listTPElems = this.get('listitems');
            successorTPElem = listTPElems.first();
            break;

        case TP.LAST_IN_GROUP:

            /* eslint-disable no-extra-parens */
            focusRowNum = (startIndex + pageSize).min(
                                        (lastDataItemIndex + 1) - pageSize);
            /* eslint-enable no-extra-parens */

            this.scrollTopToRow(focusRowNum + (pageSize - 1));
            this.render();
            listTPElems = this.get('listitems');
            successorTPElem = listTPElems.first();
            break;

        case TP.NEXT:

            if (currentFocusedTPElem === lastVisualItem) {
                if (endIndex < lastDataItemIndex) {
                    this.scrollTopToRow(endIndex + 1);
                    this.render();
                    //  NB: We don't compute a new successor focus element here.
                    //  By returning null, we will force our supertype to
                    //  compute it.
                } else {
                    this.scrollTopToRow(0);
                    this.render();
                    listTPElems = this.get('listitems');
                    successorTPElem = listTPElems.first();
                }
            }
            break;

        case TP.PREVIOUS:

            if (currentFocusedTPElem === firstVisualItem) {
                if (startIndex > 0) {
                    this.scrollTopToRow(startIndex - 1);
                    this.render();
                    //  NB: We don't compute a new successor focus element here.
                    //  By returning null, we will force our supertype to
                    //  compute it.
                } else {
                    this.scrollTopToRow(lastDataItemIndex);
                    this.render();
                    listTPElems = this.get('listitems');
                    successorTPElem = listTPElems.last();
                }
            }
            break;

        default:
            break;
    }

    return successorTPElem;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('scrollTopToRow',
function(rowNum) {

    /**
     * @method scrollTopToRow
     * @summary Scroll the 'top' of the receiver to the row provided.
     * @param {Number} rowNum The number of the row to scroll to.
     * @exception TP.sig.InvalidParameter
     * @returns {TP.xctrls.list} The receiver.
     */

    var elem,
        rowHeight,
        displayedRows,

        startIndex,

        scrollAmount;

    if (!TP.isNumber(rowNum)) {
        return this.raise('TP.sig.InvalidParameter');
    }

    elem = this.getNativeNode();

    rowHeight = this.getRowHeight();

    //  The current starting row is whatever our current scrollTop setting is
    //  divided by our row height.
    startIndex = (elem.scrollTop / rowHeight).floor();

    //  And the number of rows we're currently displaying is our overall element
    //  divided by our row height.
    displayedRows = (this.getHeight() / rowHeight).floor();

    if (rowNum === 0) {
        scrollAmount = 0;
    } else if (rowNum < startIndex + 1) {
        //  It's above the scrollable area - scroll up
        scrollAmount = rowNum * rowHeight;
    } else if (rowNum > startIndex + displayedRows - 1) {
        //  It's below the scrollable area - scroll down
        scrollAmount = (rowNum - displayedRows + 1) * rowHeight;
    } else {
        return this;
    }

    //  Adjust the scrolling amount and call the receiver's internal rendering
    //  method.
    elem.scrollTop = scrollAmount;

    return this;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('setAttrDisabled',
function(beDisabled) {

    /**
     * @method setAttrDisabled
     * @summary The setter for the receiver's disabled state.
     * @param {Boolean} beDisabled Whether or not the receiver is in a disabled
     *     state.
     * @returns {Boolean} Whether the receiver's state is disabled.
     */

    this.get('group').setAttrDisabled(beDisabled);

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('setData',
function(aDataObject) {

    /**
     * @method setData
     * @summary Sets the receiver's data object to the supplied object.
     * @param {Object} aDataObject The object to set the receiver's internal
     *     data to.
     * @returns {TP.xctrls.list} The receiver.
     */

    var data;

    data = aDataObject;

    //  If we have a hash as our data, this will convert it into an Array of
    //  ordered pairs (i.e. an Array of Arrays) where the first item in each
    //  Array is the key and the second item is the value.
    if (TP.isHash(data)) {
        data = data.getPairs();
    }

    this.$set('data', data);

    return this;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('setDisplayValue',
function(aValue) {

    /**
     * @method setDisplayValue
     * @summary Sets the receivers' value to the value provided (if it matches
     *     the value of an item in the group). Note that any selected items not
     *     provided in aValue are cleared, which is different than the behavior
     *     of selectValue() which simply adds the new selected items to the
     *     existing selection.
     * @param {Object} aValue The value to set (select) in the receiver. For a
     *     select list this might be an array.
     * @exception TP.sig.InvalidValueElements
     * @returns {TP.xctrls.list} The receiver.
     */

    var separator,
        value,

        allowsMultiples,

        data,

        selectionEntry,

        leni,
        i,

        lenj,
        j,

        dirty,
        currentEntry;

    //  empty value means clear any selection(s)
    if (TP.isEmpty(aValue)) {
        return this.deselectAll();
    }

    separator = TP.ifEmpty(this.getAttribute('bind:separator'),
                            TP.sys.cfg('bind.value_separator'));

    value = aValue;

    //  If the value is an Array and has a size of 1, just use that item.
    //  Otherwise, turn the Array into String representations of the objects it
    //  contains.
    if (TP.isArray(value)) {
        if (value.getSize() === 1) {
            value = value.first();
        } else {

            //  Iterate over each item, getting it's String value and possibly
            //  making a new nested Array by splitting on any separator if it
            //  exists.
            value = value.collect(
                            function(aVal) {
                                var val;

                                val = TP.str(aVal);
                                val = val.split(separator).collapse();

                                return val;
                            });

            //  Make sure to flatten the resultant Array.
            value = value.flatten();
        }
    } else {

        if (TP.isPlainObject(value)) {
            value = TP.hc(value);
        }

        if (TP.isHash(value)) {
            value = value.getValues();
        }
    }

    if (TP.isString(value)) {
        value = value.split(separator).collapse();
    }

    allowsMultiples = this.allowsMultiples();

    //  watch for multiple selection issues
    if (TP.isArray(value) && !allowsMultiples) {
        value = value.at(0);
    }

    selectionEntry = TP.ac();

    data = this.get('data');

    leni = data.getSize();

    //  If our data is an Array of Arrays, grab the last element in each Array
    //  (because that's what we consider the 'value').
    if (TP.isArray(data.first())) {

        //  Collect up all of the values that could be considered the 'value'
        data = data.collect(
                    function(anArr) {
                        return anArr.last();
                    });
    }

    if (TP.isArray(value)) {

        for (i = 0; i < leni; i++) {

            lenj = value.getSize();
            for (j = 0; j < lenj; j++) {
                if (data.at(i) === value.at(j)) {
                    selectionEntry.push(value.at(j));
                    if (!allowsMultiples) {
                        break;
                    }
                }
            }

            if (dirty && !allowsMultiples) {
                break;
            }
        }

    } else {

        for (i = 0; i < leni; i++) {

            if (data.at(i) === value) {
                selectionEntry.push(value);
                if (!allowsMultiples) {
                    break;
                }
            }
        }
    }

    dirty = false;

    currentEntry = this.getSelectionModel().at('value');
    if (!TP.equal(currentEntry, selectionEntry)) {
        dirty = true;
    }

    if (dirty) {
        this.getSelectionModel().atPut('value', selectionEntry);

        if (TP.isEmpty(selectionEntry)) {
            this.deselectAll();
        } else {
            this.render();
        }

        this.changed('selection', TP.UPDATE);
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('setValue',
function(aValue, shouldSignal) {

    /**
     * @method setValue
     * @summary Sets the value of the receiver's node. For a UI element this
     *     method will ensure any display formatters are invoked. NOTE that this
     *     method does not update the receiver's bound value if it's a bound
     *     control. In fact, this method is used in response to a change in the
     *     bound value to update the display value, so this method should avoid
     *     changes to the bound value to avoid recursions.
     * @param {Object} aValue The value to set the 'value' of the node to.
     * @param {Boolean} shouldSignal Should changes be notified. If false
     *     changes are not signaled. Defaults to this.shouldSignalChange().
     * @returns {TP.xctrls.list} The receiver.
     */

    var oldValue,
        newValue,

        flag;

    oldValue = this.getValue();

    newValue = this.produceValue('value', aValue);

    //  If the values are equal, there's nothing to do here - bail out.
    if (TP.equal(TP.str(oldValue), TP.str(newValue))) {
        return this;
    }

    this.setDisplayValue(newValue);

    //  signal as needed

    //  NB: Use this construct this way for better performance
    if (TP.notValid(flag = shouldSignal)) {
        flag = this.shouldSignalChange();
    }

    if (flag) {
        this.changed('value', TP.UPDATE,
                        TP.hc(TP.OLDVAL, oldValue, TP.NEWVAL, newValue));
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('stylesheetReady',
function(aStyleTPElem) {

    /**
     * @method stylesheetReady
     * @summary A method that is invoked when the supplied stylesheet is
     *     'ready', which means that it's attached to the receiver's Document
     *     and all of it's style has been parsed and applied.
     * @description Typically, the supplied stylesheet Element is the one that
     *     the receiver is waiting for so that it can finalized style
     *     computations. This could be either the receiver's 'core' stylesheet
     *     or it's current 'theme' stylesheet, if the receiver is executing in a
     *     themed environment.
     * @param {TP.html.style} aStyleTPElem The XHTML 'style' element that is
     *     ready.
     * @returns {TP.xctrls.list} The receiver.
     */

    //  When our stylesheet is ready, we observe ourself for when we're resized
    //  (and call render from there).
    this.observe(this, 'TP.sig.DOMResize');

    //  Call render one-time to get things going.
    this.render();

    return this;
});

//  ------------------------------------------------------------------------
//  TP.core.D3Tag Methods
//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('buildNewContent',
function(enterSelection) {

    /**
     * @method buildNewContent
     * @summary Builds new content onto the receiver by appending or inserting
     *     content into the supplied d3.js 'enter selection'.
     * @param {TP.extern.d3.selection} enterSelection The d3.js enter selection
     *     that new content should be appended to.
     * @returns {TP.core.D3Tag} The receiver.
     */

    var data,

        attrSelectionInfo,
        newContent,

        selectedValues,
        selectAll,

        groupID;

    data = this.get('data');

    attrSelectionInfo = this.getRowAttrSelectionInfo();

    newContent = enterSelection.append('xctrls:listitem').attr(
                    attrSelectionInfo.first(), attrSelectionInfo.last());

    selectedValues = this.getSelectionModel().at('value');
    if (TP.notValid(selectedValues)) {
        selectedValues = TP.ac();
    }

    selectAll = this.getSelectionModel().hasKey(TP.ALL);

    groupID = this.getLocalID() + '_group';

    if (TP.isArray(data.first())) {

        newContent.attr(
            'pclass:selected', function(d) {
                if (/^category/.test(d) ||
                    /^spacer/.test(d)) {
                    return null;
                }

                if (selectAll) {
                    return 'true';
                }

                if (selectedValues.contains(d[1])) {
                    return 'true';
                }

                //  Returning null will cause d3.js to remove the
                //  attribute.
                return null;
            }).attr(
            'category', function(d) {
                if (/^category/.test(d)) {
                    return true;
                }

                //  Returning null will cause d3.js to remove the
                //  attribute.
                return null;
            }).attr(
            'spacer', function(d) {
                //  Note how we test the whole value here - we won't
                //  have made an Array at the place where there's a
                //  spacer slot.
                if (/^spacer/.test(d)) {
                    return true;
                }

                //  Returning null will cause d3.js to remove the
                //  attribute.
                return null;
            }).attr(
            'tabindex', function(d, i) {
                //  Note how we test the whole value here - we won't
                //  have made an Array at the place where there's a
                //  spacer slot.
                if (/^spacer/.test(d)) {
                    return null;
                }

                return '0';
            }).attr(
            'tibet:group', function(d, i) {
                //  Note how we test the whole value here - we won't
                //  have made an Array at the place where there's a
                //  spacer slot.
                if (/^spacer/.test(d)) {
                    return null;
                }

                return groupID;
            }
        );

    } else {

        newContent.
                attr(
                'pclass:selected', function(d, i) {
                    if (/^category/.test(d) ||
                        /^spacer/.test(d)) {
                        return null;
                    }

                    if (selectAll) {
                        return 'true';
                    }

                    if (selectedValues.contains(d)) {
                        return 'true';
                    }

                    //  Returning null will cause d3.js to remove the
                    //  attribute.
                    return null;
                }).attr(
                'category', function(d, i) {
                    if (/^category/.test(d)) {
                        return true;
                    }

                    //  Returning null will cause d3.js to remove the
                    //  attribute.
                    return null;
                }).attr(
                'spacer', function(d, i) {
                    if (/^spacer/.test(d)) {
                        return true;
                    }

                    //  Returning null will cause d3.js to remove the
                    //  attribute.
                    return null;
                }).attr(
                'tabindex', function(d, i) {
                    //  Note how we test the whole value here - we won't
                    //  have made an Array at the place where there's a
                    //  spacer slot.
                    if (/^spacer/.test(d)) {
                        return null;
                    }

                    return '0';
                }).attr(
                'tibet:group', function(d, i) {
                    //  Note how we test the whole value here - we won't
                    //  have made an Array at the place where there's a
                    //  spacer slot.
                    if (/^spacer/.test(d)) {
                        return null;
                    }

                    return groupID;
                });
    }

    newContent.each(
        function() {
            var labelContent;

            labelContent = TP.extern.d3.select(this).append('xctrls:label');

            if (TP.isArray(data.first())) {
                labelContent.html(
                    function(d, i) {
                        //  Note how we test the whole value here - we won't
                        //  have made an Array at the place where there's a
                        //  spacer slot.
                        if (/^spacer/.test(d)) {
                            return '&#160;';
                        }

                        if (/^category/.test(d[0])) {
                            return /category\s*-\s*(.+)/.exec(d[0])[1];
                        }

                        return d[0];
                    }
                );
            } else {
                labelContent.html(
                    function(d, i) {
                        if (/^spacer/.test(d)) {
                            return '&#160;';
                        }

                        if (/^category/.test(d)) {
                            return /category\s*-\s*(.+)/.exec(d)[1];
                        }

                        return d;
                    });
            }

            labelContent = TP.extern.d3.select(this).append('xctrls:value');

            if (TP.isArray(data.first())) {
                labelContent.html(
                    function(d, i) {
                        //  Note how we test the whole value here - we won't
                        //  have made an Array at the place where there's a
                        //  spacer slot.
                        if (/^spacer/.test(d)) {
                            return '';
                        }

                        if (/^category/.test(d[0])) {
                            return '';
                        }

                        return d[1];
                    }
                );
            } else {
                labelContent.html(
                    function(d, i) {
                        if (/^spacer/.test(d)) {
                            return '';
                        }

                        if (/^category/.test(d)) {
                            return '';
                        }

                        return d;
                    });
            }
        });

    return this;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('computeSelectionData',
function() {

    /**
     * @method computeSelectionData
     * @summary Returns the data that will actually be used for binding into the
     *     d3.js selection.
     * @description The selection data may very well be different than the bound
     *     data that uses TIBET data binding to bind data to this control. This
     *     method allows the receiver to transform it's 'data binding data' into
     *     data appropriate for d3.js selections.
     * @returns {Object} The selection data.
     */

    var data,

        containerHeight,
        rowHeight,

        displayedRows,

        startIndex,
        len,
        i;

    data = this.get('data');

    //  We clone the data here, since we end up putting 'spacer's in etc, and we
    //  don't want to pollute the original data source
    data = TP.copy(data);

    containerHeight = this.computeHeight();
    rowHeight = this.getRowHeight();

    displayedRows = (containerHeight / rowHeight).floor();

    if (TP.isArray(data.first())) {
        startIndex = data.getSize();
        /* eslint-disable no-extra-parens */
        len = displayedRows - startIndex;
        /* eslint-enable no-extra-parens */
        for (i = startIndex; i < startIndex + len; i++) {
            data.atPut(i, TP.ac('spacer' + i, 'spacer' + i));
        }
    } else {
        //  We pad out the data, adding 1 to make sure that we cover partial
        //  rows at the bottom.
        data.pad(displayedRows, 'spacer', true);
    }

    return data;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('getKeyFunction',
function() {

    /**
     * @method getKeyFunction
     * @summary Returns the Function that should be used to generate keys into
     *     the receiver's data set.
     * @description This Function should take a single argument, an individual
     *     item from the receiver's data set, and return a value that will act
     *     as that item's key in the overall data set. The default version
     *     returns the item itself.
     * @returns {Function} A Function that provides a key for the supplied data
     *     item.
     */

    var data,
        keyFunc;

    data = this.get('data');

    if (TP.isArray(data.first())) {
        keyFunc = function(d) {return d[0]; };
    } else {
        keyFunc = function(d) {return d; };
    }

    return keyFunc;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('getRootUpdateSelection',
function(rootSelection) {

    /**
     * @method getRootUpdateSelection
     * @summary Creates the 'root' update selection that will be used as the
     *     starting point to begin d3.js drawing operations.
     * @returns {d3.Selection} The receiver.
     */

    return rootSelection.selectAll('li');
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('getRowHeight',
function() {

    /**
     * @method getRowHeight
     * @summary Returns the height of each element of the row. This should
     *     correspond to the 'offsetHeight' of each row when the list is
     *     rendered.
     * @returns {Number} The height of a row when rendered.
     */

    return 20;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('getSelectionContainer',
function() {

    /**
     * @method getSelectionContainer
     * @summary Returns the Element that will be used as the 'root' to
     *     add/update/remove content to/from using d3.js functionality. By
     *     default, this returns the receiver's native Element.
     * @returns {Element} The element to use as the container for d3.js
     *     enter/update/exit selections.
     */

    return TP.unwrap(this.get('listcontent'));
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('getScrollingContainer',
function() {

    /**
     * @method getScrollingContainer
     * @summary Returns the Element that will be used as the 'scrolling
     *     container'. This is the element that will be the container of the
     *     list of items and will be translated to perform scrolling
     * @returns {Element} The element to use as the scrolling container.
     */

    return TP.unwrap(this.get('scroller'));
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('updateExistingContent',
function(updateSelection) {

    /**
     * @method updateExistingContent
     * @summary Updates any existing content in the receiver by altering the
     *     content in the supplied d3.js 'update selection'.
     * @param {TP.extern.d3.selection} updateSelection The d3.js update
     *     selection that existing content should be altered in.
     * @returns {TP.core.D3Tag} The receiver.
     */

    var data,

        selectedValues,
        selectAll;

    data = this.get('data');

    selectedValues = this.getSelectionModel().at('value');
    if (TP.notValid(selectedValues)) {
        selectedValues = TP.ac();
    }

    selectAll = this.getSelectionModel().hasKey(TP.ALL);

    if (TP.isArray(data.first())) {
        updateSelection.attr(
                'pclass:selected', function(d) {
                    if (/^category/.test(d) ||
                        /^spacer/.test(d)) {
                        return null;
                    }

                    if (selectAll) {
                        return 'true';
                    }

                    if (selectedValues.contains(d[0])) {
                        return 'true';
                    }

                    //  Returning null will cause d3.js to remove the
                    //  attribute.
                    return null;
                }).attr(
                'category', function(d) {
                    if (/^category/.test(d)) {
                        return true;
                    }

                    //  Returning null will cause d3.js to remove the
                    //  attribute.
                    return null;
                }).attr(
                'spacer', function(d) {
                    //  Note how we test the whole value here - we won't have
                    //  made an Array at the place where there's a spacer slot.
                    if (/^spacer/.test(d)) {
                        return true;
                    }

                    //  Returning null will cause d3.js to remove the
                    //  attribute.
                    return null;
                }
            );
    } else {
        updateSelection.
                attr(
                'pclass:selected', function(d, i) {
                    if (/^category/.test(d) ||
                        /^spacer/.test(d)) {
                        return null;
                    }

                    if (selectAll) {
                        return 'true';
                    }

                    if (selectedValues.contains(d)) {
                        return 'true';
                    }

                    //  Returning null will cause d3.js to remove the
                    //  attribute.
                    return null;
                }).attr(
                'category', function(d, i) {
                    if (/^category/.test(d)) {
                        return true;
                    }

                    //  Returning null will cause d3.js to remove the
                    //  attribute.
                    return null;
                }).attr(
                'spacer', function(d, i) {
                    if (/^spacer/.test(d)) {
                        return true;
                    }

                    //  Returning null will cause d3.js to remove the
                    //  attribute.
                    return null;
                });
    }

    updateSelection.each(
        function() {
            var labelContent;

            labelContent = TP.extern.d3.select(
                                    TP.nodeGetChildElementAt(this, 0));

            if (TP.isArray(data.first())) {
                labelContent.html(
                    function(d, i) {
                        //  Note how we test the whole value here - we won't
                        //  have made an Array at the place where there's a
                        //  spacer slot.
                        if (/^spacer/.test(d)) {
                            return '&#160;';
                        }

                        if (/^category/.test(d[0])) {
                            return /category\s*-\s*(.+)/.exec(d[0])[1];
                        }

                        return d[0];
                    }
                );
            } else {
                labelContent.html(
                        function(d, i) {
                            if (/^spacer/.test(d)) {
                                return '&#160;';
                            }

                            if (/^category/.test(d)) {
                                return /category\s*-\s*(.+)/.exec(d)[1];
                            }

                            return d;
                        });
            }

            labelContent = TP.extern.d3.select(
                                    TP.nodeGetChildElementAt(this, 1));

            if (TP.isArray(data.first())) {
                labelContent.html(
                    function(d, i) {
                        //  Note how we test the whole value here - we won't
                        //  have made an Array at the place where there's a
                        //  spacer slot.
                        if (/^spacer/.test(d)) {
                            return '';
                        }

                        if (/^category/.test(d[0])) {
                            return '';
                        }

                        return d[1];
                    }
                );
            } else {
                labelContent.html(
                        function(d, i) {
                            if (/^spacer/.test(d)) {
                                return '';
                            }

                            if (/^category/.test(d)) {
                                return '';
                            }

                            return d;
                        });
            }
        });

    return this;
});

//  ------------------------------------------------------------------------
//  TP.core.SelectingUIElement Methods
//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('allowsMultiples',
function() {

    /**
     * @method allowsMultiples
     * @summary Returns true if the receiver is configured for multiple
     *     selection.
     * @returns {Boolean} Whether or not the receiver allows multiple selection.
     */

    //  We allow multiples if we have the 'multiple' attribute.
    return this.hasAttribute('multiple');
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('deselect',
function(aValue) {

    /**
     * @method deselect
     * @summary De-selects (clears) the element which has the provided value.
     * @param {Object} aValue The value to de-select. Note that this can be an
     *     Array. Also note that if no value is provided this will deselect
     *     (clear) all selected items.
     * @returns {Boolean} Whether or not a selection was deselected.
     */

    var data,

        matches,

        len,
        i,

        value,

        itemIndex,

        selectVal,

        retVal;

    data = this.get('data');

    //  If our data is an Array of Arrays, grab the first element in each Array
    //  (because that's what we draw in the rendering routines in this type when
    //  that is the case).
    if (TP.isArray(data.first())) {

        //  Collect up all of the values that could be considered the 'value'
        data = data.collect(
                    function(anArr) {
                        return anArr.last();
                    });
    }

    //  If aValue is a RegExp, then we use it to test against all of the value
    //  elements 'primitive value'. If we find one that matches, then we use
    //  that as the value to remove from our selection.
    if (TP.isRegExp(aValue)) {

        matches = TP.ac();

        len = data.getSize();
        for (i = 0; i < len; i++) {

            value = data.at(i);

            if (aValue.test(value)) {
                matches.push(value);
            }
        }

        selectVal = matches;
    } else {
        selectVal = aValue;
    }

    //  Call our next-most-specific version of this method which will return
    //  whether or not our selection changed.
    retVal = this.callNextMethod(selectVal);

    //  If our selection changed, then cause things to scroll to it.
    if (retVal) {

        if (TP.isArray(selectVal)) {
            itemIndex = data.indexOf(selectVal.first());
        } else {
            itemIndex = data.indexOf(selectVal);
        }

        this.scrollTopToRow(itemIndex);
    }

    return retVal;
});

//  ------------------------------------------------------------------------

TP.xctrls.list.Inst.defineMethod('select',
function(aValue) {

    /**
     * @method select
     * @summary Selects the element which has the provided value (if found).
     *     Note that this method is roughly identical to setDisplayValue() with
     *     the exception that this method does not clear existing selections
     *     when processing the value(s) provided. When no specific values are
     *     provided this method will selectAll.
     * @param {Object} aValue The value to select. Note that this can be an
     *     array.
     * @exception TP.sig.InvalidOperation
     * @returns {Boolean} Whether or not a selection was selected.
     */

    var data,

        matches,

        len,
        i,

        value,

        itemIndex,

        selectVal,

        retVal;

    data = this.get('data');

    //  If our data is an Array of Arrays, grab the first element in each Array
    //  (because that's what we draw in the rendering routines in this type when
    //  that is the case).
    if (TP.isArray(data.first())) {

        //  Collect up all of the values that could be considered the 'value'
        data = data.collect(
                    function(anArr) {
                        return anArr.last();
                    });
    }

    //  If aValue is a RegExp, then we use it to test against all of the value
    //  elements 'primitive value'. If we find one that matches, then we use
    //  that as the value to add to our selection.
    if (TP.isRegExp(aValue)) {

        matches = TP.ac();

        len = data.getSize();
        for (i = 0; i < len; i++) {

            value = data.at(i);

            if (aValue.test(value)) {
                matches.push(value);
            }
        }

        selectVal = matches;
    } else {
        selectVal = aValue;
    }

    //  Call our next-most-specific version of this method which will return
    //  whether or not our selection changed.
    retVal = this.callNextMethod(selectVal);

    //  If our selection changed, then cause things to scroll to it.
    if (retVal) {

        if (TP.isArray(selectVal)) {
            itemIndex = data.indexOf(selectVal.first());
        } else {
            itemIndex = data.indexOf(selectVal);
        }

        this.scrollTopToRow(itemIndex);
    }

    return retVal;
},
{patchCallee: true});

//  ========================================================================
//  TP.xctrls.listitem
//  ========================================================================

TP.core.UIElementNode.defineSubtype('xctrls:listitem');

//  Note how these properties are TYPE_LOCAL, by design.
TP.xctrls.listitem.defineAttribute('styleURI', TP.NO_RESULT);
TP.xctrls.listitem.defineAttribute('themeURI', TP.NO_RESULT);

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

TP.xctrls.listitem.Type.defineAttribute('opaqueSignalNames',
        TP.ac('TP.sig.DOMMouseDown',
                'TP.sig.DOMMouseUp',
                'TP.sig.DOMMouseOver',
                'TP.sig.DOMMouseOut',
                'TP.sig.DOMFocus',
                'TP.sig.DOMBlur',
                'TP.sig.DOMClick'));

//  ------------------------------------------------------------------------

TP.xctrls.listitem.Inst.defineMethod('computeSuccessorFocusElement',
function(focusedTPElem, moveAction) {

    /**
     * @method computeSuccessorFocusElement
     * @summary Computes the 'successor' focus element using the currently
     *     focused element (if there is one) and the move action.
     * @param {TP.core.ElementNode} focusedTPElem The currently focused element.
     *     This may be null if no element is currently focused.
     * @param {Constant} moveAction The type of 'move' that the user requested.
     *     This can be one of the following:
     *         TP.FIRST
     *         TP.LAST
     *         TP.NEXT
     *         TP.PREVIOUS
     *         TP.FIRST_IN_GROUP
     *         TP.LAST_IN_GROUP
     *         TP.FIRST_IN_NEXT_GROUP
     *         TP.FIRST_IN_PREVIOUS_GROUP
     *         TP.FOLLOWING
     *         TP.PRECEDING
     * @returns {TP.core.ElementNode} The element that is the successor focus
     *     element.
     */

    var listTPElem,
        successorTPElem;

    listTPElem = this.getParentNode().
                        getParentNode().
                        getParentNode().
                        getParentNode();

    successorTPElem = listTPElem.scrollAndComputeFocusElement(moveAction);
    if (TP.isValid(successorTPElem)) {
        return successorTPElem;
    }

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================