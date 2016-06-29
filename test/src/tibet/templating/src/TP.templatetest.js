/**
 * @type {Namespace}
 * @summary Defines namespace-level objects and functionality for the project.
 */

/**
 * Define the JavaScript namespace object which will hold application code.
 */
TP.defineNamespace('TP.templatetest');

/**
 * Define the XML namespace and prefix for any tags in the application.
 */
TP.w3.Xmlns.registerNSInfo('urn:app:templatetest',
    TP.hc('prefix', 'templatetest'));
