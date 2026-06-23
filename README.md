# tiny-reactivity-engine

Uma mini engine de reatividade feita do zero em TypeScript, inspirada nas ideias por trás de
**SolidJS**, **Vue 3** e **React Signals**.

A engine inteira cabe em poucos arquivos pequenos. O objetivo não é competir com essas
bibliotecas, e sim mostrar como o rastreamento automático de
dependências funciona.

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

O effect roda uma vez na criação e depois se re-executa sozinho sempre que um valor que ele leu
muda. Ninguém ligou `count` ao effect manualmente, a dependência foi descoberta em tempo de
execução.

## O que é reatividade?

A ideia é simples: você liga um valor a um pedaço de código uma vez, e ele roda de novo sozinho
toda vez que esse valor muda. Você não precisa lembrar de chamar nenhuma atualização na mão.

Dois primitivos bastam:

- **signal** — um contêiner de valor que você lê e escreve.
- **effect** — uma função que lê signals e re-executa automaticamente quando algum deles muda.

## Como o rastreamento de dependências funciona

Não há compilador nem análise do seu código. Tudo depende de **uma única variável
compartilhada: o effect em execução no momento**.

```ts
let activeSub: Subscriber | null = null
```

O fluxo é:

1. Ao rodar, o effect se define como `activeSub`, chama sua função e restaura o valor anterior.
2. Durante a execução, cada leitura `signal.value` chama `track()`. Como `activeSub` aponta para
   o effect em execução, o signal sabe exatamente quem o leu e o adiciona ao seu conjunto de
   subscribers.
3. O effect também guarda em quais conjuntos entrou, para conseguir se desinscrever depois.

```ts
function runWithSub(sub, fn) {
  cleanup(sub)            // descarta as inscrições da execução anterior
  const prev = activeSub
  activeSub = sub         // "eu sou o leitor atual"
  try { return fn() }     // toda leitura durante fn() se inscreve em `sub`
  finally { activeSub = prev }
}
```

Na escrita, `signal.value = x` atualiza o valor e notifica os subscribers (`trigger`). Se o novo
valor for igual ao antigo (`Object.is`), nada acontece.. e é isso que evita re-execuções
desnecessárias.

Dois detalhes deixam o mecanismo robusto:

- **Cleanup antes de cada execução.** As dependências são limpas e reconstruídas a cada run, então
  um effect que lê um signal só dentro de um `if` se desinscreve sozinho quando aquele ramo deixa
  de rodar. Sem inscrições órfãs.
- **Links bidirecionais.** Cada signal conhece seus subscribers, e cada effect conhece os
  conjuntos a que pertence. Isso torna notificação e cleanup O(deps).

É essencialmente o mesmo mecanismo que Vue 3 e SolidJS usam internamente: um "observador ativo"
global ao qual os signals se ligam durante as leituras.

## Extras

Todos opcionais e pequenos:

- **`computed(fn)`** — valor derivado lazy e com cache. Só recalcula quando é lido *e* alguma
  dependência mudou.
- **dispose** — `effect()` retorna uma função que o desinscreve. Após o dispose, mudanças de valor
  não o disparam mais.
- **`batch(fn)`** — agrupa várias escritas para que os effects dependentes rodem uma vez só no
  final, em vez de a cada escrita.

## Como frameworks modernos usam isso

A mesma ideia move frameworks reais, com a UI no papel de "effect":

- **SolidJS** renderiza componentes rodando-os dentro de effects. Ler um signal no JSX inscreve
  aquele pedaço do DOM, então só o nó exato que depende do valor atualiza — sem virtual DOM.
- **Vue 3** constrói `ref` / `reactive` sobre esse modelo. A render function é um effect; mudar o
  estado reativo re-executa só as renders afetadas.
- **React Signals** trazem o mesmo rastreamento fino ao React, atualizando sem re-render completo.

## Estrutura

```
src/
  signal.ts     signal() e a classe Signal
  effect.ts     effect(), batch() e o runtime de rastreamento
  computed.ts   valores derivados com computed()
  index.ts      exports públicos
examples/
  basic.ts
  computed.ts
  batch.ts
```

## Rodando os exemplos

Requer Node.js 18+.

```bash
npm install

npm run example:basic
npm run example:computed
npm run example:batch
```

Checar tipos:

```bash
npm run typecheck
```

## Licença

MIT
