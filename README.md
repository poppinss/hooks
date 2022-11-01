# @poppinss/hooks
> A simple, yet effective implementation for executing hooks around an event.

[![gh-workflow-image]][gh-workflow-url] [![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url] [![synk-image]][synk-url]

Hooks is a zero dependency implementation for running lifecycle hooks around an event. Following are some of the notable features.

- Register and run lifecycle hooks.
- Hooks can return cleanup functions that are executed to perform the cleanup.
- Alongside "hooks as functions", you can also register hook providers, which encapsulates event handlers inside a class.
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

## Running hooks
You can execute hooks using the Hooks Runner. You can create a new instance of the runner by calling the `hooks.runner` method and pass the event name for which you want to execute hooks.

```ts
const hooks = new Hooks()

const runner = hooks.runner('saving')
await runner.run()
```

### Passing data to hooks
You can pass one or more arguments to the `runner.run` method, which inturn will be shared with the hook callbacks. For example:

```ts
const hooks = new Hooks()

hooks.add('saving', function (model, transaction) {
})

const runner = hooks.runner('saving')
await runner.run(model, transaction)
```

## Cleanup functions
Cleanup functions allows hooks to cleanup after themselves after the main action finishes successfully or with an error. Let's consider a real world example of saving a model to the database.

- You will first run the `saving` hooks.
- Assume one of the `saving` hooks writes some files to the disk.
- Next, you issue the insert query to the database and the query fails.
- The hook that has written files to the disk would want to remove those files as the main operation got cancelled with an error.

Following is how you can express that with cleanup functions.

```ts
hooks.add('saving', function () {
  await fs.writeFile()

  // Return the cleanup function
  return (error) => {
    // In case of error, remove file
    if (error) {
      await fs.unlink()
    }
  }
})
```

The code responsible for issuing the insert query should run hooks as follows.

```ts
const runner = hooks.runner('saving')
await runner.run(model)

try {
  await model.save()
} catch (error) {
  // Perform cleanup and pass error
  await runner.cleanup(error)
  throw error
}

// Perform cleanup in case of success as well
await runner.cleanup()
```

> **Note:** The `runner.cleanup` method is idempotent, therefore you can call it multiple times and yet it will run the underlying cleanup methods only once.

## Hook Providers
Hook providers are classes with the event lifecycle methods on them. Providers are great when you want to listen for multiple events to create a single cohesive feature. Again, taking the example of models, you can create a hook provider to listen for all the hooks and manage a changelog of table columns.

```ts
class ChangeSetProvider {
  created() {
    // listens for created event
  }

  updated() {
    // listens for updated event
  }

  deleted() {
    // listens for deleted event
  }
}
```

Next, register the provider as follows.

```ts
hooks.provider(ChangeSetProvider)
```

Run hooks

```ts
await hooks.runner('created').run()
await hooks.runner('updated').run()
await hooks.runner('deleted').run()
```

## Run without hook handlers
You can exclude certain hook handlers from executing using the `without` method.

In the following example, we run hooks without executing the `generateDefaultAvatar` hook handler. As you can notice, you can specify function as a string.

```ts
hooks.add('saving', function hashPassword () {})
hooks.add('saving', function generateDefaultAvatar () {})

await hooks
  .runner('saving')
  .without(['generateDefaultAvatar'])
  .run()
```

With hook providers, you can specify the provider class and the method name.

```ts
class ChangeSetProvider {
  created() {}
}

hooks.provider(ChangeSetProvider)

await hooks
  .runner('created')
  .without(['ChangeSetProvider.created'])
  .run()
```

## Custom executors
The hooks runner allows you to define custom executors for calling the hook callback functions or the provider lifecycle methods. They are helpful, when you want to tweak how a method should run.

For example: AdonisJS uses the IoC container to call the provider lifecycle methods.

In the following example, the custom executor is responsible for calling the hook callback functions.

```ts
hooks.add('saving', function hashPassword () {})
hooks.add('saving', function generateDefaultAvatar () {})

hooks
  .runner('saving')
  .executor((handler, isCleanupFunction, ...data) => {
    console.log(handler.name)
    return handler(...data)
  })
  .run(model)
```

Similarly, you can also define a custom executor for the provider classes.

```ts
class ChangeSetProvider {
  created() {}
}

hooks.provider(ChangeSetProvider)

await hooks
  .runner('created')
  .providerExecutor((Provider, event, ...data) => {
    const provider = new Provider()
    if (typeof provider[event] === 'function') {
      return provider[event](...data)
    }
  })
  .run(model)
```

## Event types
You can also specify the types of supported events and their arguments well in advance as follows.

The first step is to define a type for all the events.

```ts
type Events = {
  saving: [
    [BaseModel], // for hook handler
    [error: Error | null, BaseModel] // for cleanup function
  ],
  finding: [
    [QueryBuilder], // for hook handler
    [error: Error | null, QueryBuilder] // for cleanup function
  ],
}
```

And then pass it as a generic to the `Hooks` class.

```ts
const hooks = new Hooks<Events>()
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
