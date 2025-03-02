import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  UniqueIdentifier,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

export type DNDSortableAreaProps = {
  children: React.ReactNode
  itemKeys: UniqueIdentifier[]
  handleDragEnd: (
    draggedItemId: string,
    overedItemId: string | undefined
  ) => void
}

export const DNDSortableArea = ({
  children,
  itemKeys,
  handleDragEnd,
}: DNDSortableAreaProps) => {
  // dnd-kitのセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px動かすとドラッグ開始
      },
    }),
    // これだけでキーボードのセンサーが設定されるのは革新的
    // 自分で作ろうと思ったら鬼めんどくさそう
    useSensor(KeyboardSensor),
    useSensor(TouchSensor)
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) =>
        handleDragEnd(event.active.id.toString(), event.over?.id.toString())
      }
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={itemKeys} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}
