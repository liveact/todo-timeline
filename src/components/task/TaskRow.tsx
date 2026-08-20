import { useState, useRef, useEffect } from 'react'
import { Trash2, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TaskHoverCard, HOVER_CARD_CLASS, HOVER_ARROW_CLASS } from '@/components/task/TaskHoverCard'
import type { Task } from '@/types'
import { cn } from '@/lib/utils'

interface TaskRowProps {
  task: Task
  index: number
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onContextCapture?: (task: Task) => void
  onRename?: (id: string, newName: string) => void
  onRemove?: (id: string) => void
  onHeightChange?: (taskId: string, height: number) => void
}

export function TaskRow({ task, index, onComplete, onUncomplete, onContextCapture, onRename, onRemove, onHeightChange }: TaskRowProps) {
  const isCompleted = task.status === 'completed'

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    const el = rowRef.current
    if (!el || !onHeightChange) return
    const observer = new ResizeObserver(() => {
      onHeightChange(task.id, el.offsetHeight)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [task.id, onHeightChange])

  const handleDoubleClick = () => {
    setEditValue(task.name)
    setIsEditing(true)
  }

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== task.name && onRename) {
      onRename(task.id, trimmed)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  return (
    <motion.div
      ref={rowRef}
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'flex items-center gap-1.5 px-2 min-h-10 py-2 group shrink-0 border-b border-slate-100 hover:bg-slate-50/60 transition-colors',
        index === 0 && 'border-t border-t-slate-100',
        isCompleted && 'opacity-[0.6]',
      )}
      onContextMenu={() => onContextCapture?.(task)}
    >
      <button
        className={cn(
          'h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center transition-colors cursor-pointer',
          isCompleted
            ? 'border-gray-400 bg-gray-200'
            : 'border-border hover:border-primary/50 hover:bg-primary/5',
        )}
        onClick={() => isCompleted ? onUncomplete(task.id) : onComplete(task.id)}
      >
        {isCompleted && <Check className="h-2.5 w-2.5 text-gray-500" />}
      </button>

      {isEditing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
          onBlur={handleSave}
          className="h-6 text-xs flex-1 px-1 py-0 min-w-0"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onContextMenu={e => e.stopPropagation()}
        />
      ) : (
        <Tooltip>
          <TooltipTrigger>
            <span
              className={cn(
                'text-[13px] flex-1 select-none truncate min-w-0 cursor-default text-left',
                isCompleted && 'line-through text-muted-foreground',
              )}
              onDoubleClick={handleDoubleClick}
            >
              {task.name}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className={HOVER_CARD_CLASS}
            arrowClassName={HOVER_ARROW_CLASS}
          >
            <TaskHoverCard task={task} showHints={false} />
          </TooltipContent>
        </Tooltip>
      )}

      {onRemove && (
        <button
          className="shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(task.id)
          }}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </motion.div>
  )
}
