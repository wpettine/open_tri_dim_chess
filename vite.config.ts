import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const LOG_FILE = 'console-output.log'

// Vite plugin to handle console log endpoint
function consoleLoggerPlugin() {
  let logFilePath: string

  return {
    name: 'console-logger',
    configResolved(config: any) {
      logFilePath = path.resolve(config.root, LOG_FILE)
    },
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/__console_log' && req.method === 'POST') {
          let body = ''
          
          req.on('data', (chunk: any) => {
            body += chunk.toString()
          })
          
          req.on('end', () => {
            try {
              const logData = JSON.parse(body)
              const { timestamp, level, messages, clearFile } = logData
              
              // Format log entry
              const formattedMessages = messages.join(' ')
              const logLine = `[${timestamp}] [${level.toUpperCase()}] ${formattedMessages}\n`
              
              // Clear file if requested, otherwise append
              if (clearFile) {
                fs.writeFileSync(logFilePath, logLine, 'utf-8')
              } else {
                fs.appendFileSync(logFilePath, logLine, 'utf-8')
              }
              
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: true }))
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false, error: String(error) }))
            }
          })
        } else {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    consoleLoggerPlugin(),
  ],
})
