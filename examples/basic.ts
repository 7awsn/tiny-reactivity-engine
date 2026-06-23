import { signal, effect } from '../src/index'

const count = signal(0)

effect(() => {
  console.log(`count changed: ${count.value}`)
})

count.value++
count.value++

// count changed: 0
// count changed: 1
// count changed: 2
