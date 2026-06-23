import { track, trigger, type Subscriber } from './effect'

export class Signal<T> {
  private subscribers = new Set<Subscriber>()

  constructor(private current: T) {}

  get value(): T {
    track(this.subscribers)
    return this.current
  }

  set value(next: T) {
    if (Object.is(next, this.current)) return
    this.current = next
    trigger(this.subscribers)
  }
}

export function signal<T>(initialValue: T): Signal<T> {
  return new Signal(initialValue)
}
