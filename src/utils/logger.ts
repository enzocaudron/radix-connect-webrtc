import { Logger } from 'tslog'

export type AppLogger = ReturnType<typeof createLogger>
export const createLogger = (minLevel: number) =>
  new Logger({
    prettyLogTemplate: '{{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t',
    minLevel,
  })
