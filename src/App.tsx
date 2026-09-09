import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/layout/Header'
import { PrivacyDialog } from '@/components/layout/PrivacyDialog'
import { DateHeader } from '@/components/timeline/DateHeader'
import { TimelineGrid, TimelineGridLines } from '@/components/timeline/TimelineGrid'
import { TaskList } from '@/components/task/TaskList'
import { EditTaskDialog } from '@/components/task/EditTaskDialog'
import { useTaskStore } from '@/hooks/useTaskStore'
import { getDaysInRange, toDateString } from '@/lib/date-utils'
import { URGENCY_CONFIG, URGENCY_OPTIONS } from '@/lib/urgency'
import type { Task, Urgency, ViewMode } from '@/types'
import { addDays, subDays, differenceInDays, startOfWeek, startOfMonth, getDaysInMonth } from 'date-fns'
import { Pencil, Trash2, Zap, ZapOff, ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const MAX_DAY_WIDTH = 120
const DEFAULT_DAY_WIDTH = 50
const INITIAL_EXTEND = 60
const LOAD_MORE = 30
const EDGE_THRESHOLD_COLS = 3

function getWindowDays(mode: ViewMode, today: Date): number {
  if (mode === '1week') return 7
  if (mode === '2week') return 14
  return getDaysInMonth(today)
}

function getWindowStart(mode: ViewMode, today: Date): Date {
  if (mode === '1week' || mode === '2week') {
    return startOfWeek(today, { weekStartsOn: 1 })
  }
  return startOfMonth(today)
}

function getNavDays(viewMode: ViewMode): number {
  if (viewMode === '1week') return 7
  if (viewMode === '2week') return 14
  if (viewMode === 'month') return 30
  return 3
}

export default function App() {
  const {
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
  } = useTaskStore()

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('viewMode')
      if (saved === '1week' || saved === '2week' || saved === 'month') return saved
    } catch {}
    return '1week'
  })
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createStartDate, setCreateStartDate] = useState<string | undefined>(undefined)
  const [contextTask, setContextTask] = useState<Task | null>(null)

  const [hideCompleted, setHideCompleted] = useState(() => {
    try { return localStorage.getItem('hideCompleted') === 'true' } catch { return false }
  })

  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [pendingReschedule, setPendingReschedule] = useState<{
    task: Task; start: string; end: string; type: 'reschedule' | 'shrink'
  } | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [pendingDeleteName, setPendingDeleteName] = useState('')

  const [visibleStartDate, setVisibleStartDate] = useState('')
  const [visibleEndDate, setVisibleEndDate] = useState('')

  const [weeklyReportDialogOpen, setWeeklyReportDialogOpen] = useState(false)
  const [weeklyReportText, setWeeklyReportText] = useState('')

  const [containerWidth, setContainerWidth] = useState(0)
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    try { return parseInt(localStorage.getItem('leftPanelWidth') || '180', 10) } catch { return 180 }
  })
  const [isDraggingLeftPanel, setIsDraggingLeftPanel] = useState(false)

  const [rowHeights, setRowHeights] = useState<Record<string, number>>({})

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const windowDays = useMemo(() => getWindowDays(viewMode, today), [viewMode, today])
  const dayWidth = useMemo(() => {
    if (containerWidth <= 0) return DEFAULT_DAY_WIDTH
    return Math.min(Math.floor(containerWidth / windowDays), MAX_DAY_WIDTH)
  }, [containerWidth, windowDays])

  const [rangeStart, setRangeStart] = useState(() => subDays(today, INITIAL_EXTEND))
  const [rangeEnd, setRangeEnd] = useState(() => addDays(today, INITIAL_EXTEND))
  const days = useMemo(() => getDaysInRange(rangeStart, rangeEnd), [rangeStart, rangeEnd])

  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const leftScrollRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)
  const hasScrolledToToday = useRef(false)
  const isExtending = useRef(false)
  const scrollDebounceRef = useRef<number>(0)

  useEffect(() => {
    const container = timelineScrollRef.current
    if (!container) return
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const visibleTasks = useMemo(() => {
    let filtered = tasks
    if (hideCompleted) {
      filtered = filtered.filter(t => t.status !== 'completed')
    }
    if (!visibleStartDate || !visibleEndDate) return filtered
    return filtered.filter(t => t.startDate <= visibleEndDate && t.endDate >= visibleStartDate)
  }, [tasks, visibleStartDate, visibleEndDate, hideCompleted])

  const handleToggleHideCompleted = useCallback((checked: boolean) => {
    setHideCompleted(checked)
    try { localStorage.setItem('hideCompleted', String(checked)) } catch {}
  }, [])

  const updateVisibleRange = useCallback(() => {
    const container = timelineScrollRef.current
    if (!container) return

    const scrollLeft = container.scrollLeft
    const clientWidth = container.clientWidth

    const startDayIdx = Math.floor(scrollLeft / dayWidth)
    const endDayIdx = Math.floor((scrollLeft + clientWidth) / dayWidth) - 1

    if (startDayIdx >= 0 && startDayIdx < days.length) {
      setVisibleStartDate(toDateString(days[startDayIdx]))
    }
    if (endDayIdx >= 0 && endDayIdx < days.length) {
      setVisibleEndDate(toDateString(days[Math.min(endDayIdx, days.length - 1)]))
    }
  }, [dayWidth, days])

  useEffect(() => {
    if (hasScrolledToToday.current) return
    if (containerWidth <= 0) return
    const container = timelineScrollRef.current
    if (!container) return

    const windowStart = getWindowStart(viewMode, today)
    const offset = differenceInDays(windowStart, rangeStart) * dayWidth

    container.scrollLeft = Math.max(0, offset)
    hasScrolledToToday.current = true

    requestAnimationFrame(() => updateVisibleRange())
  }, [viewMode, today, rangeStart, dayWidth, containerWidth, updateVisibleRange])

  const syncScroll = useCallback((source: 'left' | 'right') => {
    if (isSyncing.current) return
    isSyncing.current = true

    const sourceEl = source === 'left' ? leftScrollRef.current : timelineScrollRef.current
    const targetEl = source === 'left' ? timelineScrollRef.current : leftScrollRef.current

    if (sourceEl && targetEl) {
      targetEl.scrollTop = sourceEl.scrollTop
    }

    requestAnimationFrame(() => {
      isSyncing.current = false
    })
  }, [])

  const handleTimelineScroll = useCallback(() => {
    syncScroll('right')

    if (scrollDebounceRef.current) {
      cancelAnimationFrame(scrollDebounceRef.current)
    }
    scrollDebounceRef.current = requestAnimationFrame(() => {
      updateVisibleRange()
    })

    const container = timelineScrollRef.current
    if (!container || isExtending.current) return

    const edgePx = EDGE_THRESHOLD_COLS * dayWidth

    if (container.scrollLeft < edgePx) {
      isExtending.current = true
      const addedPx = LOAD_MORE * dayWidth
      setRangeStart(prev => subDays(prev, LOAD_MORE))
      requestAnimationFrame(() => {
        container.scrollLeft += addedPx
        isExtending.current = false
      })
    }

    if (container.scrollLeft + container.clientWidth > container.scrollWidth - edgePx) {
      isExtending.current = true
      setRangeEnd(prev => addDays(prev, LOAD_MORE))
      requestAnimationFrame(() => {
        isExtending.current = false
      })
    }
  }, [dayWidth, syncScroll, updateVisibleRange])

  const handleJumpToToday = useCallback(() => {
    const container = timelineScrollRef.current
    if (!container) return
    const todayOffset = differenceInDays(today, rangeStart) * dayWidth
    container.scrollTo({ left: todayOffset - container.clientWidth / 3, behavior: 'smooth' })
  }, [today, rangeStart, dayWidth])

  const dayWidthRef = useRef(dayWidth)
  dayWidthRef.current = dayWidth

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    try { localStorage.setItem('viewMode', mode) } catch {}
    requestAnimationFrame(() => {
      const container = timelineScrollRef.current
      if (!container) return
      const targetDate = getWindowStart(mode, today)
      const offset = differenceInDays(targetDate, rangeStart) * dayWidthRef.current
      container.scrollLeft = offset
      updateVisibleRange()
    })
  }, [today, rangeStart, updateVisibleRange])

  const handleNavPrev = useCallback(() => {
    const container = timelineScrollRef.current
    if (!container) return
    const movePx = getNavDays(viewMode) * dayWidth
    container.scrollTo({ left: container.scrollLeft - movePx, behavior: 'smooth' })
  }, [viewMode, dayWidth])

  const handleNavNext = useCallback(() => {
    const container = timelineScrollRef.current
    if (!container) return
    const movePx = getNavDays(viewMode) * dayWidth
    container.scrollTo({ left: container.scrollLeft + movePx, behavior: 'smooth' })
  }, [viewMode, dayWidth])

  const handleRowHeightChange = useCallback((taskId: string, height: number) => {
    setRowHeights(prev => {
      if (prev[taskId] === height) return prev
      return { ...prev, [taskId]: height }
    })
  }, [])

  const handleEditFromContext = () => {
    if (contextTask) {
      setEditTask(contextTask)
      setEditDialogOpen(true)
    }
  }

  const handleToggleInsertedFromContext = () => {
    if (contextTask) {
      updateTask(contextTask.id, { isInserted: !contextTask.isInserted })
    }
  }

  const handleChangeUrgencyFromContext = (urgency: Urgency) => {
    if (contextTask) {
      changeUrgency(contextTask.id, urgency)
    }
  }

  const handleRequestDelete = () => {
    if (contextTask) {
      setPendingDeleteId(contextTask.id)
      setPendingDeleteName(contextTask.name)
      setDeleteDialogOpen(true)
    }
  }

  const handleRequestDeleteById = useCallback((id: string) => {
    const t = tasks.find(t => t.id === id)
    if (t) {
      setPendingDeleteId(t.id)
      setPendingDeleteName(t.name)
      setDeleteDialogOpen(true)
    }
  }, [tasks])

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      removeTask(pendingDeleteId)
    }
    setDeleteDialogOpen(false)
    setPendingDeleteId(null)
    setPendingDeleteName('')
  }

  const handleRequestReschedule = useCallback((task: Task, newStart: string, newEnd: string) => {
    setPendingReschedule({ task, start: newStart, end: newEnd, type: 'reschedule' })
    setRescheduleDialogOpen(true)
  }, [])

  const handleRequestShrink = useCallback((task: Task, newEndDate: string) => {
    setPendingReschedule({ task, start: task.startDate, end: newEndDate, type: 'shrink' })
    setRescheduleDialogOpen(true)
  }, [])

  const handleConfirmReschedule = () => {
    if (pendingReschedule) {
      if (pendingReschedule.type === 'shrink') {
        shrinkEndDate(pendingReschedule.task.id, pendingReschedule.end)
      } else {
        rescheduleTask(pendingReschedule.task.id, pendingReschedule.start, pendingReschedule.end)
      }
    }
    setRescheduleDialogOpen(false)
    setPendingReschedule(null)
  }

  const handleContextCapture = useCallback((task: Task) => {
    setContextTask(task)
  }, [])

  const taskContextMenuContent = (
    <ContextMenuContent>
      <ContextMenuItem onClick={handleEditFromContext} className="cursor-pointer">
        <Pencil className="h-3.5 w-3.5" />
        编辑
      </ContextMenuItem>
      <ContextMenuItem onClick={handleToggleInsertedFromContext} className="cursor-pointer">
        {contextTask?.isInserted ? <ZapOff className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
        {contextTask?.isInserted ? '标为计划' : '标为插入'}
      </ContextMenuItem>
      <ContextMenuSeparator />
      {URGENCY_OPTIONS.map(u => (
        <ContextMenuItem
          key={u}
          onClick={() => handleChangeUrgencyFromContext(u)}
          className={cn("cursor-pointer", contextTask?.urgency === u && "bg-accent font-medium")}
        >
          <div className={`w-2 h-2 rounded-full ${URGENCY_CONFIG[u].dot}`} />
          {URGENCY_CONFIG[u].label}
        </ContextMenuItem>
      ))}
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onClick={handleRequestDelete} className="cursor-pointer">
        <Trash2 className="h-3.5 w-3.5" />
        删除
      </ContextMenuItem>
    </ContextMenuContent>
  )

  const handleEmptyContextAdd = useCallback(() => {
    setCreateDialogOpen(true)
  }, [])

  const handleTimelineContextMenu = useCallback((e: React.MouseEvent) => {
    if (contextTask) return
    const scrollEl = timelineScrollRef.current
    if (!scrollEl) return
    const rect = scrollEl.getBoundingClientRect()
    const x = e.clientX - rect.left + scrollEl.scrollLeft
    const dayIndex = Math.floor(x / dayWidth)
    if (dayIndex >= 0 && dayIndex < days.length) {
      setCreateStartDate(toDateString(days[dayIndex]))
    }
  }, [contextTask, dayWidth, days])

  const emptyContextMenuContent = (
    <ContextMenuContent>
      <ContextMenuItem onClick={handleEmptyContextAdd} className="cursor-pointer">
        <Plus className="h-3.5 w-3.5" />
        添加待办
      </ContextMenuItem>
    </ContextMenuContent>
  )

  const handleGenerateWeeklyReport = useCallback(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(now.getTime())
    monday.setDate(diffToMonday)
    
    const friday = new Date(monday.getTime())
    friday.setDate(monday.getDate() + 4)

    const mondayStr = toDateString(monday)
    const fridayStr = toDateString(friday)

    const relevantTasks = tasks.filter(t => t.startDate <= fridayStr && t.endDate >= mondayStr)
    const sortedTasks = [...relevantTasks].sort((a, b) => URGENCY_OPTIONS.indexOf(a.urgency) - URGENCY_OPTIONS.indexOf(b.urgency))

    const completedTasks = sortedTasks.filter(t => t.status === 'completed')
    const uncompletedTasks = sortedTasks.filter(t => t.status !== 'completed')
    const finalTasks = [...completedTasks, ...uncompletedTasks]

    const formatReportDate = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-')
      return `${y}年${m}月${d}日`
    }

    let reportText = `${formatReportDate(mondayStr)}-${formatReportDate(fridayStr)}\n`
    
    finalTasks.forEach((task, index) => {
      let statusText = ''
      if (task.status === 'completed') {
        statusText = '已完成'
      } else if (task.postponements.length > 0) {
        const lastPostponement = task.postponements[task.postponements.length - 1]
        const reason = lastPostponement.reason ? lastPostponement.reason : '无'
        statusText = `未完成 延期原因：${reason}。预计完成时间：${task.endDate}`
      } else {
        statusText = '未完成'
      }
      reportText += `${index + 1}. ${task.name}，${statusText}\n`
    })

    setWeeklyReportText(reportText.trim())
    setWeeklyReportDialogOpen(true)
  }, [tasks])

  const handleLeftPanelDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingLeftPanel(true)

    const startX = e.clientX
    const startWidth = leftPanelWidth

    const handleMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const newWidth = Math.max(120, Math.min(600, startWidth + delta))
      setLeftPanelWidth(newWidth)
    }

    const handleUp = () => {
      setIsDraggingLeftPanel(false)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }, [leftPanelWidth])

  useEffect(() => {
    if (!isDraggingLeftPanel) {
      try { localStorage.setItem('leftPanelWidth', String(leftPanelWidth)) } catch {}
    }
  }, [leftPanelWidth, isDraggingLeftPanel])

  return (
    <TooltipProvider delay={0}>
      <div className="h-screen flex flex-col overflow-hidden bg-slate-50 gap-3">
        <Header onAddTask={addTask} />

        {/* Main card container */}
        <div className="flex-1 mx-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-0">
          {/* Toolbar inside card */}
          <div className="flex items-center gap-2 px-3 h-10 border-b border-slate-200 shrink-0">
            <span className="text-xs text-muted-foreground select-none whitespace-nowrap">时间窗口</span>
            <div className="flex rounded-full bg-slate-100 p-0.5">
              {([
                { key: '1week' as ViewMode, label: '1周' },
                { key: '2week' as ViewMode, label: '2周' },
                { key: 'month' as ViewMode, label: '1个月' },
              ]).map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleViewModeChange(item.key)}
                  className={cn(
                    'inline-flex items-center justify-center text-xs min-w-[40px] px-2.5 h-6 rounded-lg cursor-pointer transition-all select-none whitespace-nowrap',
                    viewMode === item.key
                      ? 'bg-white shadow-sm border border-slate-200 text-foreground font-medium'
                      : 'bg-transparent border border-transparent text-muted-foreground',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox
                checked={hideCompleted}
                onCheckedChange={handleToggleHideCompleted}
                className="size-4 cursor-pointer data-[checked]:bg-rose-500 data-[checked]:border-rose-500"
              />
              <Label className="text-xs text-muted-foreground cursor-pointer select-none whitespace-nowrap" onClick={() => handleToggleHideCompleted(!hideCompleted)}>
                隐藏已完成
              </Label>
            </div>

            {/* Right: nav arrows + back to today */}
            <div className="flex-1" />
            <div className="flex items-center gap-0.5">
              <Button
                variant="outline"
                size="xs"
                onClick={handleGenerateWeeklyReport}
                className="text-xs h-6 px-2.5 mr-1 cursor-pointer rounded-sm"
              >
                生成周报
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNavPrev}
                className="h-6 w-6 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={handleJumpToToday}
                className="text-xs h-6 px-2.5 cursor-pointer rounded-sm"
              >
                回到今天
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNavNext}
                className="h-6 w-6 cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Content: left panel + timeline */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            <div 
              className="relative bg-white border-r border-slate-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] flex flex-col shrink-0"
              style={{ width: leftPanelWidth }}
            >
              <div className="h-11 shrink-0 flex items-center px-2 border-b border-border/30">
                <span className="text-xs font-medium text-muted-foreground select-none">待办任务</span>
              </div>
              <div
                ref={leftScrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden"
                onScroll={() => syncScroll('left')}
                style={{ scrollbarWidth: 'none' }}
              >
                <ContextMenu onOpenChange={(open) => { if (!open) requestAnimationFrame(() => setContextTask(null)) }}>
                  <ContextMenuTrigger>
                    <TaskList
                      tasks={visibleTasks}
                      onComplete={completeTask}
                      onUncomplete={uncompleteTask}
                      onContextCapture={handleContextCapture}
                      onRename={(id, name) => updateTask(id, { name })}
                      onRemove={handleRequestDeleteById}
                      onHeightChange={handleRowHeightChange}
                    />
                  </ContextMenuTrigger>
                  {contextTask ? taskContextMenuContent : emptyContextMenuContent}
                </ContextMenu>
              </div>
              
              {/* Drag handle */}
              <div
                className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/10 active:bg-primary/20 transition-colors z-10"
                onMouseDown={handleLeftPanelDragStart}
              />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div
                ref={timelineScrollRef}
                className="flex-1 overflow-auto"
                onScroll={handleTimelineScroll}
              >
                <ContextMenu onOpenChange={(open) => { if (!open) requestAnimationFrame(() => setContextTask(null)) }}>
                  <ContextMenuTrigger className="min-h-full flex flex-col" onContextMenu={handleTimelineContextMenu}>
                    <div className="relative flex flex-col min-h-full flex-1" style={{ width: days.length * dayWidth }}>
                      <TimelineGridLines days={days} dayWidth={dayWidth} />
                      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm">
                        <DateHeader days={days} dayWidth={dayWidth} />
                      </div>
                      <TimelineGrid
                        days={days}
                        dayWidth={dayWidth}
                        tasks={visibleTasks}
                        viewStart={rangeStart}
                        rowHeights={rowHeights}
                        onPostpone={postponeTask}
                        onUpdateStartDate={updateStartDate}
                        onContextCapture={handleContextCapture}
                        onRequestReschedule={handleRequestReschedule}
                        onReschedule={rescheduleTask}
                        onUpdatePostponement={updatePostponement}
                        onDeletePostponement={deletePostponement}
                        onRequestShrink={handleRequestShrink}
                      />
                    </div>
                  </ContextMenuTrigger>
                  {contextTask ? taskContextMenuContent : emptyContextMenuContent}
                </ContextMenu>
              </div>
            </div>
          </div>
        </div>

        <EditTaskDialog
          task={editTask}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={updateTask}
          onRemove={removeTask}
          onReschedule={rescheduleTask}
        />

        <EditTaskDialog
          task={null}
          open={createDialogOpen}
          mode="create"
          defaultStartDate={createStartDate}
          defaultEndDate=""
          onOpenChange={(open) => {
            setCreateDialogOpen(open)
            if (!open) setCreateStartDate(undefined)
          }}
          onSave={() => {}}
          onRemove={() => {}}
          onAdd={addTask}
        />

        <AlertDialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingReschedule?.type === 'shrink' ? '缩短日期' : '重新编排时间'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingReschedule?.type === 'shrink'
                  ? `将修剪延期记录以适应新的结束日期 ${pendingReschedule.end}，是否继续？`
                  : `将清除 ${pendingReschedule?.task.postponements.length || 0} 条延期记录，是否继续？`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReschedule} className="cursor-pointer">
                确认
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除任务「{pendingDeleteName}」吗？此操作不可撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">取消</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleConfirmDelete} className="cursor-pointer">
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={weeklyReportDialogOpen} onOpenChange={setWeeklyReportDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>周报</DialogTitle>
              <DialogDescription>
                可直接复制下方生成的周报内容。
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 p-3 bg-slate-50 rounded-md border border-slate-200 max-h-[300px] overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans text-slate-700">
                {weeklyReportText}
              </pre>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(weeklyReportText)
                }} 
                className="cursor-pointer"
              >
                复制文本
              </Button>
              <Button 
                onClick={() => setWeeklyReportDialogOpen(false)} 
                className="bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
              >
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <footer className="shrink-0 -mt-1.5 pb-1.5 text-center">
          <PrivacyDialog />
        </footer>
      </div>
    </TooltipProvider>
  )
}
