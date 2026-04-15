'use client'

import { arrayMove } from '@dnd-kit/sortable'
import { create } from 'zustand'
import {
  cloneFields,
  createDefaultField,
  duplicateField,
  type FieldType,
  type FormField,
} from '@/lib/forms/schema'

interface FormBuilderStore {
  currentEventId: string | null
  fields: FormField[]
  selectedFieldId: string | null
  isDirty: boolean
  changeToken: number
  initialize: (eventId: string, fields: FormField[]) => void
  addField: (type: FieldType) => void
  removeField: (id: string) => void
  updateField: (id: string, updates: Partial<FormField>) => void
  duplicateField: (id: string) => void
  reorderFields: (activeId: string, overId: string) => void
  selectField: (id: string | null) => void
  setFields: (fields: FormField[]) => void
  resetDirty: () => void
}

export const useFormBuilderStore = create<FormBuilderStore>((set) => ({
  currentEventId: null,
  fields: [],
  selectedFieldId: null,
  isDirty: false,
  changeToken: 0,
  initialize: (eventId, fields) =>
    set(() => {
      const clonedFields = cloneFields(fields)

      return {
        changeToken: 0,
        currentEventId: eventId,
        fields: clonedFields,
        selectedFieldId: clonedFields[0]?.id ?? null,
        isDirty: false,
      }
    }),
  addField: (type) =>
    set((state) => {
      const nextField = createDefaultField(type)

      return {
        changeToken: state.changeToken + 1,
        fields: [...state.fields, nextField],
        selectedFieldId: nextField.id,
        isDirty: true,
      }
    }),
  removeField: (id) =>
    set((state) => {
      const nextFields = state.fields.filter((field) => field.id !== id)
      const nextSelectedId =
        state.selectedFieldId === id ? nextFields[0]?.id ?? null : state.selectedFieldId

      return {
        changeToken: state.changeToken + 1,
        fields: nextFields,
        selectedFieldId: nextSelectedId,
        isDirty: true,
      }
    }),
  updateField: (id, updates) =>
    set((state) => ({
      changeToken: state.changeToken + 1,
      fields: state.fields.map((field) =>
        field.id === id
          ? ({
              ...field,
              ...updates,
            } as FormField)
          : field
      ),
      isDirty: true,
    })),
  duplicateField: (id) =>
    set((state) => {
      const index = state.fields.findIndex((field) => field.id === id)

      if (index === -1) {
        return state
      }

      const nextField = duplicateField(state.fields[index])
      const nextFields = [...state.fields]
      nextFields.splice(index + 1, 0, nextField)

      return {
        changeToken: state.changeToken + 1,
        fields: nextFields,
        selectedFieldId: nextField.id,
        isDirty: true,
      }
    }),
  reorderFields: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.fields.findIndex((field) => field.id === activeId)
      const newIndex = state.fields.findIndex((field) => field.id === overId)

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return state
      }

      return {
        changeToken: state.changeToken + 1,
        fields: arrayMove(state.fields, oldIndex, newIndex),
        isDirty: true,
      }
    }),
  selectField: (id) =>
    set(() => ({
      selectedFieldId: id,
    })),
  setFields: (fields) =>
    set(() => {
      const clonedFields = cloneFields(fields)

      return {
        changeToken: 0,
        fields: clonedFields,
        selectedFieldId: clonedFields[0]?.id ?? null,
        isDirty: false,
      }
    }),
  resetDirty: () =>
    set(() => ({
      isDirty: false,
    })),
}))

export function getSelectedField(fields: FormField[], selectedFieldId: string | null) {
  if (!selectedFieldId) {
    return null
  }

  return fields.find((field) => field.id === selectedFieldId) ?? null
}
