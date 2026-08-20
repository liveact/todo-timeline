import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Trash2, CalendarClock, Zap } from 'lucide-react'
import type { Task, Urgency } from '@/types'
import { URGENCY_CONFIG, URGENCY_OPTIONS } from '@/lib/urgency'
import { Input } from '@/components/ui/input'
import { toDateString } from '@/lib/date-utils'

interface EditTaskDialogProps {
  task: Task | null
  open: boolean
  mode?: 'edit' | 'create'
  defaultStartDate?: string
  defaultEndDate?: string
  onOpenChange: (open: boolean) => void
  onSave: (id: string, patch: Partial<Task>) => void
  onRemove: (id: string) => void
  onAdd?: (name: string, isInserted: boolean, startDate: string, endDate: string, urgency: Urgency) => void
  onReschedule?: (id: string, newStartDate: string, newEndDate: string) => void
}

export function EditTaskDialog({ task, open, mode = 'edit', defaultStartDate, defaultEndDate, onOpenChange, onSave, onRemove, onAdd, onReschedule }: EditTaskDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<Urgency>('low')
  const [isInserted, setIsInserted] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [rescheduleConfirmOpen, setRescheduleConfirmOpen] = useState(false)

  const isCreate = mode === 'create'

  useEffect(() => {
    if (task && mode === 'edit') {
      setName(task.name)
      setDescription(task.description || '')
      setUrgency(task.urgency)
      setIsInserted(task.isInserted)
      setStartDate(task.startDate)
      setEndDate(task.endDate)
    } else if (mode === 'create' && open) {
      setName('')
      setDescription('')
      setUrgency('low')
      setIsInserted(false)
      setStartDate(defaultStartDate || toDateString(new Date()))
      setEndDate(defaultEndDate ?? '')
    }
  }, [task, mode, open, defaultStartDate, defaultEndDate])

  const doSave = () => {
    if (!task) return
    onSave(task.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      urgency,
      isInserted,
      startDate,
      endDate,
    })
    onOpenChange(false)
  }

  const handleSave = () => {
    if (!name.trim()) return
    if (isCreate && onAdd) {
      onAdd(name.trim(), isInserted, startDate, endDate, urgency)
      onOpenChange(false)
    } else if (task) {
      if (task.postponements.length > 0 && endDate !== task.endDate) {
        setRescheduleConfirmOpen(true)
        return
      }
      doSave()
    }
  }

  const handleConfirmReschedule = () => {
    setRescheduleConfirmOpen(false)
    if (task && onReschedule) {
      onSave(task.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        urgency,
        isInserted,
        startDate,
      })
      onReschedule(task.id, startDate, endDate)
    }
    onOpenChange(false)
  }

  const handleConfirmDelete = () => {
    if (!task) return
    onRemove(task.id)
    setDeleteConfirmOpen(false)
    onOpenChange(false)
  }

  if (!isCreate && !task) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{isCreate ? '添加待办' : '编辑任务'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 px-1">
            <div className="space-y-1.5">
              <Label className="text-xs">名称</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="h-8 text-sm"
                autoFocus={isCreate}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">描述</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="选填"
                className="text-sm resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 min-h-[52px]">
              <div className="space-y-1.5">
                <Label className="text-xs">开始日期</Label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  className="h-8 w-full text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">结束日期</Label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  className="h-8 w-full text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">优先级</Label>
                <Select value={urgency} onValueChange={v => setUrgency(v as Urgency)}>
                  <SelectTrigger size="sm" className="h-8 text-sm w-full cursor-pointer">
                    <span className="flex items-center gap-1.5 flex-1 text-left">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${URGENCY_CONFIG[urgency].dot}`} />
                      {URGENCY_CONFIG[urgency].label}
                    </span>
                  </SelectTrigger>
                  <SelectContent align="start" alignItemWithTrigger={false}>
                    {URGENCY_OPTIONS.map(u => (
                      <SelectItem key={u} value={u} className="text-sm cursor-pointer">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${URGENCY_CONFIG[u].dot}`} />
                        {URGENCY_CONFIG[u].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">类型</Label>
                <Select value={isInserted ? 'inserted' : 'planned'} onValueChange={v => setIsInserted(v === 'inserted')}>
                  <SelectTrigger size="sm" className="h-8 text-sm w-full cursor-pointer">
                    <span className="flex items-center gap-1.5 flex-1 text-left">
                      {isInserted ? <Zap className="h-3.5 w-3.5 shrink-0" /> : <CalendarClock className="h-3.5 w-3.5 shrink-0" />}
                      {isInserted ? '插入' : '计划'}
                    </span>
                  </SelectTrigger>
                  <SelectContent align="start" alignItemWithTrigger={false}>
                    <SelectItem value="planned" className="text-sm cursor-pointer">
                      <CalendarClock className="h-3.5 w-3.5" />
                      计划
                    </SelectItem>
                    <SelectItem value="inserted" className="text-sm cursor-pointer">
                      <Zap className="h-3.5 w-3.5" />
                      插入
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isCreate && task && task.postponements.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">延期记录 ({task.postponements.length}次)</Label>
                  {task.postponements.map((p, i) => (
                    <div key={p.id} className="rounded-md border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                      第{i + 1}次: {p.fromDate} → {p.toDate}
                      {p.reason && <span className="ml-2 text-muted-foreground/80">备注：{p.reason}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            {!isCreate && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmOpen(true)} className="mr-auto cursor-pointer">
                <Trash2 />
                删除
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="cursor-pointer">
              取消
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!name.trim()} className="cursor-pointer bg-rose-500 hover:bg-rose-600 text-white">
              {isCreate ? '添加' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isCreate && task && (
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除任务「{task.name}」吗？此操作不可撤销。
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
      )}

      {!isCreate && task && (
        <AlertDialog open={rescheduleConfirmOpen} onOpenChange={setRescheduleConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>重新编排时间</AlertDialogTitle>
              <AlertDialogDescription>
                修改结束日期将清除 {task.postponements.length} 条延期记录，是否继续？
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
      )}
    </>
  )
}
