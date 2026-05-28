A comprehensive, client-side personal productivity application that combines a hierarchical ToDo list, a priority-based Kanban board, and a daily diary. All your data is stored locally in your browser, ensuring privacy and speed.

*(Add a screenshot of the application here)*

## ✨ Features

### 📝 ToDo Page
- **Hierarchical Structure:** Organize your tasks under different **Topics**.
- **Topic Management:** Create, delete, and rename topics with a simple click.
- **Topic Prioritization:** Assign priority numbers to your topics and reorder them via drag-and-drop or by editing the number.
- **Task Management:** Add, edit, and delete subtasks (tasks) within each topic. Each task can have its own private notes.
- **Rich Task Details:** Assign a due date, a priority level (P1-P5), and a 'Field' to each task.
- **Intuitive Reordering:** Use drag-and-drop to reorder tasks within a topic or move them to a completely different topic.
- **Flexible Sorting:** Sort topics and tasks by name, date, or priority.

### 🚀 Prioritize Page
- **Kanban Board:** Visualize your tasks across customizable columns called **Fields** (e.g., "Work", "Personal", "Urgent").
- **Field Management:** Create, delete, and rename fields. Assign a unique color and priority number to each field.
- **Visual Prioritization:** Drag-and-drop entire field columns to re-prioritize your workflow.
- **Task Prioritization:** Drag-and-drop tasks vertically within a column to set their priority number automatically.
- **Seamless Task Movement:** Move tasks between different fields with a simple drag-and-drop action.
- **Task Notes:** Click the note icon (🗒️) on any task to add, edit, or delete detailed notes in a popup editor.
- **Direct Task Creation:** Quickly add new tasks directly into any field column without leaving the page.
- **Dynamic Sorting:** Sort tasks within each column by priority number, P1-P5 rating, or name.

### 📖 Diary Page
- **Daily Journaling:** Create and save diary entries for any date.
- **Easy Editing:** Click directly on an entry's text to edit it inline.
- **Simple Management:** Delete old entries and sort them by newest or oldest first.

### 🌍 Global Features
- **Click-to-Edit:** Simply click on the text of any Topic, Task, Field, or Diary entry to edit it instantly.
- **Dark & Light Modes:** Switch between themes for comfortable viewing day or night.
- **Recycle Bin:** Deleted items (Topics, Tasks, Fields, Diary Entries) are moved to a recycle bin, preventing accidental data loss. Restore items or delete them permanently.
- **Data Portability:**
    - **Export:** Download a full backup of all your data (including the recycle bin) as a single JSON file.
    - **Import:** Restore your data from a backup file.
- **Persistent State:** Your data is automatically saved to your browser's `localStorage`, so everything is just as you left it when you return.
- **Fully Responsive:** The layout is designed to work on various screen sizes.

## 🚀 How to Use

This is a pure client-side application. No build process or server is required.

1.  Clone or download this repository.
2.  Open the `index.html` file in your favorite modern web browser (like Chrome, Firefox, or Edge).
3.  That's it! Start organizing your life.

### Basic Workflow
1.  Go to the **ToDo** page to create a new `Topic` (e.g., "Project X").
2.  Add several subtasks to that topic, assigning them a `Field` (e.g., "Work") and a `Priority` (e.g., P2).
3.  Navigate to the **Prioritize** page. You will see your tasks under the "Work" column.
4.  Drag tasks up and down within the "Work" column to set their execution order.
5.  As you complete your day, write down your thoughts on the **Diary** page.
6.  Use the **Export** button regularly to create backups of your data.

## 🛠️ Technology Stack
-   **HTML5**
-   **CSS3** (with CSS Variables for theming)
-   **Vanilla JavaScript (ES6+)**