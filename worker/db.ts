export default class DB {
  sql: SqlStorage

  constructor(sql: SqlStorage) {
    this.sql = sql
  }

  createSchema() {
    this.sql.exec(`CREATE TABLE IF NOT EXISTS votes (id TEXT primary key, value TEXT)`)
  }

  insert(id: string, vote: string) {
    this.sql.exec('INSERT INTO votes(id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = ?', id, vote, vote)
  }

  summary(): Map<string, number> {
    const records = this.sql.exec('SELECT value, count(1) as count from votes GROUP BY value ORDER BY count DESC')
    const tally = new Map<string, number>()

    for (let row of records) {
      tally.set(row.value as string, row.count as number)
    }

    return tally
  }
}
