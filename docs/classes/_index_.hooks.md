[@poppinss/hooks](../README.md) › ["index"](../modules/_index_.md) › [Hooks](_index_.hooks.md)

# Class: Hooks

Exposes the API to register before/after lifecycle hooks for a given action
with option to resolve handlers from the IoC container.

The hooks class doesn't provide autocomplete for actions and the arguments
the handler will receive, since we expect this class to be used internally
for user facing objects.

## Hierarchy

* **Hooks**

## Index

### Constructors

* [constructor](_index_.hooks.md#constructor)

### Methods

* [add](_index_.hooks.md#add)
* [clear](_index_.hooks.md#clear)
* [exec](_index_.hooks.md#exec)
* [remove](_index_.hooks.md#remove)

## Constructors

###  constructor

\+ **new Hooks**(`_resolver?`: IocResolverContract): *[Hooks](_index_.hooks.md)*

**Parameters:**

Name | Type |
------ | ------ |
`_resolver?` | IocResolverContract |

**Returns:** *[Hooks](_index_.hooks.md)*

## Methods

###  add

▸ **add**(`lifecycle`: "before" | "after", `action`: string, `handler`: HooksHandler | string): *this*

Register hook handler for a given event and lifecycle

**Parameters:**

Name | Type |
------ | ------ |
`lifecycle` | "before" &#124; "after" |
`action` | string |
`handler` | HooksHandler &#124; string |

**Returns:** *this*

___

###  clear

▸ **clear**(`lifecycle`: "before" | "after", `action?`: undefined | string): *void*

Remove a pre-registered handler

**Parameters:**

Name | Type |
------ | ------ |
`lifecycle` | "before" &#124; "after" |
`action?` | undefined &#124; string |

**Returns:** *void*

___

###  exec

▸ **exec**(`lifecycle`: "before" | "after", `action`: string, ...`data`: any[]): *Promise‹void›*

Executes the hook handler for a given action and lifecycle

**Parameters:**

Name | Type |
------ | ------ |
`lifecycle` | "before" &#124; "after" |
`action` | string |
`...data` | any[] |

**Returns:** *Promise‹void›*

___

###  remove

▸ **remove**(`lifecycle`: "before" | "after", `action`: string, `handler`: HooksHandler | string): *void*

Remove a pre-registered handler

**Parameters:**

Name | Type |
------ | ------ |
`lifecycle` | "before" &#124; "after" |
`action` | string |
`handler` | HooksHandler &#124; string |

**Returns:** *void*
