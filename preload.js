/**
 * Created by mjwunderlich on 6/24/17.
 */

(function () {

    "use strict";

    /**
     * @public
     * A beefed up image preloader for Javascript.
     *
     * @param options A dictionary (object) that can define the following properties:
     *                  - base_url: [optional] The base URL to use for all images
     *                  - finished: [optional] A callback to execute when preloading is complete (including errors)
     *                  - error: [optional] A callback to execute when preloading a certain image fails
     *
     * @author Mario J. Wunderlich
     * @version 0.1.1
     */
    window.image_preload = function (options /*, images... */) {
        if (arguments.length < 2) {
            throw "Error: Incorrect number of arguments for image_preload()";
        }

        // Cleanup the options object:
        // 1. Get default values for options that are not defined
        // 2. Make sure the defined options have the correct types
        options = cleanup_options(options || {});

        // Resolve the base_url
        var base_url = resolve_base_url(options);

        // Convert arguments into an Array so that we can get a slice of it
        var slice = [].slice;
        var arguments_as_array = slice.apply(arguments);
        var arguments_slice = arguments_as_array.slice(1);

        // Resolve all images in the arguments into a single flat array
        var image_sources = resolve_images.apply(self, arguments_slice);

        // Load all images
        load_images.apply(self, [options, base_url, image_sources]);
    };

    window.image_preload.version = "Version 0.1.1";

    /**
     * @private
     * Cleans up user options.
     *
     * @param options
     * @returns {*}
     */
    function cleanup_options(options) {
        if (typeof options === 'function') {
            options = options();
        }

        if (typeof options !== 'object') {
            options = {};
        }

        var available_options = {base_url: 'string', finished: 'function', error: 'function'};
        var key;

        for (key in available_options) {
            if (!(key in options)) {
                options[key] = null;
            }
            else if (typeof options[key] !== available_options[key]) {
                options[key] = null;
            }
        }
        return options;
    }

    /**
     * @private
     * Resolves the base_url to use for image loading.
     * @param options
     * @returns {*}
     */
    function resolve_base_url(options) {
        var base_url;
        if ('base_url' in options && options.base_url) {
            base_url = options.base_url;
            if (base_url.lastIndexOf("/") != base_url.length - 1) {
                base_url += "/";
            }
        }
        else {
            base_url = window.location.href;
            var last_index = base_url.lastIndexOf("/");
            base_url = base_url.substring(0, last_index + 1);
        }
        return base_url;
    }

    /**
     * @private
     * Goes through the arguments list searching for image paths. Arrays are flattened, strings are appended.
     *
     * @param options
     * @returns {Array}
     */
    function resolve_images() {
        var index;
        var image_sources = [];
        for (index = 0; index < arguments.length; ++index) {
            if (Array.isArray(arguments[index])) {
                image_sources = image_sources.concat(arguments[index]);
            }
            else if (typeof arguments[index] == "string") {
                image_sources.push(arguments[index]);
            }
            else if (typeof arguments[index] == "function") {
                try {
                    var result = arguments[index](image_sources);
                    if (typeof result == "string")
                        image_sources.push(result);
                }
                catch (error) {
                    console.error("Cannot resolve image function [" + arguments[index] + "]; with error: " + error);
                }
            }
            else {
                console.warn("Cannot use argument [" + index + "] as image path: " + argument[index])
            }
        }
        return image_sources;
    }

    /**
     * @private
     * Performs the actual loading of images.
     *
     * @param options
     * @param base_url
     * @param image_sources
     */
    function load_images(options, base_url, image_sources) {
        var preload_total = image_sources.length;
        var preload_progress = 0;
        var preload_errors = 0;
        var map = {};
        var index;

        for (index=0; index<image_sources.length; ++index) {
            (function (source) {
                var img = new Image();
                img.src = base_url + source;
                img.onload = function () {
                    console.log('Done preloading ' + source);
                    preload_progress ++;
                    map[source] = true;

                    if (preload_progress+preload_errors == preload_total && options['finished']) {
                        options.finished(map, preload_progress, preload_errors);
                    }
                };
                img.onerror = function() {
                    console.warn('Unnable to preload ' + source);
                    preload_errors ++;
                    map[source] = false;

                    if (preload_progress+preload_errors == preload_total && options['finished']) {
                        options.finished(map, preload_progress, preload_errors);
                    }
                };
            })(image_sources[index]);
        }
    }
})();
