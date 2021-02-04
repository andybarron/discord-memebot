import pino from 'pino'
import { DEV_MODE } from './config'

export const logger = pino({
  level: process.env.LOG_LEVEL,
  prettyPrint: DEV_MODE && {
    levelFirst: true,
    translateTime: 'SYS:standard',
  },
})
