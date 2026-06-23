import { track, trigger, runWithSub, type Subscriber } from './effect'

export interface ReadonlySignal<T> {
  readonly value: T
}

export function computed<T>(fn: () => T): ReadonlySignal<T> {
  let value: T
  let dirty = true
  const subscribers = new Set<Subscriber>()

  const sub: Subscriber = {
    deps: new Set(),
    run() {
      if (dirty) return
      dirty = true
      trigger(subscribers)
    },
  }

  return {
    get value(): T {
      if (dirty) {
        value = runWithSub(sub, fn)
        dirty = false
      }
      track(subscribers)
      return value
    },
  }
}
