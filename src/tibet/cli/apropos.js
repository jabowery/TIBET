//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview The 'tibet apropos' command. Runs phantomjs via TIBET's phantomtsh
 *     script runner. The script run is ':apropos' with optional arguments.
 */
//  ========================================================================

/* eslint indent:0 */

(function() {

'use strict';

var CLI,
    Cmd;


CLI = require('./_cli');

//  ---
//  Type Construction
//  ---

// NOTE this is a subtype of the 'tsh' command focused on running :apropos.
Cmd = function() {
    //  empty
};
Cmd.Parent = require('./tsh');
Cmd.prototype = new Cmd.Parent();


//  ---
//  Type Attributes
//  ---


/**
 * The context viable for this command.
 * @type {Cmd.CONTEXTS}
 */
Cmd.CONTEXT = CLI.CONTEXTS.INSIDE;


/**
 * The default path to the TIBET-specific phantomjs script runner.
 * @type {String}
 */
Cmd.DEFAULT_RUNNER = Cmd.Parent.DEFAULT_RUNNER;

/**
 * The command name for this type.
 * @type {string}
 */
Cmd.NAME = 'apropos';

//  ---
//  Instance Attributes
//  ---

/**
 * Command argument parsing options.
 * @type {Object}
 */

/* eslint-disable quote-props */
Cmd.prototype.PARSE_OPTIONS = CLI.blend(
    {
        'boolean': ['comments', 'ignorecase'],
        'number': ['limit'],
        'string': [],
        'default': {
            comments: false,
            ignorecase: true
        }
    },
    Cmd.Parent.prototype.PARSE_OPTIONS);
/* eslint-enable quote-props */

/**
 * The command usage string.
 * @type {String}
 */
Cmd.prototype.USAGE =
    'tibet apropos <terms> [--comments] [--limit=N] [--no-ignorecase]';

//  ---
//  Instance Methods
//  ---

/**
 * Performs any final processing of the argument list prior to execution.
 * @param {Array.<String>} arglist The argument list to finalize.
 * @returns {Array.<String>} The finalized argument list.
 */
Cmd.prototype.finalizeArglist = function(arglist) {
    arglist.push('--contrast', '#');

    return arglist;
};


/**
 * Returns a list of options/flags/parameters suitable for command completion.
 * @returns {Array.<string>} The list of options for this command.
 */
Cmd.prototype.getCompletionOptions = function() {
    var list,
        plist;

        list = Cmd.Parent.prototype.getCompletionOptions.call(this);
        plist = Cmd.Parent.prototype.getCompletionOptions();

        return CLI.subtract(plist, list);
};


/**
 * Computes and returns the proper profile configuration to boot. This value is
 * appended to the value from getProfileRoot() to produce the full boot profile
 * value. Most commands use the same root but some will alter the configuration.
 * @returns {String} The profile config ID.
 */
Cmd.prototype.getProfileConfig = function() {
    return 'reflection';
};


/**
 * Computes and returns the TIBET Shell script command line to be run.
 * @returns {String} The TIBET Shell script command to execute.
 */
Cmd.prototype.getScript = function() {

    var terms,
        prefix,
        suffix,
        script;

    //  The options._ object holds non-qualified parameters. [0] is the
    //  command name. The rest will be the terms.
    terms = this.options._.slice(1);
    if (CLI.isEmpty(terms)) {
        return;
    }

    prefix = ':apropos ';

    //  To be sure each term stays quoted properly we need to preserve quoting
    //  in our argument string.
    suffix = terms.reduce(function(prev, curr) {
        if (curr.match(/'/)) {
            return prev + ' ' + '"' + curr + '"';
        } else {
            return prev + ' ' + '\'' + curr + '\'';
        }
    }, '');

    script = prefix + suffix;

    if (this.options.limit) {
        script += ' -limit=' + this.options.limit;
    }

    if (this.options.ignorecase) {
        script += ' -ignorecase=true';
    } else {
        script += ' -ignorecase=false';
    }

    if (this.options.comments) {
        script += ' -comments=true';
    }

    return script;
};


module.exports = Cmd;

}());
