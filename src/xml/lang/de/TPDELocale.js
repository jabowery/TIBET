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
 * @type {TP.core.DELocale}
 * @synopsis TP.core.DELocale provides support for the German language and
 *     related localizations.
 */

//  ------------------------------------------------------------------------

TP.core.Locale.defineSubtype('DELocale');

TP.core.DELocale.Type.defineAttribute('langCode', 'de');

TP.core.DELocale.Type.defineAttribute('falseStrings',
    TP.ac('0', '', 'nein', 'Nein', 'NEIN', 'n', 'N',
        'f', 'F', 'falsch', 'Falsch', 'FALSCH'));

TP.core.DELocale.Type.defineAttribute('longMonthNames',
    TP.ac('Januar', 'Februar', 'Marz', 'April', 'Mai', 'Juni', 'Juli',
        'August', 'September', 'Oktober', 'November', 'Dezember'));

TP.core.DELocale.Type.defineAttribute('shortMonthNames',
    TP.ac('Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul',
        'Aug', 'Sep', 'Okt', 'Nov', 'Dez'));

TP.core.DELocale.Type.defineAttribute('longWeekdayNames',
    TP.ac('Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag',
        'Frietag', 'Samstag'));

//  TODO:   probably wrong, translation help appreciated :)
TP.core.DELocale.Type.defineAttribute('shortWeekdayNames',
    TP.ac('Son', 'Mon', 'Die', 'Mit', 'Don', 'Fri', 'Sam'));

//  TODO:   rework the locale registration process so this isn't necessary.
TP.core.Locale.registerLocale(TP.core.DELocale);

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
