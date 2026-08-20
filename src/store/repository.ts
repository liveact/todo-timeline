import type { Task, TaskStore } from '@/types'

const STORAGE_KEY = 'task-manager-data'
const CURRENT_VERSION = 1

function getDefaultStore(): TaskStore {
  return { tasks: [], version: CURRENT_VERSION }
}

function readStore(): TaskStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultStore()
    const parsed = JSON.parse(raw) as TaskStore
    if (!parsed.tasks || !Array.isArray(parsed.tasks)) return getDefaultStore()
    return parsed
  } catch {
    return getDefaultStore()
  }
}

function writeStore(store: TaskStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export const repository = {
  getAll(): Task[] {
    return readStore().tasks
  },

  save(tasks: Task[]): void {
    writeStore({ tasks, version: CURRENT_VERSION })
  },

  add(task: Task): Task[] {
    const store = readStore()
    store.tasks.push(task)
    writeStore(store)
    return store.tasks
  },

  update(id: string, patch: Partial<Task>): Task[] {
    const store = readStore()
    const idx = store.tasks.findIndex(t => t.id === id)
    if (idx !== -1) {
      store.tasks[idx] = { ...store.tasks[idx], ...patch }
    }
    writeStore(store)
    return store.tasks
  },

  remove(id: string): Task[] {
    const store = readStore()
    store.tasks = store.tasks.filter(t => t.id !== id)
    writeStore(store)
    return store.tasks
  },

  clear(): void {
    writeStore(getDefaultStore())
  },
}
