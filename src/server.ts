import { createServer } from '@tanstack/react-start/server'
import { getRouter } from './router'

export default createServer({ createRouter: getRouter })
