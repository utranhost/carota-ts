declare module 'per' {
  type Emitter<T> = (value: T) => boolean | void;
  type Consumer<T, V> = (emit: Emitter<T>, value: V) => boolean | void;
  type Producer<T> = (emit: Emitter<T>) => boolean | void;
  type Mapper<T, U> = ((value: T) => U) | keyof T;
  type Predicate<T> = ((value: T) => boolean) | string;
  type Reducer<T, U> = (acc: U, value: T) => U;

  interface Per<T> {
    forEach(callback: (value: T) => void): Per<T>;
    per<V>(valOrFunc: Per<V> | Consumer<V, T> | V[], bindThis?: unknown): Per<V>;
    map<U>(mapFunc: Mapper<T, U>): Per<U>;
    filter(predicate: Predicate<T>): Per<T>;
    concat(second: Per<T> | T[] | Consumer<T, T>, secondThis?: unknown): Per<T>;
    skip(count: number): Per<T>;
    take(count: number): Per<T>;
    listen(untilFunc: (value: T) => boolean): Per<T>;
    flatten(): Per<unknown>;
    reduce<U>(reducer: Reducer<T, U>, seed: U): Per<U>;
    reduce(reducer: Reducer<T, T>): Per<T>;
    multicast(destinations: Array<Per<unknown> | Consumer<unknown, unknown>>): Per<T>;
    into(ar: T[], limit?: number): Per<T>;
    monitor(data: { count?: number | ((n: number) => void); first?: T | ((v: T) => void); last?: T | ((v: T) => void); limit?: number }): Per<T>;
    submit(value?: unknown): boolean | void;
    all(): T[];
    first(): T | undefined;
    last(): T | undefined;
    truthy(): Per<T>;
    min(): Per<number>;
    max(): Per<number>;
    sum(): Per<number>;
    and(): Per<boolean>;
    or(): Per<boolean>;
    not(): Per<boolean>;
  }

  interface PerStatic {
    <T>(valOrFunc: Producer<T>, bindThis?: unknown): Per<T>;
    <T>(valOrFunc?: Per<T> | T[] | T | Consumer<T, T>, bindThis?: unknown): Per<T>;
    pulse(ms: number): Per<number>;
  }

  const per: PerStatic;
  export = per;
}
