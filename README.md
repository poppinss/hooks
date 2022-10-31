# @poppinss/hooks
> A simple, yet effective implementation for executing hooks around an event.

[![gh-workflow-image]][gh-workflow-url] [![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url] [![synk-image]][synk-url]

Hooks is a zero dependency implementation for running lifecycle hooks around an event. Following are the some of the notable features.

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
The hooks are defined using the `hooks.add` method. The method accepts

## Running hooks

### Passing data to hooks

## Cleanup functions

## Hook Providers

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
