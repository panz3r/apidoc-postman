/*
 * apidoc
 * http://apidocjs.com
 *
 * Copyright (c) 2013-2016 inveris OHG
 * Author Peter Rottmann <rottmann@inveris.de>
 * Licensed under the MIT license.
 */

var _ = require("lodash");
var apidoc = require("apidoc-core");
var fs = require("fs-extra");
var path = require("path");
var winston = require("winston");
var Markdown = require("markdown-it");

var PackageInfo = require("./package_info");

var apidocPostmanV21 = require('./apidocToPostmanV21');

var defaults = {
  dest: path.join(__dirname, "../doc/"),
  template: path.join(__dirname, "../template/"),

  debug: false,
  silent: false,
  verbose: false,
  simulate: false,
  parse: false, // Only parse and return the data, no file creation.
  colorize: true,
  markdown: true,
  config: "./",
  apiprivate: false,
  encoding: "utf8"
};

var app = {
  log: {},
  markdownParser: null,
  options: {}
};

// Display uncaught Exception.
process.on("uncaughtException", function(err) {
  console.error(new Date().toUTCString() + " uncaughtException:", err.message);
  console.error(err.stack);
  process.exit(1);
});

/**
 * Create Postman collection
 *
 * @param  {Object} options See defaults and apidoc-core defaults for all options / `apidoc --help`
 * @returns {Mixed} true = ok, but nothing todo | false = error | Object with parsed data and project-informations.
 */
function createCollection(options) {
  var api;
  var apidocPath = path.join(__dirname, "../");
  var markdownParser;
  var packageInfo;

  options = _.defaults({}, options, defaults);

  // Paths.
  options.dest = path.join(options.dest, "./");
  options.template = path.join(options.template, "./");

  // Line-Ending.
  if (options.lineEnding) {
    if (options.lineEnding === "CRLF") options.lineEnding = "\r\n";
    // win32
    else if (options.lineEnding === "CR") options.lineEnding = "\r";
    // darwin
    else options.lineEnding = "\n"; // linux
  }

  // Options.
  app.options = options;

  // Logger.
  app.log = new winston.Logger({
    transports: [
      new winston.transports.Console({
        level: app.options.debug ? "debug" : app.options.verbose ? "verbose" : "info",
        silent: app.options.silent,
        prettyPrint: true,
        colorize: app.options.colorize,
        timestamp: false
      })
    ]
  });

  // Markdown Parser: enable / disable / use a custom parser.
  if (app.options.markdown === true) {
    markdownParser = new Markdown({
      breaks: false,
      html: true,
      linkify: false,
      typographer: false
    });
  } else if (app.options.markdown !== false) {
    // Include custom Parser @see MARKDOWN.md and test/fixtures/custom_markdown_parser.js
    Markdown = require(app.options.markdown); // Overwrite default Markdown.
    markdownParser = new Markdown();
  }
  app.markdownParser = markdownParser;

  try {
    packageInfo = new PackageInfo(app);

    // generator information
    var json = JSON.parse(fs.readFileSync(apidocPath + "package.json", "utf8"));
    apidoc.setGeneratorInfos({
      name: json.name,
      time: new Date(),
      url: json.homepage,
      version: json.version
    });
    apidoc.setLogger(app.log);
    apidoc.setMarkdownParser(markdownParser);
    apidoc.setPackageInfos(packageInfo.get());

    api = apidoc.parse(app.options);

    if (api === true) {
      app.log.info("Nothing to do.");
      return true;
    }
    if (api === false) return false;

    if (app.options.parse !== true) {
      var apidocData = JSON.parse(api.data);
      var projectData = JSON.parse(api.project);

      api["postmanCollection"] = JSON.stringify(apidocPostmanV21.toCollection(apidocData, projectData));

      createOutputFile(api);
    }

    app.log.info("Done.");
    return api;
  } catch (e) {
    app.log.error(e.message);
    if (e.stack) app.log.debug(e.stack);
    return false;
  }
}

/**
 * Save parsed data to postman.json file
 *
 * Adapted from createOutputFiles(api) of original apidoc/lib/index.js
 *
 * @param {Object[]} blocks
 * @param {Object} packageInfos
 */
function createOutputFile(api) {
  if (app.options.simulate) app.log.warn("!!! Simulation !!! No file or dir will be copied or created.");

  app.log.verbose("create dir: " + app.options.dest);
  if (!app.options.simulate) fs.mkdirsSync(app.options.dest);

  // Write Postman collection
  app.log.verbose("write Postman collection file: " + app.options.dest + "postman.json");
  if (!app.options.simulate) fs.writeFileSync(app.options.dest + "./postman.json", api.postmanCollection);
}

module.exports = {
  createCollection: createCollection
};
