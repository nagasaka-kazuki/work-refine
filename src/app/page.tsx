import { useState, useEffect } from "react"
import { TaskList } from "@/components/task-list"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { CategoryModal } from "@/components/category-modal"
import { TaskModal } from "@/components/task-modal"
import { db } from "@/lib/db"
import { categories, tasks, check_items, task_checks } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"due_to" | "status" | "created_at">("due_to")
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [allCategories, setAllCategories] = useState<any[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [allCheckItems, setAllCheckItems] = useState<any[]>([])
  const [allTaskChecks, setAllTaskChecks] = useState<any[]>([])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const categoriesData = await db.select().from(categories)
      const tasksData = await db.select().from(tasks)
      const checkItemsData = await db.select().from(check_items)
      const taskChecksData = await db.select().from(task_checks)

      setAllCategories(categoriesData)
      setAllTasks(tasksData)
      setAllCheckItems(checkItemsData)
      setAllTaskChecks(taskChecksData)
    }

    loadData()

    // Set up live queries
    const setupLiveQueries = async () => {
      const categoriesSub = db.client.live(db.select().from(categories), (data) => setAllCategories(data))

      const tasksSub = db.client.live(db.select().from(tasks), (data) => setAllTasks(data))

      const checkItemsSub = db.client.live(db.select().from(check_items), (data) => setAllCheckItems(data))

      const taskChecksSub = db.client.live(db.select().from(task_checks), (data) => setAllTaskChecks(data))

      return () => {
        categoriesSub.unsubscribe()
        tasksSub.unsubscribe()
        checkItemsSub.unsubscribe()
        taskChecksSub.unsubscribe()
      }
    }

    const unsubscribe = setupLiveQueries()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const handleAddCategory = () => {
    setEditingCategory(null)
    setIsCategoryModalOpen(true)
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setIsCategoryModalOpen(true)
  }

  const handleAddTask = () => {
    setIsTaskModalOpen(true)
  }

  const handleSaveCategory = async (categoryData: any, checkItemsData: any[]) => {
    try {
      if (editingCategory) {
        // Update existing category
        await db
          .update(categories)
          .set({ name: categoryData.name, updated_at: new Date() })
          .where(eq(categories.id, editingCategory.id))

        // Delete existing check items for this category
        await db.delete(check_items).where(eq(check_items.category_id, editingCategory.id))
      } else {
        // Create new category
        const categoryId = uuidv4()
        await db.insert(categories).values({
          id: categoryId,
          name: categoryData.name,
          created_at: new Date(),
          updated_at: new Date(),
        })

        categoryData.id = categoryId
      }

      // Add check items
      for (let i = 0; i < checkItemsData.length; i++) {
        const item = checkItemsData[i]
        await db.insert(check_items).values({
          id: uuidv4(),
          category_id: editingCategory ? editingCategory.id : categoryData.id,
          name: item.name,
          sort_position: i,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }

      setIsCategoryModalOpen(false)
    } catch (error) {
      console.error("Error saving category:", error)
    }
  }

  const handleSaveTask = async (taskData: any) => {
    try {
      const taskId = uuidv4()

      // Insert task
      await db.insert(tasks).values({
        id: taskId,
        category_id: taskData.category_id,
        name: taskData.name,
        note: taskData.note || "",
        due_to: taskData.due_to ? new Date(taskData.due_to) : null,
        status: "todo",
        created_at: new Date(),
        updated_at: new Date(),
      })

      // Insert task checks for each check item in the category
      const categoryCheckItems = allCheckItems.filter((item) => item.category_id === taskData.category_id)

      for (let i = 0; i < categoryCheckItems.length; i++) {
        const checkItem = categoryCheckItems[i]
        await db.insert(task_checks).values({
          id: uuidv4(),
          task_id: taskId,
          check_item_id: checkItem.id,
          is_done: false,
          sort_position: checkItem.sort_position,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }

      setIsTaskModalOpen(false)
    } catch (error) {
      console.error("Error saving task:", error)
    }
  }

  const filteredTasks = selectedCategory ? allTasks.filter((task) => task.category_id === selectedCategory) : allTasks

  return (
    <div className="flex h-screen flex-col">
      <TopBar onAddTask={handleAddTask} sortBy={sortBy} onSortChange={setSortBy} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          categories={allCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddCategory={handleAddCategory}
          onEditCategory={handleEditCategory}
        />

        <main className="flex-1 overflow-auto p-4">
          <TaskList
            tasks={filteredTasks}
            categories={allCategories}
            checkItems={allCheckItems}
            taskChecks={allTaskChecks}
            sortBy={sortBy}
          />
        </main>
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        category={editingCategory}
        checkItems={editingCategory ? allCheckItems.filter((item) => item.category_id === editingCategory.id) : []}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        categories={allCategories}
      />
    </div>
  )
}
