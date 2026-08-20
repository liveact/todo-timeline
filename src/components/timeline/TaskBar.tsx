import { useRef, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, CalendarDays, Zap, Pencil, Trash2 } from 'lucide-react'
import type { Task, Postponement } from '@/types'
import { URGENCY_CONFIG, POSTPONE_COLORS } from '@/lib/urgency'
import { fromDateString, toDateString, differenceInDays, formatDateChinese } from '@/lib/date-utils'
import { TaskHoverCard, HOVER_CARD_CLASS, HOVER_ARROW_CLASS } from '@/components/task/TaskHoverCard'

interface TaskBarProps {
  task: Task
  dayWidth: number
  viewStart: Date
  onPostpone: (id: string, newEndDate: string, reason?: string) => void
  onUpdateStartDate: (id: string, newStartDate: string) => void
  onContextCapture: (task: Task) => void
  onRequestReschedule: (task: Task, newStart: string, newEnd: string) => void
  onReschedule: (id: string, newStartDate: string, newEndDate: string) => void
  onUpdatePostponement: (taskId: string, postponementId: string, patch: Partial<Postponement>) => void
  onDeletePostponement: (taskId: string, postponementId: string) => void
  onRequestShrink: (task: Task, newEndDate: string) => void
}

export function TaskBar({ task, dayWidth, viewStart, onPostpone, onUpdateStartDate, onContextCapture, onRequestReschedule, onReschedule, onUpdatePostponement, onDeletePostponement, onRequestShrink }: TaskBarProps) {
  const urgencyConfig = URGENCY_CONFIG[task.urgency]
  const isCompleted = task.status === 'completed'
  const hasPostponements = task.postponements.length > 0
  const tStart = fromDateString(task.startDate)
  const tEnd = fromDateString(task.endDate)
  const tOrigEnd = fromDateString(task.originalEndDate)

  const startOffset = differenceInDays(tStart, viewStart)
  const duration = differenceInDays(tEnd, tStart) + 1
  const origDuration = differenceInDays(tOrigEnd, tStart) + 1

  const left = startOffset * dayWidth
  const width = duration * dayWidth

  const containerRef = useRef<HTMLDivElement>(null)
  const [dragDelta, setDragDelta] = useState<{ side: 'left' | 'right' | 'whole'; px: number } | null>(null)
  const [showReasonInput, setShowReasonInput] = useState(false)
  const [pendingEndDate, setPendingEndDate] = useState<string | null>(null)
  const [reasonValue, setReasonValue] = useState('')

  const [editingPostponementId, setEditingPostponementId] = useState<string | null>(null)
  const [editReasonValue, setEditReasonValue] = useState('')

  const handleEdgeDragStart = useCallback((side: 'left' | 'right', e: React.MouseEvent) => {
    if (isCompleted) return
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX

    const handleMove = (moveEvent: MouseEvent) => {
      setDragDelta({ side, px: moveEvent.clientX - startX })
    }

    const handleUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      setDragDelta(null)

      const deltaDays = Math.round((upEvent.clientX - startX) / dayWidth)
      if (deltaDays === 0) return

      if (side === 'right' && deltaDays > 0) {
        const newEnd = new Date(tEnd)
        newEnd.setDate(newEnd.getDate() + deltaDays)
        setPendingEndDate(toDateString(newEnd))
        setShowReasonInput(true)
        setReasonValue('')
      } else if (side === 'right' && deltaDays < 0) {
        const newEnd = new Date(tEnd)
        newEnd.setDate(newEnd.getDate() + deltaDays)
        if (newEnd <= tStart) return
        const newEndStr = toDateString(newEnd)
        if (hasPostponements) {
          onRequestShrink(task, newEndStr)
        } else {
          onReschedule(task.id, task.startDate, newEndStr)
        }
      } else if (side === 'left') {
        const newStart = new Date(tStart)
        newStart.setDate(newStart.getDate() + deltaDays)
        if (newStart < tEnd) {
          onUpdateStartDate(task.id, toDateString(newStart))
        }
      }
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }, [isCompleted, dayWidth, tEnd, tStart, task, hasPostponements, onUpdateStartDate, onReschedule, onRequestShrink])

  const handleWholeDragStart = useCallback((e: React.MouseEvent) => {
    if (isCompleted) return
    e.preventDefault()

    const startX = e.clientX

    const handleMove = (moveEvent: MouseEvent) => {
      setDragDelta({ side: 'whole', px: moveEvent.clientX - startX })
    }

    const handleUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      setDragDelta(null)

      const deltaDays = Math.round((upEvent.clientX - startX) / dayWidth)
      if (deltaDays === 0) return

      const newStart = new Date(tStart)
      newStart.setDate(newStart.getDate() + deltaDays)
      const newEnd = new Date(tEnd)
      newEnd.setDate(newEnd.getDate() + deltaDays)

      const newStartStr = toDateString(newStart)
      const newEndStr = toDateString(newEnd)

      if (hasPostponements) {
        onRequestReschedule(task, newStartStr, newEndStr)
      } else {
        onReschedule(task.id, newStartStr, newEndStr)
      }
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }, [isCompleted, dayWidth, tStart, tEnd, hasPostponements, task, onRequestReschedule, onReschedule])

  const handleConfirmPostpone = () => {
    if (pendingEndDate) {
      onPostpone(task.id, pendingEndDate, reasonValue.trim() || undefined)
    }
    setShowReasonInput(false)
    setPendingEndDate(null)
    setReasonValue('')
  }

  const handleCancelPostpone = () => {
    setShowReasonInput(false)
    setPendingEndDate(null)
    setReasonValue('')
  }

  const handleDoubleClickPostponement = (p: typeof task.postponements[0]) => {
    setEditingPostponementId(p.id)
    setEditReasonValue(p.reason || '')
  }

  const handleSavePostponementReason = () => {
    if (editingPostponementId) {
      onUpdatePostponement(task.id, editingPostponementId, { reason: editReasonValue.trim() || undefined })
    }
    setEditingPostponementId(null)
    setEditReasonValue('')
  }

  const handleCancelEditReason = () => {
    setEditingPostponementId(null)
    setEditReasonValue('')
  }

  let effectiveLeft = left
  let effectiveWidth = width
  if (dragDelta) {
    if (dragDelta.side === 'left') {
      effectiveLeft = left + dragDelta.px
      effectiveWidth = width - dragDelta.px
    } else if (dragDelta.side === 'right') {
      effectiveWidth = width + dragDelta.px
    } else {
      effectiveLeft = left + dragDelta.px
    }
  }
  effectiveWidth = Math.max(dayWidth, effectiveWidth)

  const origBarWidth = hasPostponements
    ? Math.max(0, origDuration * dayWidth)
    : effectiveWidth

  const postponeSegments = hasPostponements
    ? task.postponements.map((p) => {
        const pFrom = fromDateString(p.fromDate)
        const pTo = fromDateString(p.toDate)
        const segWidth = differenceInDays(pTo, pFrom) * dayWidth
        return { ...p, segWidth: Math.max(0, segWidth) }
      })
    : []

  const barBg = isCompleted ? 'bg-gray-200' : urgencyConfig.barBg
  const barBorder = isCompleted ? 'border-gray-300' : urgencyConfig.barBorder
  const barText = isCompleted ? 'text-gray-500' : urgencyConfig.barText

  const TypeIcon = task.isInserted ? Zap : CalendarDays

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
      {/* Original end date marker - matches bar height */}
      {hasPostponements && (
        <div
          className="absolute top-1.5 bottom-1.5 w-px bg-foreground/15 z-10"
          style={{ left: left + origDuration * dayWidth }}
        />
      )}

      <motion.div
        layout
        transition={{ duration: 0.15 }}
        className={`absolute top-1.5 bottom-1.5 rounded-md flex items-center overflow-hidden group/bar border transition-shadow ${
          isCompleted ? 'opacity-[0.6]' : 'hover:shadow-sm'
        } ${dragDelta ? 'ring-2 ring-primary/30' : ''} ${barBg} ${barBorder}`}
        style={{
          left: effectiveLeft,
          width: effectiveWidth,
          pointerEvents: 'auto',
        }}
        onContextMenu={() => {
          onContextCapture(task)
        }}
      >
        {/* Main task area with hover card */}
        <Tooltip>
          <TooltipTrigger
            render={
              <div
                className="h-full flex items-center gap-1 px-4 overflow-hidden cursor-pointer active:cursor-grabbing"
                style={{
                  width: hasPostponements ? Math.min(origBarWidth, effectiveWidth) : '100%',
                  minWidth: 0,
                }}
                onMouseDown={handleWholeDragStart}
              />
            }
          >
            <TypeIcon className={`h-3.5 w-3.5 shrink-0 opacity-60 ${barText}`} />
            <span className={`text-xs font-medium truncate ${barText} ${isCompleted ? 'line-through' : ''}`}>
              {task.name}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className={HOVER_CARD_CLASS}
            arrowClassName={HOVER_ARROW_CLASS}
          >
            <TaskHoverCard task={task} showHints={true} />
          </TooltipContent>
        </Tooltip>

        {/* Postponement segments */}
        {postponeSegments.map((seg, segIdx) => (
          <div key={seg.id} className="flex h-full shrink-0" style={{ width: seg.segWidth }} onContextMenu={e => e.stopPropagation()}>
            <div className="w-px h-full border-l border-dashed border-amber-400 shrink-0" />

            {editingPostponementId === seg.id ? (
              <div className={`flex-1 h-full flex items-center px-1 ${POSTPONE_COLORS.bg}`}>
                <Input
                  value={editReasonValue}
                  onChange={e => setEditReasonValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSavePostponementReason()
                    if (e.key === 'Escape') handleCancelEditReason()
                  }}
                  onBlur={handleSavePostponementReason}
                  placeholder="备注"
                  className="h-5 text-[10px] bg-white/80 border-0 px-1"
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                />
              </div>
            ) : (
              <ContextMenu>
                <ContextMenuTrigger>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <div
                          className={`flex-1 h-full flex items-center justify-center overflow-hidden cursor-pointer ${POSTPONE_COLORS.bg}`}
                          style={{
                            width: Math.max(0, seg.segWidth - 2),
                            minWidth: 0,
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            handleDoubleClickPostponement(seg)
                          }}
                          onMouseDown={e => e.stopPropagation()}
                        />
                      }
                    >
                      <span className={`text-[11px] truncate text-center px-1 ${POSTPONE_COLORS.text} ${isCompleted ? 'line-through' : ''}`}>
                        {seg.reason || `延期${segIdx + 1}`}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className={HOVER_CARD_CLASS}
                      arrowClassName={HOVER_ARROW_CLASS}
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-amber-700">第{segIdx + 1}次延期调整</div>
                        {seg.reason && (
                          <div className="text-[11px] text-slate-500 flex">
                            <span className="shrink-0">备注: </span>
                            <span className="break-words whitespace-pre-wrap flex-1 ml-1">{seg.reason}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400">
                          新截止日期: {formatDateChinese(seg.toDate)}
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="text-[10px] text-slate-400">
                        双击修改备注 | 右键编辑/删除
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setTimeout(() => handleDoubleClickPostponement(seg), 100)
                    }}
                    className="cursor-pointer text-xs"
                  >
                    <Pencil className="h-3 w-3" />
                    编辑备注
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeletePostponement(task.id, seg.id)
                    }}
                    className="cursor-pointer text-xs"
                  >
                    <Trash2 className="h-3 w-3" />
                    删除延期
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            )}
          </div>
        ))}

        {/* Left drag handle */}
        {!isCompleted && (
          <div
            className="absolute left-0 top-0 bottom-0 w-5 cursor-ew-resize flex items-center justify-center z-20"
            style={{ pointerEvents: 'auto' }}
            onMouseDown={(e) => handleEdgeDragStart('left', e)}
          >
            <ChevronLeft className={`h-3 w-3 ${barText} opacity-50`} />
          </div>
        )}

        {/* Right drag handle */}
        {!isCompleted && (
          <div
            className="absolute right-0 top-0 bottom-0 w-5 cursor-ew-resize flex items-center justify-center z-20"
            style={{ pointerEvents: 'auto' }}
            onMouseDown={(e) => handleEdgeDragStart('right', e)}
          >
            <ChevronRight className={`h-3 w-3 ${barText} opacity-50`} />
          </div>
        )}
      </motion.div>

      {/* Postpone reason input popup */}
      {showReasonInput && (
        <div
          className="absolute z-50 bg-white border border-slate-200 rounded-xl p-3 w-60"
          style={{
            left: effectiveLeft + effectiveWidth + 8,
            top: 0,
            pointerEvents: 'auto',
          }}
        >
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">
              延期至 {pendingEndDate || ''}
            </div>
            <Input
              value={reasonValue}
              onChange={e => setReasonValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmPostpone()
                if (e.key === 'Escape') handleCancelPostpone()
              }}
              placeholder="延期原因（选填）"
              className="h-7 text-xs"
              autoFocus
            />
            <div className="flex gap-1.5 justify-end">
              <Button variant="ghost" size="xs" onClick={handleCancelPostpone} className="cursor-pointer">
                取消
              </Button>
              <Button size="xs" onClick={handleConfirmPostpone} className="cursor-pointer">
                确认
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
