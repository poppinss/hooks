# @poppinss/hooks

> A simple yet effective implementation for executing hooks around an event.

[![gh-workflow-image]][gh-workflow-url] [![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url]

This package is a zero-dependency implementation for running lifecycle hooks around an event. Following are some of the notable features.

- Register and run lifecycle hooks.
- Hooks can return cleanup functions that are executed to perform the cleanup.
- Super lightweight

## Setup

Install the package from the npm packages registry.

```sh
npm i @poppinss/hooks

# yarn lovers
yarn add @poppinss/hooks
```

And import the `Hooks` class as follows.

```ts
import Hooks from '@poppinss/hooks'

const hooks = new Hooks()

hooks.add('saving', function () {
  console.log('called')
})

// Execute hooks using runner
await hooks.runner('saving').run()
```

## Defining hooks

The hooks are defined using the `hooks.add` method. The method accepts the event name and a callback function to execute.

```ts
const hooks = new Hooks()

hooks.add('saving', function () {
  console.log('called')
})
```

You can also define hook as an object with the `name` and the `handle` method property. This is usually helpful when you want to specify a custom name for the hook, or re-use the same handle method multiple times.

```ts
const hooks = new Hooks()

function handleSave() {}

hooks.add('saving', { name: 'beforeSave', handle: handleSave })
hooks.add('creating', { name: 'beforeCreate', handle: handleSave })
```

The `handle` method receives the first argument as the event name, followed by the rest of the arguments supplied during runtime.

## Running hooks

You can execute hooks using the Hooks Runner. You can create a new runner instance by calling the `hooks.runner` method and passing the event name for which you want to execute hooks.

```ts
const hooks = new Hooks()

const runner = hooks.runner('saving')
await runner.run()
```

To run hooks in the reverse order, you can use the `runner.runReverse` method.

```ts
const hooks = new Hooks()

const runner = hooks.runner('saving')
await runner.runReverse()
```

### Passing data to hooks

You can pass one or more arguments to the `runner.run` method, which the runner will share with the hook callbacks. For example:

```ts
const hooks = new Hooks()

hooks.add('saving', function (model, transaction) {})

const runner = hooks.runner('saving')
await runner.run(model, transaction)
```

## Cleanup functions

Cleanup functions allow hooks to clean up after themselves after the main action finishes successfully or with an error. Let's consider a real-world example of saving a model to the database.

- You will first run the `saving` hooks.
- Assume one of the `saving` hooks writes some files to the disk.
- Next, you issue the insert query to the database, and the query fails.
- The hook that has written files to the disk would want to remove those files as the main operation got canceled with an error.

Following is how you can express that with cleanup functions.

```ts
hooks.add('saving', function () {
  await fs.writeFile()

  // Return the cleanup function
  return (error) => {
    // In case of an error, remove the file
    if (error) {
      await fs.unlink()
    }
  }
})
```

The code responsible for issuing the insert query should run hooks as follows.

```ts
const runner = hooks.runner('saving')

try {
  await runner.run(model)
  await model.save()
} catch (error) {
  // Perform cleanup and pass error
  await runner.cleanup(error)
  throw error
}

// Perform cleanup in case of success as well
await runner.cleanup()
```

> **Note**: The `runner.cleanup` method is idempotent. Therefore you can call it multiple times, yet it will run the underlying cleanup methods only once.

## Run without hook handlers

You can exclude certain hook handlers from executing using the `without` method.

In the following example, we run hooks without executing the `generateDefaultAvatar` hook handler. As you can notice, you can specify the function name as a string.

```ts
hooks.add('saving', function hashPassword() {})
hooks.add('saving', function generateDefaultAvatar() {})

await hooks.runner('saving').without(['generateDefaultAvatar']).run()
```

## Event types

You can also specify the types of supported events and their arguments well in advance as follows.

The first step is to define a type for all the events.

```ts
type Events = {
  saving: [
    [BaseModel], // for hook handler
    [error: Error | null, BaseModel], // for cleanup function
  ]
  finding: [
    [QueryBuilder], // for hook handler
    [error: Error | null, QueryBuilder], // for cleanup function
  ]
}
```

And then pass it as a generic to the `Hooks` class.

```ts
const hooks = new Hooks<Events>()
```

[gh-workflow-image]: https://img.shields.io/github/actions/workflow/status/poppinss/hooks/checks.yml?style=for-the-badge
[gh-workflow-url]: https://github.com/poppinss/hooks/actions/workflows/checks.yml 'Github action'
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: "typescript"
[npm-image]: https://img.shields.io/npm/v/@poppinss/hooks.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@poppinss/hooks 'npm'
[license-image]: https://img.shields.io/npm/l/@poppinss/hooks?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md 'license.'
