<script lang="ts">
  import PartySocket from 'partysocket'
  import type { Summary, Vote } from '$shared/types.ts'
  import * as devalue from 'devalue'

  let summary = $state<Summary>()
  let vote = $state<Vote>()

  const ws = new PartySocket({
    host: window.location.host,
    room: 'room1',
    party: 'poll-server',
  })

  ws.addEventListener('message', (event: MessageEvent) => {
    summary = devalue.parse(event.data) as Summary
  })

  function submit(value: string) {
    vote = value

    ws.send(vote)
  }
</script>

<main>
  <h1>Poll</h1>

  {#if summary}
    <p>{summary.question}</p>
    <form onsubmit={e => e.preventDefault()}>
      {#each summary.options.values() as option}
        <button class={{selected: vote == option.key}} onclick={() => submit(option.key)}>
          {option.description}
        </button>
      {/each}
    </form>

    <section>
      <svg viewBox="0 0 {summary.max} {summary.tally.size}">
        {#each summary.tally.entries() as [key, value], index}
          <rect
            class={{selected: key == vote}}
            x=0
            y={index}
            height=0.9
            width={value}
            style='fill: var(--{summary.options.get(key)?.color})'
            rx=0.1
          />

          <text x={value - 0.2 - (0.3 * value.toString().length)} y={index+0.6}>
            {value}
          </text>
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
    gap: var(--size-2);
  }

  button.selected {
    background: var(--indigo-5);
    color: transparent;
  }

  svg {
    width: 100%;
    max-height: 200px;
    overflow: visible;
  }

  rect {
    transition: all 0.2s var(--ease-4);
    stroke-width: 0.05px;
    stroke: white;

    &.selected {
      stroke: var(--gray-6);
    }
  }

  text {
    font-size: 0.5px;
  }
</style>
