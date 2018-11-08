# Development

## Local setup

Assuming you have nodejs and npm installed.

- Clone repository
- Run `npm install`
- Run `npm start` to run a development build.

By default client will connect to staging server.
If you want to use a different server, run `PEERIO_STAGING_SOCKET_SERVER=\"wss://your_url\" npm run start-dev`.


## Linking the SDK (icebear)

Sometimes you might want to work on both desktop app and sdk at the same time and see changes you make in sdk reflected in your desktop development build immediately. To make this happen:

- Clone `peerio-icebear`
- Run `npm link` in the `peerio-icebear` root (this needs to be done once per clone, effectively it symlinks the clone to the npm global packages folder).
- Copy `.opt-in.example` file in `peerio-desktop` to `.opt-in` file (it's gitignored).
- Make sure `.opt-in` file contains line `link-sdk`. 
(see **git hooks** below for more info on the `.opt-in` file). 

We use manual linking, meaning that build scripts will copy sdk sources from the globally symliked package to desktop's `node_modules` every time the build is running. Build scripts will also watch and copy/rebuild sdk when needed.

**Beware:** Don't ever use a development SDK with production servers, especially not with your own account (you could break it permanently due to possible incompatibilities in data formats).

## git hooks

There are several git hooks configured. Some of them are optional, and you can opt in by creating `.opt-in` file in repository root.

`.opt-in` file should contain optional task names that are configured to run with different hooks, one per line:
* `link-sdk` will copy latest icebear sdk sources from local clone before building sdk sources. It will also watch local sdk clone for changes when using `npm start`
* `lint` will run code tests and validation before commit. Commit will fail if there are any issues.
* `npm-install` to never ever forget to run `npm install` after package.json was changed in result of branch change/merge/pull.

There is already a file in the repo root called `.opt-in.example` which you can copy or use as an example.

## Localization

Localization strings source file is located at `peerio-icebear/src/copy/en.json`. We use our own localization library `peerio-translator`.

## UI Tests

We validate our code with eslint, stylelint, typescript, unit tests, e2e cucumber tests with Spectron.

### CI

Tests run on CircleCI for every pull request. 

### Local tests / VSCode debugger

To run and debug indvidual test files locally, make sure to compile sources first... and to set environment variables `PEERIO_DESKTOP_STAGING_TEST_USERNAME`, `PEERIO_DESKTOP_STAGING_TEST_PASSPHRASE`, `PEERIO_DESKTOP_PROD_TEST_USERNAME`, `PEERIO_DESKTOP_PROD_TEST_PASSPHRASE` in order to skip needing to create an account that will run the tests.

To configure VSCode to run each individual test in the debugger, add the following configuration:

```json
{
    "type": "node",
    "request": "launch",
    "name": "Spectron",
    "console": "integratedTerminal",
    "cwd":"${workspaceRoot}",
    "program": "${workspaceRoot}/node_modules/mocha/bin/_mocha",
    "args": [
        "${relativeFile}",
        "--require=${workspaceRoot}/test/global-setup.js",
        "--colors",
        "--reporter=nyan"
    ]
}
```

