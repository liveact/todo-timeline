import { useState, useCallback } from 'react'
import type { Task, Urgency, Postponement } from '@/types'
import { repository } from '@/store/repository'
import { URGENCY_OPTIONS } from '@/lib/urgency'
import { trackEvent } from '@/lib/analytics'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function sortByStartDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const dateCmp = a.startDate.localeCompare(b.startDate)
    if (dateCmp !== 0) return dateCmp
    return URGENCY_OPTIONS.indexOf(a.urgency) - URGENCY_OPTIONS.indexOf(b.urgency)
  })
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(() => sortByStartDate(repository.getAll()))

  const syncAndSet = useCallback((newTasks: Task[]) => {
    const sorted = sortByStartDate(newTasks)
    repository.save(sorted)
    setTasks(sorted)
  }, [])

  const addTask = useCallback((name: string, isInserted: boolean, startDate: string, endDate: string, urgency: Urgency = 'low') => {
    const task: Task = {
      id: generateId(),
      name,
      startDate,
      endDate,
      originalEndDate: endDate,
      urgency,
      isInserted,
      status: 'pending',
      postponements: [],
      createdAt: new Date().toISOString(),
    }
    const newTasks = repository.add(task)
    syncAndSet(newTasks)
    trackEvent('task_create')
    return task
  }, [syncAndSet])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    const newTasks = repository.update(id, patch)
    syncAndSet(newTasks)
  }, [syncAndSet])

  const removeTask = useCallback((id: string) => {
    const newTasks = repository.remove(id)
    syncAndSet(newTasks)
  }, [syncAndSet])

  const completeTask = useCallback((id: string) => {
    const newTasks = repository.update(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    })
    syncAndSet(newTasks)
    trackEvent('task_complete')
  }, [syncAndSet])

  const uncompleteTask = useCallback((id: string) => {
    const newTasks = repository.update(id, {
      status: 'pending',
      completedAt: undefined,
    })
    syncAndSet(newTasks)
  }, [syncAndSet])

  const postponeTask = useCallback((id: string, newEndDate: string, reason?: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const postponement: Postponement = {
      id: generateId(),
      fromDate: task.endDate,
      toDate: newEndDate,
      reason,
      createdAt: new Date().toISOString(),
    }

    const newTasks = repository.update(id, {
      endDate: newEndDate,
      postponements: [...task.postponements, postponement],
    })
    syncAndSet(newTasks)
  }, [tasks, syncAndSet])

  const updateStartDate = useCallback((id: string, newStartDate: string) => {
    const newTasks = repository.update(id, { startDate: newStartDate })
    syncAndSet(newTasks)
  }, [syncAndSet])

  const changeUrgency = useCallback((id: string, urgency: Urgency) => {
    const newTasks = repository.update(id, { urgency })
    syncAndSet(newTasks)
  }, [syncAndSet])

  const rescheduleTask = useCallback((id: string, newStartDate: string, newEndDate: string) => {
    const newTasks = repository.update(id, {
      startDate: newStartDate,
      endDate: newEndDate,
      originalEndDate: newEndDate,
      postponements: [],
    })
    syncAndSet(newTasks)
  }, [syncAndSet])

  const updatePostponement = useCallback((taskId: string, postponementId: string, patch: Partial<Postponement>) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const updated = task.postponements.map(p =>
      p.id === postponementId ? { ...p, ...patch } : p
    )
    const newTasks = repository.update(taskId, { postponements: updated })
    syncAndSet(newTasks)
  }, [tasks, syncAndSet])

  const shrinkEndDate = useCallback((id: string, newEndDate: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    if (newEndDate <= task.originalEndDate) {
      const newTasks = repository.update(id, {
        endDate: newEndDate,
        originalEndDate: newEndDate,
        postponements: [],
      })
      syncAndSet(newTasks)
      return
    }

    const trimmed: Postponement[] = []
    for (const p of task.postponements) {
      if (p.fromDate >= newEndDate) break
      if (p.toDate <= newEndDate) {
        trimmed.push(p)
      } else {
        trimmed.push({ ...p, toDate: newEndDate })
        break
      }
    }

    const newTasks = repository.update(id, {
      endDate: newEndDate,
      postponements: trimmed,
    })
    syncAndSet(newTasks)
  }, [tasks, syncAndSet])

  const deletePostponement = useCallback((taskId: string, postponementId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const idx = task.postponements.findIndex(p => p.id === postponementId)
    if (idx === -1) return

    const newPostponements = [...task.postponements]
    const deleted = newPostponements.splice(idx, 1)[0]

    if (idx < newPostponements.length) {
      newPostponements[idx] = { ...newPostponements[idx], fromDate: deleted.fromDate }
    }

    const newEndDate = newPostponements.length > 0
      ? newPostponements[newPostponements.length - 1].toDate
      : task.originalEndDate

    const newTasks = repository.update(taskId, {
      postponements: newPostponements,
      endDate: newEndDate,
    })
    syncAndSet(newTasks)
  }, [tasks, syncAndSet])

  return {
    tasks,
    addTask,
    updateTask,
    removeTask,
    completeTask,
    uncompleteTask,
    postponeTask,
    updateStartDate,
    changeUrgency,
    rescheduleTask,
    shrinkEndDate,
    updatePostponement,
    deletePostponement,
  }
}
