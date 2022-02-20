<div align="center"><img src="https://res.cloudinary.com/adonisjs/image/upload/q_100/v1557762307/poppinss_iftxlt.jpg" width="600px"></div>

# Hooks

> A no brainer module to execute lifecycle hooks in sequence.

[![gh-workflow-image]][gh-workflow-url] [![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url] [![synk-image]][synk-url]

I find myself re-writing the code for hooks in multiple packages, so decided to extract it to it's own module, that can be re-used by other modules of AdonisJS.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of contents

- [How it works?](#how-it-works)
- [Installation](#installation)
- [Usage](#usage)
- [Removing `before` and `after` calls with cleanup functions](#removing-before-and-after-calls-with-cleanup-functions)
    - [Scanerio with hooks](#scanerio-with-hooks)
  - [Scanerio with cleanup functions](#scanerio-with-cleanup-functions)
- [Passing data to hooks](#passing-data-to-hooks)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## How it works?

The hooks class exposes the API to `register`, `remove` and `exec` lifecycle hooks for any number of actions or events. The class API is meant to be used internally and not by the user facing code and this gives you the chance to improve the hooks DX.

For example: The Luciod models uses this internally and exposes the API to register lifecycle hooks around model actions like `creating`, `created`, `deleting`, `deleted` and so on.

## Installation

Install the package from npm registry as follows:

```sh
npm i @poppinss/hooks@next

# yarn
yarn add @poppinss/hooks@next
```

## Usage

Use it as follows

```ts
import { Hooks } from '@poppinss/hooks'
const hooks = new Hooks()

hooks.add('creating', function () {})
hooks.add('created', function () {})

const runner = hooks.runner('creating')
try {
  await runner.run() // pass data here
} finally {
  await runner.cleaup() // pass data here
}
```

## Removing `before` and `after` calls with cleanup functions
Usually hooks are modeled around `before` and `after` events. Also, the previous versions of this package also allowed registering before and after lifecycle hooks. However, I have recently removed support for that because of the following reasons.

The `before` and `after` lifecycle hooks will always be prone to errors. Let's consider the following scanerio.

#### Scanerio with hooks
We have the following `before` hooks.

```ts
hooks.add('before', 'save', function () {
  createTemporaryResource()
})

hooks.add('before', 'save', function () {
  createAnotherTemporaryResource()
})

hooks.add('after', 'save', function () {
  removeFirstTemporaryResource()
})

hooks.add('after', 'save', function () {
  removeSecondTemporaryResource()
})
```

**Now let's save the operation around which the lifecycle hooks were registered fails. Should we fire the `after` hooks?**

- If no, then temporary resources will be never be removed
- If yes, then we will end up in the stable state.

**However, what happens if the second before hook fails?** Now should we call all the `after` hooks or not? 

- If yes, then the `removeSecondTemporaryResource` may error out since its `before` action was never completed.
- If not, then again we will end up in a dirty state from the first `before` hook.

As I mentioned earlier, the `before` and `after` hooks have no direct relationship and hence there is no correct way to call only the `after` hooks for which the `before` hooks completed successfully.

Therefore, by removing the concept of `before` and `after` and using cleanup functions, we will be able to design a more robust hooks system.

### Scanerio with cleanup functions
Now, in the following API, the hooks themselves are responsible for returning the cleanup functions.

If the second hook fails, then we will only call the cleanup function for the first hook.

```ts
hooks.add('save', function () {
  createTemporaryResource()
  return removeFirstTemporaryResource
})

hooks.add('save', function () {
  createAnotherTemporaryResource()
  return removeSecondTemporaryResource
})
```

Also, the cleanup hooks runs in the reverse order. So the cleanup function for the first hook will run last.

## Passing data to hooks
You can pass data to hooks at the time of running the `run` and the `cleanup` functions. For example.

```ts
import { Hooks } from '@poppinss/hooks'
const hooks = new Hooks()

hooks.add('creating', function (arg1, arg2, arg3) {})
hooks.add('creating', function (arg1, arg2, arg3) {})
hooks.add('creating', function (arg1, arg2, arg3) {})

const runner = hooks.runner('creating')
await runner.run('arg1', 'arg2', 'arg3')
```

It is usually helpful to inform the cleanup functions if there was an error or not. Maybe some cleanup functions may not to run only in case of errors.

```ts
const hooks = new Hooks()

hooks.add('creating', function (model) {
  const file = await saveFileToDisk()
  model.filePath = file

  return (error, model) => {
    if (error) {
      await removeFileFromDisk(model.filePath)
    }
  }
})

const runner = hooks.runner('creating')
try {
  // Run hooks
  await runner.run(model)

  // Run the actual action
  await model.save()
} catch (error) {
  // During error
  await runner.cleaup(error, model)
}

/**
 * During success
 */
if (runner.isCleanupPending) {
  await runner.cleaup(null, model)
}
```

[gh-workflow-image]: https://img.shields.io/github/workflow/status/poppinss/hooks/test?style=for-the-badge
[gh-workflow-url]: https://github.com/poppinss/hooks/actions/workflows/test.yml "Github action"

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: "typescript"

[npm-image]: https://img.shields.io/npm/v/@poppinss/hooks.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@poppinss/hooks 'npm'

[license-image]: https://img.shields.io/npm/l/@poppinss/hooks?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md 'license'

[synk-image]: https://img.shields.io/snyk/vulnerabilities/github/poppinss/hooks?label=Synk%20Vulnerabilities&style=for-the-badge
[synk-url]: https://snyk.io/test/github/poppinss/hooks?targetFile=package.json 'synk'
