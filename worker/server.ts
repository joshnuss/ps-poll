import { Server, type Connection, routePartykitRequest } from "partyserver"
import type { Option, Summary, Vote } from '../shared/types.ts'
import * as devalue from 'devalue'

type Env = {
  PollServer: DurableObjectNamespace<PollServer>
}

const question = "What is your favorite fruit?"
const options = new Map<string, Option>()

function addOption(option: Option) {
  options.set(option.key, option)
}

addOption({
  key: "apple",
  description: "Apple",
  color: 'red-2'
})
addOption({
  key: "pear",
  description: "Pear",
  color: 'green-2'
})
addOption({
  key: "pineapple",
  description: "Pineapple",
  color: 'yellow-5'
})
addOption({
  key: "kiwi",
  description: "Kiwi",
  color: 'green-4'
})

export class PollServer extends Server<Env> {
  sql: SqlStorage

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.sql = ctx.storage.sql
  }

  onStart() {
    this.sql.exec(`CREATE TABLE IF NOT EXISTS votes ( id TEXT primary key, value TEXT)`)
  }

  onError(conn: Connection, error: unknown) {
    console.error(error)
  }

  onConnect(conn: Connection) {
    conn.send(devalue.stringify(this.summary()))
  }

  async onMessage(conn: Connection, message: string) {
    const vote = devalue.parse(message) as Vote

    this.sql.exec('INSERT INTO votes(id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = ?', conn.id, vote.value, vote.value)

    this.broadcast(devalue.stringify(this.summary()))
  }

  private summary(): Summary {
    const records = this.sql.exec('SELECT value, count(1) as count from votes GROUP BY value ORDER BY count DESC')
    const tally = new Map<string, number>()
    let max = 0

    for (let row of records) {
      const count = row.count as number

      if (count > max) max = count

      tally.set(row.value as string, count)
    }

    return { question, options, max, tally }
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not found", {
        status: 404,
      })
    )
  },
} satisfies ExportedHandler<Env>
