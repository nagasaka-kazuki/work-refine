"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  categories: any[]
  selectedCategory: string | null
  onSelectCategory: (id: string | null) => void
  onAddCategory: () => void
  onEditCategory: (category: any) => void
}

export function Sidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
}: SidebarProps) {
  return (
    <div className="w-64 border-r bg-background">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="font-semibold">カテゴリ</h2>
        <Button variant="ghost" size="icon" onClick={onAddCategory}>
          <PlusCircle className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-2">
          <Button
            variant="ghost"
            className={cn("w-full justify-start mb-1 font-normal", selectedCategory === null && "bg-accent")}
            onClick={() => onSelectCategory(null)}
          >
            すべてのタスク
          </Button>

          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between mb-1 group">
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 justify-start font-normal truncate",
                  selectedCategory === category.id && "bg-accent",
                )}
                onClick={() => onSelectCategory(category.id)}
              >
                <span className="truncate">{category.name}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditCategory(category)
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
