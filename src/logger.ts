import pino from 'pino'
import { DEV_MODE } from './config'

export const logger = pino({
  prettyPrint: DEV_MODE && {
    levelFirst: true,
    translateTime: 'SYS:standard',
  },
})
