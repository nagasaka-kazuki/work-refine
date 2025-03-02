import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SharedFormProps {
  onAdd: (text: string) => void
  onCancel?: () => void
  placeholder: string
  showCancelButton?: boolean
  autoFocus?: boolean
  inputClassName?: string
}

export function InputForm({
  onAdd,
  onCancel,
  placeholder,
  showCancelButton = false,
  autoFocus = false,
}: SharedFormProps) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onAdd(text)
      setText('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${showCancelButton ? 'space-y-4' : 'flex items-center gap-2 pt-2'}`}
    >
      <Input
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1"
        autoFocus={autoFocus}
      />

      {showCancelButton ? (
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="submit">追加</Button>
        </div>
      ) : (
        <Button type="submit" size="sm">
          追加
        </Button>
      )}
    </form>
  )
}
