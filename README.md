# apidoc-postman

> Use [apiDoc](http://apidocjs.com/) to create a [Postman](https://www.getpostman.com) collection.

[![license](https://img.shields.io/github/license/panz3r/apidoc-postman.svg)](https://github.com/panz3r/apidoc-postman/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/panz3r/apidoc-postman.svg)](https://travis-ci.org/panz3r/apidoc-postman)
[![npm](https://img.shields.io/npm/v/@panz3r/apidoc-postman.svg)](https://www.npmjs.com/package/@panz3r/apidoc-postman)

This library uses the [apidoc-core](https://github.com/apidoc/apidoc-core) library.

## How It Works

By putting `apiDoc` inline comments in the source code, you will get a `postman.json` file which can be imported into the [Postman App](https://www.getpostman.com/apps) to create a new collection.

E.g.

```js
/**
 * @api {get} /user/id Request User information
 * @apiName GetUser
 * @apiGroup User
 * @apiPermission basic
 *
 * @apiParam {Number} id Users unique ID.
 *
 * @apiSuccess {String} firstname Firstname of the User.
 * @apiSuccess {String} lastname  Lastname of the User.
 */
```

## Installation

`npm install @panz3r/apidoc-postman`

## Features

`apidoc-postman` takes full advantage of [Postman environment variables](https://www.getpostman.com/docs/v6/postman/environments_and_globals/variables) for the following aspects

### API URL

Using the `base_url` environment variable you can specify the base URL of your APIs.

### Authentication

`apidoc-postman` uses a simple logic to map your endpoints permissions to `Postman` ones.

You can set your endpoint `@apiPermission` to `basic` to have a `Basic` authentication on `Postman`, otherwise the `Bearer` authentication will be used by creating a reference to an environment variable called `<@apiPermission>_token`.

E.g. `@apiPermission user` maps to `user_token`.

**N.B:** At the moment only `Basic` and `Bearer` authentications are supported

### Body

At the moment, `apidoc-postman` will setup `Postman` to use `application/json` body format.

## Example

`apidoc-postman -i example/ -o doc/`

Have a look at [apiDoc](http://apidocjs.com/#params) for full functionality overview and capabilities of apiDoc.

### Base Postman Environment setup

```json
{
  "base_url": "https://localhost:8000/api/v1",
  "basic_username": "basic_auth_username",
  "basic_password": "basic_auth_password",
  "user_token": "a.user.bearer.token"
}
```

---

Made with :sparkles: & :heart: by [Mattia Panzeri](https://github.com/panz3r) and [contributors](https://github.com/panz3r/apidoc-postman/graphs/contributors)
