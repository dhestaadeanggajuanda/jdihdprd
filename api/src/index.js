import { loadConfig } from './config.js'
import { createDb } from './db.js'
import { buildServer } from './server.js'

const cfg = loadConfig()
const db = createDb(cfg.dbUrl)
const app = await buildServer({
  db,
  cfg,
  logger: {
    level: 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie']
  }
})

const stop = async signal => {
  app.log.info({ signal }, 'menghentikan')
  await app.close()
  await db.close()
  process.exit(0)
}
process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))

await app.listen({ host: cfg.host, port: cfg.port })
