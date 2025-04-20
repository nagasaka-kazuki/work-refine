'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Download, Upload, AlertCircle } from 'lucide-react'
import { exportAllData, importDiffData } from '@/lib/data-sync'
import { Alert, AlertDescription } from './ui/alert'
import { toast } from 'sonner'

export function DataImportExport() {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // データを JSON 形式でエクスポート
  const handleExport = async () => {
    try {
      const blob = await exportAllData()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .substring(0, 19)
      a.download = `task-checker-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('データのエクスポートに失敗しました:', error)
      alert('データのエクスポートに失敗しました。')
    }
  }

  // JSON ファイルを読み込んで差分インポート
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    setIsImporting(true)

    try {
      await importDiffData(file)
      setIsImportDialogOpen(false)
      toast.success('データのインポートが完了しました。')
    } catch (error) {
      console.error('データのインポートに失敗しました:', error)
      toast.error(
        'データのインポートに失敗しました。ファイルの内容を確認してください。' +
          error
      )
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          エクスポート
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsImportDialogOpen(true)}
        >
          <Upload className="mr-2 h-4 w-4" />
          インポート
        </Button>
      </div>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>データのインポート</DialogTitle>
            <DialogDescription>エクスポートしたJSONファイルを選択してください。現在のデータは一致しないもののみ追加されます。</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {importError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">
                      クリックしてファイルを選択
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">JSONファイル</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  disabled={isImporting}
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              disabled={isImporting}
            >
              キャンセル
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
