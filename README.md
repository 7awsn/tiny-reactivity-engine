# TinyReactivityEngine

Uma mini engine de reatividade em TypeScript, feita do zero pra entender como signals e effects
funcionam por dentro. Inspirada em SolidJS, Vue 3 e React Signals.

```ts
const count = signal(0)

effect(() => {
  console.log(`count changed: ${count.value}`)
})

count.value++
count.value++
```

```
count changed: 0
count changed: 1
count changed: 2
```

O effect roda uma vez e depois se re-executa sozinho toda vez que um valor que ele leu muda.
Ninguém ligou `count` ao effect na mão.

## A ideia

São dois primitivos:

- **signal**: um valor que você lê e escreve.
- **effect**: uma função que lê signals e roda de novo quando algum deles muda.

## Como as dependências são rastreadas

O truque é uma variável global que aponta pro effect que está rodando no momento:

```ts
let activeSub: Subscriber | null = null
```

Quando um effect roda, ele se coloca em `activeSub` e chama a função. Toda leitura `signal.value`
durante essa execução chama `track()`, e como `activeSub` aponta pro effect atual, o signal sabe
quem o leu e guarda numa lista de subscribers. Quando o valor muda, ele avisa essa lista
(`trigger`) e os effects rodam de novo. Se o valor novo for igual ao antigo (`Object.is`), nada
acontece.

```ts
function runWithSub(sub, fn) {
  cleanup(sub)
  const prev = activeSub
  activeSub = sub
  try { return fn() }
  finally { activeSub = prev }
}
```

Antes de cada execução o effect limpa as dependências antigas e reconstrói. Assim um signal lido
só dentro de um `if` se desinscreve sozinho quando aquele ramo para de rodar.

É o mesmo mecanismo por trás de SolidJS e Vue 3: um observador global que os signals registram
durante a leitura, pra atualizar só o que realmente depende do valor.

## Extras

- **computed(fn)**: valor derivado com cache, só recalcula quando é lido e alguma dependência mudou.
- **dispose**: `effect()` devolve uma função que cancela ele.
- **batch(fn)**: junta várias escritas pra rodar os effects uma vez só no fim.

## Estrutura

```
src/
  signal.ts     signal() e a classe Signal
  effect.ts     effect(), batch() e o rastreamento
  computed.ts   computed()
  index.ts      exports
examples/
```

## Rodando

```bash
npm install
npm run example:basic
npm run example:computed
npm run example:batch
```

## Licença

MIT
