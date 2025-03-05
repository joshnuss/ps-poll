import { Server, type Connection, routePartykitRequest } from "partyserver"
import type { Summary } from '$shared/types.ts'
import { question, options } from './options.ts'
import * as devalue from 'devalue'
import DB from './db.ts'

type Env = {
  PollServer: DurableObjectNamespace<PollServer>
}

export class PollServer extends Server<Env> {
  sql: SqlStorage
  db: DB

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.sql = ctx.storage.sql
    this.db = new DB(ctx.storage.sql)
  }

  onStart() {
    this.db.createSchema()
  }

  onConnect(conn: Connection) {
    conn.send(devalue.stringify(this.summary()))
  }

  async onMessage(conn: Connection, vote: string) {
    this.db.insert(conn.id, vote)
    this.broadcast(devalue.stringify(this.summary()))
  }

  onError(conn: Connection, error: unknown) {
    console.error(error)
  }

  private summary(): Summary {
    const tally = this.db.summary()
    const max = Math.max(...tally.values())

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
