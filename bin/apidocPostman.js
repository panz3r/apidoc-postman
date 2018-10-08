#!/usr/bin/env node

"use strict";

/*
 * apidoc
 * http://apidocjs.com
 *
 * Copyright (c) 2013-2016 inveris OHG
 * Author Peter Rottmann <rottmann@inveris.de>
 * Licensed under the MIT license.
 */

var commander = require("commander");
var path = require("path");

var apidocPostman = require("../lib/index");

function collect(v, a) {
  a.push(v);
  return a;
}

var program = commander
  .option("-f --file-filters <file-filters>", "RegEx-Filter to select files that should be parsed (multiple -f can be used).", collect, [])

  .option("-e, --exclude-filters <exclude-filters>", "RegEx-Filter to select files / dirs that should not be parsed (many -e can be used).", collect, [])

  .option("-i, --input <input>",  "Input/source dirname.", collect, [])

  .option("-o, --output <output>", "Output dirname.", "./doc/")

  .option("-t, --template <template>", "Use template for output files.", path.join(__dirname, "../template/"))

  .option("-c, --config <config>", "Path to directory containing config file (apidoc.json).", "./")

  .option("-p, --private", "Include private APIs in output.", false)

  .option("-v, --verbose", "Verbose debug output.", false)

  .option("-d, --debug", "Show debug messages.", false)

  .option("-c, --color", "Turn off log color.", true)

  .option("--parse", "Parse only the files and return the data, no file creation.", false)

  .option("--parse-filters <parse-filters>", "Optional user defined filters. Format name=filename", collect, [])
  .option("--parse-languages <parse-languages>", "Optional user defined languages. Format name=filename", collect, [])
  .option("--parse-parsers <parse-parsers>", "Optional user defined parsers. Format name=filename", collect, [])
  .option("--parse-workers <parse-workers>", "Optional user defined workers. Format name=filename", collect, [])

  .option("-s, --silent", "Turn all output off.", false)

  .option("--simulate", "Execute but not write any file.", false)

  .option("-m, --markdown [markdown]", "Turn off default markdown parser or set a file to a custom parser.", true)

  .option("-l, --line-ending <line-ending>", "Turn off autodetect line-ending. Allowed values: LF, CR, CRLF.")

  .option("--encoding <encoding>", "Set the encoding of the source code. [utf8].", "utf8")

  .parse(process.argv);

/**
 * Transform parameters to object
 *
 * @param {String|String[]} filters
 * @returns {Object}
 */
function transformToObject(filters) {
  if (!filters) return;

  if (typeof filters === "string") filters = [filters];

  var result = {};
  filters.forEach(function(filter) {
    var splits = filter.split("=");
    if (splits.length === 2) {
      var obj = {};
      result[splits[0]] = path.resolve(splits[1], "");
    }
  });
  return result;
}

var options = {
  includeFilters: program.fileFilters.length ? program.fileFilters : [".*\\.(clj|cls|coffee|cpp|cs|dart|erl|exs?|go|groovy|ino?|java|js|jsx|kt|litcoffee|lua|p|php?|pl|pm|py|rb|scala|ts|vue)$"],
  excludeFilters: program.excludeFilters.length ? program.excludeFilters : [""],
  src: program.input.length ? program.input : ["./"],
  dest: program.output,
  template: program.template,
  config: program.config,
  apiprivate: program.private,
  verbose: program.verbose,
  debug: program.debug,
  parse: program.parse,
  colorize: program.color,
  filters: transformToObject(program.parseFilters),
  languages: transformToObject(program.parseLanguages),
  parsers: transformToObject(program.parseParsers),
  workers: transformToObject(program.parseWorkers),
  silent: program.silent,
  simulate: program.simulate,
  markdown: program.markdown,
  lineEnding: program.lineEnding,
  encoding: program.encoding
};

if (apidocPostman.createCollection(options) === false) {
  process.exit(1);
}
