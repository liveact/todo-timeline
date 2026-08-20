export type Urgency = 'urgent' | 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'completed'
export type ViewMode = '1week' | '2week' | 'month'

export interface Postponement {
  id: string
  fromDate: string
  toDate: string
  reason?: string
  createdAt: string
}

export interface Task {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  originalEndDate: string
  urgency: Urgency
  isInserted: boolean
  status: TaskStatus
  completedAt?: string
  postponements: Postponement[]
  createdAt: string
}

export interface TaskStore {
  tasks: Task[]
  version: number
}
