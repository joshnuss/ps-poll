import { Server, type Connection, routePartykitRequest } from "partyserver"
import type { Summary, Vote } from '$shared/types.ts'
import { question, options } from './options.ts'
import * as devalue from 'devalue'

type Env = {
  PollServer: DurableObjectNamespace<PollServer>
}

export class PollServer extends Server<Env> {
  sql: SqlStorage

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.sql = ctx.storage.sql
  }

  onStart() {
    this.createSchema()
  }

  onConnect(conn: Connection) {
    conn.send(devalue.stringify(this.summary()))
  }

  async onMessage(conn: Connection, vote: string) {
    this.insertVote(conn, vote)
    this.broadcast(devalue.stringify(this.summary()))
  }

  onError(conn: Connection, error: unknown) {
    console.error(error)
  }

  private createSchema() {
    this.sql.exec(`CREATE TABLE IF NOT EXISTS votes (id TEXT primary key, value TEXT)`)
  }

  private insertVote(conn: Connection, vote: Vote) {
    this.sql.exec('INSERT INTO votes(id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = ?', conn.id, vote, vote)
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
