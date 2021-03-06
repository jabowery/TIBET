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
 * @type {TP.core.Matcher}
 */

//  ------------------------------------------------------------------------

TP.lang.Object.defineSubtype('core.Matcher');

TP.core.Matcher.isAbstract(true);

//  ------------------------------------------------------------------------
//  Type Constants
//  ------------------------------------------------------------------------

TP.core.Matcher.Type.defineConstant('MATCH_RESULT_SORT',
function(itemA, itemB) {

    var itemAEntry,
        itemBEntry,

        aLower,
        bLower;

    if (itemA.score === itemB.score) {

        //  Method matcher returns Arrays - pluck out the method
        //  name

        if (TP.isArray(itemAEntry = itemA.string)) {
            itemAEntry = itemAEntry.at(2);
        }

        if (TP.isArray(itemBEntry = itemB.string)) {
            itemBEntry = itemBEntry.at(2);
        }

        aLower = itemAEntry.toLowerCase();
        bLower = itemBEntry.toLowerCase();

        if (aLower < bLower) {
            return -1;
        } else if (aLower > bLower) {
            return 1;
        }

        return 0;
    }

    return itemB.score - itemA.score;
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineAttribute('input');
TP.core.Matcher.Inst.defineAttribute('$matcherName');

TP.core.Matcher.Inst.defineAttribute('caseSensitive');
TP.core.Matcher.Inst.defineAttribute('threshold');
TP.core.Matcher.Inst.defineAttribute('location');
TP.core.Matcher.Inst.defineAttribute('distance');
TP.core.Matcher.Inst.defineAttribute('maxPatternLength');
TP.core.Matcher.Inst.defineAttribute('minMatchCharLength');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.core.Matcher.Type.defineMethod('initialize',
function() {

    /**
     * @method initialize
     * @summary Performs one-time setup for the type on startup/import.
     */

    this.defineDependencies('TP.extern.Fuse');

    return;
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('init',
function(matcherName) {

    /**
     * @method init
     * @summary Initialize the instance.
     * @param {String} matcherName The name of this matcher that will be
     *     associated with the search results produced by it
     * @returns {TP.core.Matcher} The receiver.
     */

    this.callNextMethod();

    this.set('$matcherName', matcherName);

    this.set('caseSensitive', true);
    this.set('threshold', 0.6);
    this.set('location', 0);
    this.set('distance', 32);
    this.set('maxPatternLength', 32);
    this.set('minMatchCharLength', 1);

    return this;
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('getDataSet',
function() {

    /**
     * @method getDataSet
     * @summary Returns the data set that this matcher is operating on.
     * @returns {Object} The data set.
     */

    return TP.override();
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     * @summary Performs the match against the data set using the receiver's
     *     input against its data set.
     * @returns {Object[]} An Array of match result POJOS.
     */

    return TP.override();
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('generateMatchSet',
function(rawData, searchTerm, keys) {

    /**
     * @method generateMatchSet
     * @summary Generates a match set against the raw data using the supplied
     *     search term.
     * @param {Object[]} rawData The raw data to use to generate the match set.
     *     This should be an Array of text-searchable objects, such as a String
     *     or a JavaScript structure where the optional 3rd parameter is a list
     *     of keys of that structure to be searched.
     * @param {String} searchTerm The search term to be used to search the raw
     *     data.
     * @param {String[]} [keys] If the rawData is not an Array of Strings, but
     *     an Array of JavaScript structures, these keys will be used to extract
     *     the data from that structure to search.
     * @returns {Object[]} An Array of match result POJOS.
     */

    var matches,
        options,

        fuse;

    /* eslint-disable no-undef */

    options = {
        caseSensitive: this.get('caseSensitive'),
        includeMatches: true,   //  hardcoded to true - we use this data
        includeScore: true,     //  hardcoded to true - we use this data
        threshold: this.get('threshold'),
        location: this.get('location'),
        distance: this.get('distance'),
        maxPatternLength: this.get('maxPatternLength'),
        minMatchCharLength: this.get('minMatchCharLength'),
        keys: keys
    };

    fuse = new TP.extern.Fuse(rawData, options);
    matches = fuse.search(searchTerm);

    /* eslint-enable no-undef */

    return matches;
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('prepareForMatching',
function() {

    /**
     * @method prepareForMatching
     * @summary Prepares the receiver to begin the matching process.
     * @returns {TP.core.Matcher} The receiver.
     */

    return this;
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('prepareForResultProcessing',
function(matchResults) {

    /**
     * @method prepareForResultProcessing
     * @summary Prepares the receiver to begin processing results.
     * @param {Object[]} matchResults The results of performing the match.
     * @returns {TP.core.Matcher} The receiver.
     */

    return this;
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('postProcessResult',
function() {

    /**
     * @method postProcessResult
     * @summary Post process an individual result.
     * @param {Object} matchResult An individual result of performing the match.
     */

    return this;
});

//  ========================================================================
//  TP.core.ListMatcher
//  ========================================================================

TP.core.Matcher.defineSubtype('ListMatcher');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.ListMatcher.Inst.defineAttribute('$dataSet');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.ListMatcher.Inst.defineMethod('init',
function(matcherName, dataSet) {

    /**
     * @method init
     * @summary Initialize the instance.
     * @param {String} matcherName The name of this matcher that will be
     *     associated with the search results produced by it
     * @param {Object} dataSet The data set for this matcher to operate on.
     * @returns {TP.core.ListMatcher} The receiver.
     */

    this.callNextMethod();

    this.set('dataSet', dataSet);

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ListMatcher.Inst.defineMethod('getDataSet',
function() {

    /**
     * @method getDataSet
     * @summary Returns the data set that this matcher is operating on.
     * @returns {Object} The data set.
     */

    return this.get('$dataSet');
});

//  ------------------------------------------------------------------------

TP.core.ListMatcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     * @summary Performs the match against the data set using the receiver's
     *     input against its data set.
     * @returns {Object[]} An Array of match result POJOS. For this type, these
     *     result records have the following fields:
     *          input       {String}    The input string that was used to
     *                                  search.
     *          matcherName {String}    The name of the matcher that produced
     *                                  this result.
     *          string      {String}    The value of the original datum or the
     *                                  result datum.
     */

    var dataSet,
        matcherName,
        searchTerm,

        matches;

    dataSet = this.get('dataSet');
    matcherName = this.get('$matcherName');
    searchTerm = TP.ifInvalid(this.get('input'), '');

    if (TP.isEmpty(searchTerm)) {
        matches = TP.ac();
        dataSet.forEach(
                function(anItem) {
                    matches.push(
                        {
                            input: searchTerm,
                            matcherName: matcherName,
                            string: anItem
                        }
                    );
                });
    } else {
        matches = this.generateMatchSet(dataSet, searchTerm);

        //  Due to a bug in Fuse.js, we will get results with no 'matches'
        //  Arrays. Filter them out here.
        matches = matches.select(
                    function(aMatch) {
                        return aMatch.matches.length > 0;
                    });

        matches.forEach(
                function(aMatch) {
                    aMatch.input = searchTerm;
                    aMatch.matcherName = matcherName;
                    aMatch.string = aMatch.matches[0].value;
                });
    }

    return matches;
});

//  ------------------------------------------------------------------------

TP.core.ListMatcher.Inst.defineMethod('setDataSet',
function(dataSet) {

    /**
     * @method setDataSet
     * @summary Set the data set that this matcher is operating on to the
     *     supplied parameter.
     * @param {Object} dataSet The data set for this matcher to operate on.
     * @returns {TP.core.ListMatcher} The receiver.
     */

    this.set('$dataSet', dataSet);

    return this;
});

//  ========================================================================
//  TP.core.KeyedSourceMatcher
//  ========================================================================

TP.core.Matcher.defineSubtype('KeyedSourceMatcher');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.KeyedSourceMatcher.Inst.defineAttribute('$dataSet');

TP.core.KeyedSourceMatcher.Inst.defineAttribute('keySource');
TP.core.KeyedSourceMatcher.Inst.defineAttribute('keySourceName');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.KeyedSourceMatcher.Inst.defineMethod('init',
function(matcherName, keySource) {

    /**
     * @method init
     * @summary Initialize the instance.
     * @param {String} matcherName The name of this matcher that will be
     *     associated with the search results produced by it
     * @param {Object} keySource The source to derive keys from.
     * @returns {TP.core.KeyedSourceMatcher} The receiver.
     */

    this.callNextMethod();

    this.set('keySource', keySource);
    this.set('keySourceName', TP.name(keySource));

    return this;
});

//  ------------------------------------------------------------------------

TP.core.KeyedSourceMatcher.Inst.defineMethod('getDataSet',
function() {

    /**
     * @method getDataSet
     * @summary Returns the data set that this matcher is operating on.
     * @returns {Object} The data set.
     */

    return this.get('$dataSet');
});

//  ------------------------------------------------------------------------

TP.core.KeyedSourceMatcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     * @summary Performs the match against the data set using the receiver's
     *     input against its data set.
     * @returns {Object[]} An Array of match result POJOS. For this type, these
     *     result records have the following fields:
     *          input       {String}    The input string that was used to
     *                                  search.
     *          matcherName {String}    The name of the matcher that produced
     *                                  this result.
     *          string      {String}    The value of the original datum or the
     *                                  result datum.
     */

    var dataSet,
        matcherName,
        searchTerm,

        matches,

        keySourceName;

    dataSet = this.get('$dataSet');
    matcherName = this.get('$matcherName');
    searchTerm = TP.ifInvalid(this.get('input'), '');

    keySourceName = this.get('keySourceName');

    if (TP.isEmpty(searchTerm)) {
        matches = TP.ac();
        dataSet.forEach(
                function(aKey) {
                    matches.push(
                        {
                            input: searchTerm,
                            matcherName: matcherName,
                            prefix: keySourceName + '.',
                            string: aKey
                        }
                    );
                });
    } else {
        matches = this.generateMatchSet(dataSet, searchTerm);

        //  Due to a bug in Fuse.js, we will get results with no 'matches'
        //  Arrays. Filter them out here.
        matches = matches.select(
                    function(aMatch) {
                        return aMatch.matches.length > 0;
                    });

        matches.forEach(
                function(aMatch) {
                    aMatch.input = searchTerm;
                    aMatch.matcherName = matcherName;
                    aMatch.prefix = keySourceName + '.';
                    aMatch.string = aMatch.matches[0].value;
                });
    }

    return matches;
});

//  ------------------------------------------------------------------------

TP.core.KeyedSourceMatcher.Inst.defineMethod('prepareForMatching',
function() {

    /**
     * @method prepareForMatching
     * @summary Prepares the receiver to begin the matching process.
     * @returns {TP.core.KeyedSourceMatcher} The receiver.
     */

    var keySource,
        dataSet,

        wantsProtoChain;

    keySource = this.get('keySource');

    if (TP.isNativeType(keySource)) {
        dataSet = TP.interface(keySource.prototype, TP.SLOT_FILTERS.attributes);
    } else {
        if (TP.canInvoke(keySource, 'getType')) {
            if (TP.isNativeType(keySource.getType())) {
                wantsProtoChain = true;
            } else {
                wantsProtoChain = false;
            }
        } else {
            //  All TIBET objects respond to 'getType', so if it can't, it's a
            //  native object that we definitely want all prototype properties
            //  of.
            wantsProtoChain = true;
        }

        dataSet = TP.keys(this.get('keySource'), true, wantsProtoChain);
    }

    dataSet.sort();

    this.set('$dataSet', dataSet);

    return this;
});

//  ------------------------------------------------------------------------

TP.core.KeyedSourceMatcher.Inst.defineMethod('setDataSet',
function(dataSet) {

    /**
     * @method setDataSet
     * @summary Set the data set that this matcher is operating on to the
     *     supplied parameter.
     * @param {Object} dataSet The data set for this matcher to operate on.
     * @returns {TP.core.KeyedSourceMatcher} The receiver.
     */

    this.set('$dataSet', dataSet);

    return this;
});

//  ========================================================================
//  TP.core.CSSPropertyMatcher
//  ========================================================================

TP.core.ListMatcher.defineSubtype('CSSPropertyMatcher');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.CSSPropertyMatcher.Inst.defineMethod('getDataSet',
function() {

    /**
     * @method getDataSet
     * @summary Returns the data set that this matcher is operating on.
     * @returns {Object} The data set.
     */

    return TP.CSS_ALL_PROPERTIES;
});

//  ========================================================================
//  TP.core.CustomTypeMatcher
//  ========================================================================

TP.core.ListMatcher.defineSubtype('CustomTypeMatcher');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.CustomTypeMatcher.Inst.defineMethod('getDataSet',
function() {

    /**
     * @method getDataSet
     * @summary Returns the data set that this matcher is operating on.
     * @returns {Object} The data set.
     */

    return TP.sys.getMetadata('types').getKeys();
});

//  ========================================================================
//  TP.core.URIMatcher
//  ========================================================================

TP.core.ListMatcher.defineSubtype('URIMatcher');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.URIMatcher.Inst.defineAttribute('keySource');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.URIMatcher.Inst.defineMethod('getDataSet',
function() {

    /**
     * @method getDataSet
     * @summary Returns the data set that this matcher is operating on.
     * @returns {Object} The data set.
     */

    return TP.core.URI.Type.get('instances').getKeys();
});

//  ========================================================================
//  TP.core.MethodMatcher
//  ========================================================================

TP.core.ListMatcher.defineSubtype('MethodMatcher');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.MethodMatcher.Inst.defineAttribute('$dataSet');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.MethodMatcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     * @summary Performs the match against the data set using the receiver's
     *     input against its data set.
     * @returns {Object[]} An Array of match result POJOS. For this type, these
     *     result records have the following fields:
     *          input       {String}    The input string that was used to
     *                                  search.
     *          matcherName {String}    The name of the matcher that produced
     *                                  this result.
     *          suffix      {String}
     */

    var matches;

    matches = this.callNextMethod();

    matches.forEach(
            function(aMatch) {
                aMatch.suffix = ' (' + aMatch.string.at(0) + ')';
            });

    return matches;
});

//  ------------------------------------------------------------------------

TP.core.MethodMatcher.Inst.defineMethod('prepareForMatching',
function() {

    /**
     * @method prepareForMatching
     * @summary Prepares the receiver to begin the matching process.
     * @returns {TP.core.MethodMatcher} The receiver.
     */

    var keys,
        dataSet;

    keys = TP.sys.getMetadata('methods').getKeys();

    dataSet = TP.ac();

    keys.forEach(
            function(aKey) {
                //  This pushes method data in as: [owner, track, name]
                dataSet.push(aKey.split('_'));
            });

    this.set('$dataSet', dataSet);

    return this;
});

//  ========================================================================
//  TP.core.NamespaceMatcher
//  ========================================================================

TP.core.ListMatcher.defineSubtype('NamespaceMatcher');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.NamespaceMatcher.Inst.defineMethod('getDataSet',
function() {

    /**
     * @method getDataSet
     * @summary Returns the data set that this matcher is operating on.
     * @returns {Object} The data set.
     */

    return TP.sys.getNamespaceNames();
});

//  ========================================================================
//  TP.core.TSHHistoryMatcher
//  ========================================================================

TP.core.ListMatcher.defineSubtype('TSHHistoryMatcher');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.TSHHistoryMatcher.Inst.defineAttribute('$dataSet');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.TSHHistoryMatcher.Inst.defineMethod('prepareForMatching',
function() {

    /**
     * @method prepareForMatching
     * @summary Prepares the receiver to begin the matching process.
     * @returns {TP.core.TSHHistoryMatcher} The receiver.
     */

    var dataSet;

    dataSet = TP.bySystemId('TSH').getHistory().collect(
                function(item) {
                    return item.at('cmd');
                });

    this.set('$dataSet', dataSet);

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
