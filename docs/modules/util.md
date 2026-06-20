# util - 工具函数

`util` 模块提供了事件系统和对象派生等基础工具函数。

## 概述

`util` 模块是 Carota 的基础设施层，提供了两个核心工具：

1. **event** — 泛型化的事件系统
2. **derive** — 原型派生工具

## EventHandler 类型

```typescript
type EventHandler<T extends unknown[] = []> = ((...args: T) => void) & {
  fire: (...args: T) => void;
};
```

`EventHandler` 是一个兼具订阅和触发功能的函数：

- 作为函数调用时，注册事件处理器
- 通过 `.fire()` 方法触发所有已注册的处理器

## event 函数

```typescript
function event<T extends unknown[] = []>(): EventHandler<T>
```

创建泛型化的事件实例。

### 基本用法

```typescript
// 创建事件
const onChange = event<[value: string]>();

// 注册处理器
onChange((value) => {
  console.log('值变化:', value);
});

// 触发事件
onChange.fire('新值');
```

### 在 Carota 中的使用

```typescript
// Doc 中的事件
doc.selectionChanged = event<[getFormatting: () => Partial<Formatting>, takeFocus: boolean | undefined]>();
doc.contentChanged = event();

// 注册处理器
doc.selectionChanged((getFormatting, takeFocus) => {
  const fmt = getFormatting();
  console.log('选区格式:', fmt);
});

// 触发事件
doc.selectionChanged.fire(getFormatting, takeFocus);
doc.contentChanged.fire();
```

### 类型安全

`EventHandler` 使用泛型参数确保类型安全：

```typescript
// 无参数事件
const onEmpty = event();

// 单参数事件
const onData = event<[data: string]>();

// 多参数事件
const onMulti = event<[x: number, y: number, flag: boolean]>();
```

## derive 函数

```typescript
function derive<T extends object, U extends object>(proto: U, methods: T): T & U
```

从原型派生新对象，将方法添加到原型链上。

**参数：**
- `proto` — 基础原型对象
- `methods` — 要添加的方法集合

**返回：** 合并了原型和方法的派生对象

### 实现原理

```typescript
function derive(proto, methods) {
  const properties = {};
  Object.keys(methods).forEach(function(name) {
    properties[name] = { value: methods[name] };
  });
  return Object.create(proto, properties);
}
```

使用 `Object.create()` 创建以 `proto` 为原型的新对象，并通过属性描述符将 `methods` 中的方法定义为不可枚举的自身属性。

### 在 Carota 中的使用

`derive` 被广泛用于创建节点原型：

```typescript
// node 模块
export function deriveNode<T>(methods: T): NodePrototype & T {
  return derive(prototype, methods);
}

// frame 模块
const prototype = deriveNode({
  bounds(this: Frame): Rect { ... },
  actualWidth(this: Frame): number { ... },
  draw(this: Frame, ctx, viewPort): void { ... },
  type: 'frame'
});

// codes 模块
const listTerminator = derive(obj, {
  eof: true,
  measure() { return { width: 18, ascent: 0, descent: 0 }; },
  draw() {}
});
```

## 设计理念

### 事件系统

Carota 的事件系统设计为函数式风格：

- 事件本身是一个函数，注册处理器就是调用它
- `.fire()` 方法用于触发，与注册操作分离
- 泛型参数确保处理器和触发的类型一致

### 原型派生

Carota 使用原型继承而非 ES6 class：

- 所有节点共享同一原型上的方法
- `derive` 允许在已有原型基础上扩展
- 属性描述符确保方法不可枚举、不可修改
- 这种模式在性能敏感的布局系统中更高效
