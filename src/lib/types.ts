export interface ChecklistItem {
  id: string
  title: string
  completed: boolean
}

export interface TaskCategory {
  id: string
  isOpen: boolean
  name: string
  items: ChecklistItem[]
}
