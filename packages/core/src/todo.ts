import crypto from 'crypto'

import { z } from 'zod'

import { event } from './event'

export * as Todo from './todo'

export const Events = {
  Created: event('todo.created', {
    id: z.string(),
  }),
}

export async function create() {
  const id = crypto.randomUUID()
  // write to database

  await Events.Created.publish({
    id,
  })
}

export function list() {
  return Array(50)
    .fill(0)
    .map((_, index) => ({
      id: crypto.randomUUID(),
      title: 'Todo #' + index,
    }))
}
