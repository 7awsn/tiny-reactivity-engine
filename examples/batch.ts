import { signal, effect, batch } from '../src/index'

const first = signal('Ada')
const last = signal('Lovelace')

const dispose = effect(() => {
  console.log(`${first.value} ${last.value}`)
})

batch(() => {
  first.value = 'Grace'
  last.value = 'Hopper'
})

dispose()
last.value = 'Murray Hopper' // ignored, effect disposed

// Ada Lovelace
// Grace Hopper
