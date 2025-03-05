import { Server, type Connection, routePartykitRequest } from "partyserver"
import type { Summary } from '$shared/types.ts'
import { question, options } from './options.ts'
import * as devalue from 'devalue'
import DB from './db.ts'

type Env = {
  PollServer: DurableObjectNamespace<PollServer>
}

const SYNC_DELAY = 3_000

export class PollServer extends Server<Env> {
  storage: DurableObjectStorage
  db: DB
  cache: Summary | null = null

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.storage = ctx.storage
    this.db = new DB(ctx.storage.sql)
  }

  onStart() {
    this.db.createSchema()
  }

  onConnect(conn: Connection) {
    console.log('connected', conn.id)
    console.log(devalue.stringify(this.summary()))
    conn.send(devalue.stringify(this.summary()))
  }

  async onMessage(conn: Connection, vote: string) {
    this.db.insert(conn.id, vote)

    const alarm = await this.storage.getAlarm()

    if (!alarm) {
      await this.storage.setAlarm(Date.now() + SYNC_DELAY)
    }
  }

  onAlarm() {
    this.cache = null
    this.broadcast(devalue.stringify(this.summary()))
  }

  onError(conn: Connection, error: unknown) {
    console.error(error)
  }

  private summary(): Summary {
    if (this.cache) {
      return this.cache
    }

    const tally = this.db.summary()
    const max = Math.max(...tally.values())

    this.cache = { question, options, max, tally }

    return this.cache
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
