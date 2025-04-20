import { TaskCheckRepository } from '@/lib/repositories/taskChecks'
import { Checkbox } from './ui/checkbox'
import { cn } from '@/lib/utils'
import { CheckItem as CheckItemType, TaskCheck } from '@/db/schema'

type Props = {
  tc: TaskCheck
  ci: CheckItemType
}

export const CheckItemArea = ({ tc, ci }: Props) => {
  return (
    <div key={tc.id} className="flex items-center gap-2">
      <Checkbox
        checked={tc.is_done}
        onCheckedChange={() =>
          TaskCheckRepository.toggleStatus(tc.id, !tc.is_done)
        }
        id={`check-${tc.id}`}
      />
      <label
        htmlFor={`check-${tc.id}`}
        className={cn(
          'text-sm cursor-pointer',
          tc.is_done && 'line-through text-muted-foreground'
        )}
      >
        {ci.name}
      </label>
    </div>
  )
}
