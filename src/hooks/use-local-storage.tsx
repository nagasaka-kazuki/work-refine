import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // ローカルストレージからデータを取得する初期化関数
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error('ローカルストレージからの読み込みに失敗しました:', error)
      return initialValue
    }
  })

  // 値が変更されたらローカルストレージに保存
  useEffect(() => {
    try {
      if (Array.isArray(storedValue) && storedValue.length === 0) {
        return
      }
      localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error('ローカルストレージへの保存に失敗しました:', error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue] as const
}
