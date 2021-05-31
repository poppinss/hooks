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
- [API](#api)
    - [add(lifecycle: 'before' | 'after', action: string, handler: Function | string)](#addlifecycle-before--after-action-string-handler-function--string)
    - [exec(lifecycle: 'before' | 'after', action: string, ...data: any[])](#execlifecycle-before--after-action-string-data-any)
    - [remove (lifecycle: 'before' | 'after', action: string, handler: HooksHandler | string)](#remove-lifecycle-before--after-action-string-handler-hookshandler--string)
    - [clear(lifecycle: 'before' | 'after', action?: string)](#clearlifecycle-before--after-action-string)
    - [merge (hooks: Hooks): void](#merge-hooks-hooks-void)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## How it works?

The hooks class exposes the API to `register`, `remove` and `exec` lifecycle hooks for any number of actions or events. The class API is meant to be used internally and not by the user facing code and this gives you the chance to improve the hooks DX.

For example: The Lucid models uses this class internally and expose `before` and `after` methods on the model itself. Doing this, Lucid can control the autocomplete, type checking for the `before` and `after` methods itself, without relying on this package to expose the generics API.

> Also generics increases the number of types Typescript has to generate and it's better to avoid them whenever possible.

## Installation

Install the package from npm registry as follows:

```sh
npm i @poppinss/hooks

# yarn
yarn add @poppinss/hooks
```

## Usage

Use it as follows

```ts
import { Hooks } from '@poppinss/hooks'
const hooks = new Hooks()

hooks.add('before', 'save', function () {})

// Later invoke before save hooks
await hooks.exec('before', 'save', { id: 1 })
```

If you want the end user to define IoC container bindings as the hook handler, then you need to pass the `IoC` container resolver to the Hooks constructor. Following is the snippet from Lucid models.

```ts
import { Ioc } from '@adonisjs/fold'
const ioc = new Ioc()
const resolver = ioc.getResolver(undefined, 'modelHooks', 'App/Models/Hooks')

const hooks = new Hooks(resolver)
```

The resolver allows the end user to pass the hook reference as string and hooks must live inside `App/Models/Hooks` folder.

```ts
hooks.add('before', 'save', 'User.encryptPassword')
```

## API

#### add(lifecycle: 'before' | 'after', action: string, handler: Function | string)

Add a new hook handler.

```ts
hooks.add('before', 'save', (data) => {
  console.log(data)
})
```

#### exec(lifecycle: 'before' | 'after', action: string, ...data: any[])

Execute a given hook for a selected lifecycle.

```ts
hooks.exec('before', 'save', { username: 'virk' })
```

#### remove (lifecycle: 'before' | 'after', action: string, handler: HooksHandler | string)

Remove an earlier registered hook. If you are using the IoC container bindings, then passing the binding string is enough, otherwise you need to store the reference of the function.

```ts
function onSave() {}

hooks.add('before', 'save', onSave)

// Later remove it
hooks.remove('before', 'save', onSave)
```

#### clear(lifecycle: 'before' | 'after', action?: string)

Clear all hooks for a given lifecycle and optionally an action.

```ts
hooks.clear('before')

// Clear just for the save action
hooks.clear('before', 'save')
```

#### merge (hooks: Hooks): void

Merge hooks from an existing hooks instance. Useful during class inheritance.

```ts
const hooks = new Hooks()
hooks.add('before', 'save', function () {})

const hooks1 = new Hooks()
hooks1.merge(hooks)

await hooks1.exec('before', 'save', [])
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
