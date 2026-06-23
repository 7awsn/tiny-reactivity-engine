import { signal, computed, effect } from '../src/index'

const price = signal(10)
const quantity = signal(2)

const total = computed(() => price.value * quantity.value)

effect(() => {
  console.log(`total: ${total.value}`)
})

price.value = 20
quantity.value = 3

// total: 20
// total: 40
// total: 60
