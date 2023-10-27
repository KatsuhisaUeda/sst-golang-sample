import { Todo } from '@back-sst/core/todo'
import { ApiHandler } from 'sst/node/api'

export const create = ApiHandler(async () => {
  await Todo.create()

  return {
    statusCode: 200,
    body: 'Todo created',
  }
})

export const list = ApiHandler(async () => {
  return {
    statusCode: 200,
    body: JSON.stringify(Todo.list()),
  }
})
