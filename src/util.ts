export type EventHandler<T extends unknown[] = []> = ((...args: T) => void) & { fire: (...args: T) => void };

export function event<T extends unknown[] = []>(): EventHandler<T> {
  const handlers: ((...args: T) => void)[] = [];

  const subscribe: EventHandler<T> = function (this: void, handler: (...args: T) => void) {
    handlers.push(handler);
  } as unknown as EventHandler<T>;

  subscribe.fire = function (...args: T) {
    handlers.forEach(function (handler) {
      handler.apply(null, args);
    });
  };

  return subscribe;
}

export function derive<T extends object, U extends object>(proto: U, methods: T): T & U {
  const properties: PropertyDescriptorMap = {};
  (Object.keys(methods) as (keyof T)[]).forEach(function (name) {
    properties[name as string] = { value: methods[name] };
  });
  return Object.create(proto, properties) as T & U;
}
