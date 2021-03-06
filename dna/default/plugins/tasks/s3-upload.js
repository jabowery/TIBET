/**
 * @overview Simple task runner for storing data in an s3 bucket.
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     open source waivers to keep your derivative work source code private.
 */

(function() {

    'use strict';

    /**
     *
     * @param {Object} options Configuration options shared across TDS modules.
     * @returns {Function} A function which will configure/activate the plugin.
     */
    module.exports = function(options) {
        var app,
            logger,
            TDS,
            AWS;

        app = options.app;
        logger = options.logger;
        TDS = app.TDS;

        AWS = require('aws-sdk');

        //  ---
        //  Task
        //  ---

        /**
         * The actual task execution function which will be invoked by the task
         * runner.
         */
        return function(job, step, params) {
            var service,
                serviceOpts,
                uploadOpts,
                upload,
                template,
                body;

            TDS.ifDebug() ? logger.debug(job, JSON.stringify(step)) : 0;

            //  Basic option sanity check
            if (!params.auth) {
                return TDS.Promise.reject(new Error(
                    'Misconfigured S3 task. No params.auth found.'));
            }

            //  Basic authentication value check
            if (!params.auth.id || !params.auth.secret) {
                return TDS.Promise.reject(new Error(
                    'Misconfigured S3 task. No params.auth.id and/or params.auth.secret.'));
            }

            if (!params.region || !params.bucket) {
                return TDS.Promise.reject(new Error(
                    'Misconfigured S3 task. No params.region and/or params.bucket.'));
            }

            //  Basic content sanity check
            if (!params.key || !params.body) {
                return TDS.Promise.reject(new Error(
                    'Misconfigured SMTP task. Missing params.key and/or params.body.'));
            }

            //  Build up the options necessary to construct the service.
            serviceOpts = {};

            serviceOpts.accessKeyId = TDS.decrypt(params.auth.id);
            serviceOpts.secretAccessKey = TDS.decrypt(params.auth.secret);

            serviceOpts.region = params.region;

            serviceOpts.params = {};
            serviceOpts.params.Bucket = params.bucket;

            try {
                template = TDS.template.compile(params.body);
                body = template(params);
            } catch (e) {
                return TDS.Promise.reject(e);
            }

            //  Build up the options for the upload operation itself.
            uploadOpts = {
                Key: params.key,
                Body: body
            };

            //  build the service and create a promise-driven version of upload.
            service = new AWS.S3(serviceOpts);
            upload = TDS.Promise.promisify(service.upload.bind(service));

            logger.trace(job, ' uploading data to s3');

            //  Invoke the upload operation, returning the promise for the task
            //  engine to link to.
            return upload(uploadOpts);
        };
    };
}());
