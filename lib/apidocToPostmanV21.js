/*
 * Copyright (c) 2018 Mattia Panzeri <mattia.panzeri93@gmail.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var _ = require("lodash");

var collectionSchema = {
  info: {
    name: "",
    description: "",
    version: "",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  item: []
};

var HTTP_VERBS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "copy",
  "head",
  "options",
  "link",
  "unlink",
  "purge",
  "lock",
  "unlock",
  "propfind",
  "view"
];

function toCollection(apidocJson, projectJson) {
  // Create Postman collection to be returned - starting from collectionSchema
  var collection = _.cloneDeep(collectionSchema);
  // Set collection info
  setInfo(collection, projectJson);
  // Set collection items
  setItems(collection, apidocJson);

  return collection;
}

function setInfo(collection, projectJson) {
  _.set(collection, "info.name", projectJson.name);
  _.set(collection, "info.description", projectJson.description);
  _.set(collection, "info.version", projectJson.version);
}

function setItems(collection, apidocJson) {
  //console.log({ collection, apidocJson });
  const apiFolders = _.groupBy(apidocJson, "group");
  _.set(
    collection,
    "item",
    _.chain(apiFolders)
      .map((apis, groupName) => _mapApiFolder(groupName, apis))
      .filter(f => f.item.length > 0)
      .value()
  );
}

function _mapApiFolder(groupName, apis) {
  return {
    name: groupName,
    item: _.chain(apis)
      .filter(a => HTTP_VERBS.includes(a.type))
      .sortBy(_httpVerbSorter)
      .map(_mapApiItem)
      .value()
  };
}

function _mapApiItem(apiItem) {
  return {
    name: apiItem.title,
    request: {
      auth: _mapAuth(apiItem),
      method: _.upperCase(apiItem.type),
      url: "{{base_url}}" + apiItem.url,
      header: ["put", "post", "patch"].includes(apiItem.type)
        ? [
            {
              key: "Content-Type",
              value: "application/json"
            }
          ]
        : [],
      body: {
        mode: "raw",
        raw: _mapBody(apiItem)
      }
    }
  };
}

function _mapAuth(apiItem) {
  var permission = _.get(apiItem, "permission[0]");
  if (permission) {
    var isBasicAuth = permission.name === "basic";

    return {
      type: !isBasicAuth ? "bearer" : "basic",
      basic: isBasicAuth
        ? [
            {
              key: "password",
              value: "{{basic_password}}",
              type: "string"
            },
            {
              key: "username",
              value: "{{basic_username}}",
              type: "string"
            },
            {
              key: "showPassword",
              value: false,
              type: "boolean"
            }
          ]
        : [],
      bearer: !isBasicAuth
        ? [
            {
              key: "token",
              value:
                permission.name !== "token"
                  ? "{{" + permission.name + "_token}}"
                  : "{{token}}",
              type: "string"
            }
          ]
        : []
    };
  }

  return null;
}

function _mapParamTypeToObject(apiFieldType) {
  switch (apiFieldType) {
    case "Number":
      return 0;

    case "Date":
      return new Date();

    case "String":
      return "string";

    case "String[]":
      return ["string", "string"];

    case "Object":
      return {
        key: "value"
      };

    case "Object[]":
      return [
        {
          key: "value"
        },
        {
          key: "value"
        }
      ];
  }
}

function _mapBody(apiItem) {
  if (!["put", "post", "patch"].includes(apiItem.type)) {
    return "";
  }

  if (_.has(apiItem, "parameter.fields.Body")) {
    const mappedBody = _.reduce(
      apiItem.parameter.fields.Body,
      (acc, bodyItem) =>
        _.set(acc, bodyItem.field, _mapParamTypeToObject(bodyItem.type)),
      {}
    );
    return JSON.stringify(mappedBody, undefined, 2);
  }

  return "";
}

function _httpVerbSorter(apiItem) {
  return _.findIndex(HTTP_VERBS, function(verb) {
    return verb === apiItem.type;
  });
}

module.exports = {
  toCollection: toCollection
};
