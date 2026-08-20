import { Zap, CalendarDays } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import type { Task } from '@/types'
import { URGENCY_CONFIG } from '@/lib/urgency'
import { formatDateChinese } from '@/lib/date-utils'

export const HOVER_CARD_CLASS = 'block bg-white border border-slate-200 shadow-xl text-foreground p-3 max-w-xs rounded-xl'
export const HOVER_ARROW_CLASS = 'bg-white fill-white'

interface TaskHoverCardProps {
  task: Task
  showHints?: boolean
}

export function TaskHoverCard({ task, showHints = false }: TaskHoverCardProps) {
  const urgencyConfig = URGENCY_CONFIG[task.urgency]
  const isCompleted = task.status === 'completed'
  const TypeIcon = task.isInserted ? Zap : CalendarDays

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[13px] font-semibold text-slate-900 min-w-0 flex items-start gap-1.5">
          <TypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <span className="break-words whitespace-pre-wrap leading-tight">{task.name}</span>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${urgencyConfig.labelBg} ${urgencyConfig.labelText} ${urgencyConfig.labelBorder}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${urgencyConfig.dot}`} />
            {urgencyConfig.label}
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium bg-emerald-50 text-emerald-600 border-emerald-200/80">
              已完成
            </div>
          )}
        </div>
      </div>
      
      {task.description && (
        <div className="text-[11px] text-slate-500 mt-2 flex">
          <span className="shrink-0">描述：</span>
          <span className="break-words whitespace-pre-wrap flex-1">{task.description}</span>
        </div>
      )}
      
      <div className="text-[11px] text-slate-500 mt-2">
        计划周期：{formatDateChinese(task.startDate)} 至 {formatDateChinese(task.originalEndDate)}
      </div>
      
      {isCompleted && task.completedAt && (
        <div className="text-[11px] text-emerald-600 mt-1">
          完成时间：{formatDateChinese(task.completedAt.split('T')[0])}
        </div>
      )}

      {task.postponements.length > 0 && (
        <>
          <Separator className="my-2" />
          <div className="space-y-1.5">
            {task.postponements.map((p) => (
              <div key={p.id} className="text-[11px] text-slate-500">
                <div className="font-medium text-amber-700">延期至{formatDateChinese(p.toDate)}</div>
                {p.reason && (
                  <div className="flex mt-0.5">
                    <span className="shrink-0">备注：</span>
                    <span className="break-words whitespace-pre-wrap flex-1 text-slate-500">{p.reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showHints && (
        <>
          <Separator className="my-2" />
          <div className="text-[10px] text-slate-400">
            拖拽移动 | 拖拽边缘调整日期 | 右键编辑信息
          </div>
        </>
      )}
    </div>
  )
}
