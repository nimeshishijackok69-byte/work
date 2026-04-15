'use client'

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type FieldType, type FormField } from '@/lib/forms/schema'
import { FieldPreview } from './FieldPreview'

function SortableField({
  field,
  index,
  isReadOnly,
  isSelected,
  onDuplicate,
  onRemove,
  onSelect,
}: {
  field: FormField
  index: number
  isReadOnly: boolean
  isSelected: boolean
  onDuplicate: () => void
  onRemove: () => void
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
    disabled: isReadOnly,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <FieldPreview
        dragHandleProps={{ ...attributes, ...listeners }}
        field={field}
        index={index}
        isReadOnly={isReadOnly}
        isSelected={isSelected}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        onSelect={onSelect}
      />
    </div>
  )
}

export function FieldCanvas({
  fields,
  isReadOnly = false,
  selectedFieldId,
  onAddField,
  onDuplicateField,
  onRemoveField,
  onReorderFields,
  onSelectField,
}: {
  fields: FormField[]
  isReadOnly?: boolean
  selectedFieldId: string | null
  onAddField: (type: FieldType) => void
  onDuplicateField: (id: string) => void
  onRemoveField: (id: string) => void
  onReorderFields: (activeId: string, overId: string) => void
  onSelectField: (id: string) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    onReorderFields(String(active.id), String(over.id))
  }

  if (!fields.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <div className="rounded-full bg-white p-4 shadow-sm">
            <Sparkles className="size-5 text-primary" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">Your draft form starts here</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add the first field from the palette to create the structure teachers will eventually see
            on the public form.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button disabled={isReadOnly} onClick={() => onAddField('short_answer')} type="button">
              Add short answer
            </Button>
            <Button
              disabled={isReadOnly}
              onClick={() => onAddField('section_header')}
              type="button"
              variant="outline"
            >
              Add section header
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
      <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <SortableField
              field={field}
              index={index}
              isReadOnly={isReadOnly}
              isSelected={selectedFieldId === field.id}
              key={field.id}
              onDuplicate={() => onDuplicateField(field.id)}
              onRemove={() => onRemoveField(field.id)}
              onSelect={() => onSelectField(field.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
