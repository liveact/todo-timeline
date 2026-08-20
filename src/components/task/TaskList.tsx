import { AnimatePresence } from 'motion/react'
import type { Task } from '@/types'
import { TaskRow } from './TaskRow'

interface TaskListProps {
  tasks: Task[]
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onContextCapture?: (task: Task) => void
  onRename?: (id: string, newName: string) => void
  onRemove?: (id: string) => void
  onHeightChange?: (taskId: string, height: number) => void
}

export function TaskList({ tasks, onComplete, onUncomplete, onContextCapture, onRename, onRemove, onHeightChange }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground/60 text-xs">
        暂无任务
      </div>
    )
  }

  return (
    <div>
      <AnimatePresence mode="popLayout">
        {tasks.map((task, idx) => (
          <TaskRow
            key={task.id}
            task={task}
            index={idx}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            onContextCapture={onContextCapture}
            onRename={onRename}
            onRemove={onRemove}
            onHeightChange={onHeightChange}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
