export interface Subscriber {
  run(): void
  deps: Set<Set<Subscriber>>
}

let activeSub: Subscriber | null = null

let batchDepth = 0
const pending = new Set<Subscriber>()

export function track(subscribers: Set<Subscriber>): void {
  if (!activeSub) return
  subscribers.add(activeSub)
  activeSub.deps.add(subscribers)
}

export function trigger(subscribers: Set<Subscriber>): void {
  for (const sub of [...subscribers]) {
    if (batchDepth > 0) pending.add(sub)
    else sub.run()
  }
}

export function runWithSub<T>(sub: Subscriber, fn: () => T): T {
  cleanup(sub)
  const prev = activeSub
  activeSub = sub
  try {
    return fn()
  } finally {
    activeSub = prev
  }
}

export function batch<T>(fn: () => T): T {
  batchDepth++
  try {
    return fn()
  } finally {
    batchDepth--
    if (batchDepth === 0) flush()
  }
}

function flush(): void {
  const subs = [...pending]
  pending.clear()
  for (const sub of subs) sub.run()
}

function cleanup(sub: Subscriber): void {
  for (const dep of sub.deps) dep.delete(sub)
  sub.deps.clear()
}

export function effect(fn: () => void): () => void {
  const sub: Subscriber = {
    deps: new Set(),
    run() {
      runWithSub(sub, fn)
    },
  }
  sub.run()
  return () => cleanup(sub)
}
