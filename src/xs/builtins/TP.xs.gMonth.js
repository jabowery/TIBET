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
 * @type {TP.xs.gMonth}
 * @summary A month specification with optional time zone data in the format of
 *     --MM[timezone].
 */

//  ------------------------------------------------------------------------

TP.xs.anySimpleType.defineSubtype('gMonth');

//  ------------------------------------------------------------------------
//  Type Constants
//  ------------------------------------------------------------------------

//  a regex capable of validating the lexical format and splitting the
//  various segments out into a match result for further testing
TP.xs.gMonth.Type.defineConstant('MONTH_REGEX',
            /^--([0-9]{2})(([Z\+\-]*)([0-9]{2})*[:]*([0-9]{2})*)$/);

//  indexes into the match result produced by the previous RegExp
TP.xs.gMonth.Type.defineConstant('MONTH_INDEX', 1);
TP.xs.gMonth.Type.defineConstant('ZONE_INDEX', 2);

//  ------------------------------------------------------------------------

TP.xs.gMonth.Type.defineMethod('validate',
function(anObject) {

    /**
     * @method validate
     * @summary Returns true if the object provided represents a valid XML
     *     Schema month specification.
     * @param {String} anObject The object to validate.
     * @returns {Boolean}
     */

    var str,
        m,
        zi,
        month;

    if (!TP.isString(anObject)) {
        return false;
    }

    str = anObject;

    m = str.match(this.get('MONTH_REGEX'));
    if (TP.notValid(m)) {
        return false;
    }

    month = parseInt(m.at(this.get('MONTH_INDEX')), 10);

    //  month can't be 0, or greater than 12
    if (!month.isBetweenInclusive(1, 12)) {
        return false;
    }

    if (TP.notEmpty(zi = m.at(this.get('ZONE_INDEX')))) {
        return TP.core.TimeZone.validate(zi);
    }

    //  made it through the gauntlet
    return true;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
