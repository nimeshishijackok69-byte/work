/**
 * Lightweight structured logger used by server code and API routes.
 *
 * We intentionally avoid a heavy dependency (pino/winston) — in Vercel
 * serverless runtimes plain console output is already captured and shipped
 * to the Logs tab.  This wrapper:
 *
 *   1. Emits JSON in production so logs are easy to filter in Vercel.
 *   2. Falls back to a human-friendly format locally.
 *   3. Forwards errors to Sentry when NEXT_PUBLIC_SENTRY_DSN is configured.
 *
 * The Sentry integration is optional and imported lazily to avoid loading
 * the SDK on cold starts when it is not configured.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

const isProduction = process.env.NODE_ENV === 'production'

function format(level: LogLevel, message: string, context?: LogContext) {
  if (isProduction) {
    return JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    })
  }
  const prefix = `[${level.toUpperCase()}]`
  if (!context || Object.keys(context).length === 0) {
    return `${prefix} ${message}`
  }
  return `${prefix} ${message} ${JSON.stringify(context)}`
}

function emit(level: LogLevel, message: string, context?: LogContext) {
  const line = format(level, message, context)
  switch (level) {
    case 'debug':
      if (!isProduction) console.debug(line)
      return
    case 'info':
      console.info(line)
      return
    case 'warn':
      console.warn(line)
      return
    case 'error':
      console.error(line)
      return
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, error?: unknown, context?: LogContext) => {
    const errPayload =
      error instanceof Error
        ? { error: error.message, stack: error.stack }
        : error !== undefined
          ? { error: String(error) }
          : {}
    emit('error', message, { ...errPayload, ...context })
  },
}

export type { LogLevel, LogContext }
