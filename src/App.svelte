<script lang="ts">
  import PartySocket from 'partysocket'
  import { onMount } from 'svelte'
  import type { Summary, Vote } from '../shared/types.ts'
  import * as devalue from 'devalue'

  const ws = new PartySocket({
    host: window.location.host,
    room: 'room1',
    party: 'poll-server',
  })

  let summary = $state<Summary>()
  let selected = $state<string | null>(null)

  onMount(() => {
    ws.addEventListener('message', onMessage)
  })

  function onMessage(event: MessageEvent) {
    summary = devalue.parse(event.data) as Summary
  }

  function vote(value: string) {
    const vote: Vote = { value }

    selected = value

    ws.send(devalue.stringify(vote))
  }
</script>

<main>
  <h1>Poll</h1>

  {#if summary}
    <p>{summary.question}</p>
    <form onsubmit={e => e.preventDefault()}>
      {#each summary.options.values() as option}
        <button class={{selected: selected == option.key}} onclick={() => vote(option.key)}>
          {option.description}
        </button>
      {/each}
    </form>

    <section>
      <svg viewBox="0 0 {summary.max} {summary.tally.size}">
        {#each summary.tally.entries() as [key, value], index}
          <rect class={{selected: key == selected}} x=0 y={index} height=0.9 width={value} style='fill: var(--{summary.options.get(key)?.color})' rx=0.1/>
        {/each}
      </svg>
    </section>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: var(--size-5);
    align-items: flex-start;
  }

  form {
    display: flex;
    gap: var(--size-4);
  }

  button.selected {
    background: var(--indigo-5);
    color: white;
  }

  svg {
    width: 100%;
    max-height: 200px;
  }

  rect {
    transition: all 0.1s var(--ease-4);

    &.selected {
      fill: red;
    }
  }
</style>
