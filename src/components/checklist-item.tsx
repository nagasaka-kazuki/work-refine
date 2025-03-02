import { Trash2, GripVertical } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { ChecklistItem } from '@/lib/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ChecklistItemProps {
  item: ChecklistItem
  onToggle: () => void
  onDelete: () => void
}

export function ChecklistItemComponent({
  item,
  onToggle,
  onDelete,
}: ChecklistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  return (
    <div
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center justify-between rounded-md ${
        item.completed ? 'bg-muted' : 'bg-card'
      } ${isDragging ? 'shadow-lg z-10 opacity-50 relative' : ''}`}
      ref={setNodeRef}
    >
      <div className="flex items-center gap-2 px-1">
        <div className="touch-none cursor-grab" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Checkbox
          id={`item-${item.id}`}
          checked={item.completed}
          onCheckedChange={onToggle}
        />
        <label
          htmlFor={`item-${item.id}`}
          className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}
        >
          {item.title}
        </label>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" aria-label='削除'/>
        </Button>
      </div>
    </div>
  )
}
