# Task Management CLI

Welcome to the Task Management CLI! This application allows you to manage tasks via the command line. You can add, update, delete, and change the status of tasks. Tasks are stored in a JSON file (`tasks.json`).

## How to Use the Task-List CLI

The application runs on Deno and provides several commands to manage your tasks.

### Commands

#### 1. Add Task

To add a new task, use the following command. You will be prompted to enter a description for the task.

```bash
deno task add
```

**Example:** Run the command and provide the description when prompted.

#### 2. Update Task

To update an existing task, use the following command. You will be prompted to enter the ID of the task and the new description.

```bash
deno task update
```

**Example:** Execute the command to update an existing task.

#### 3. Delete Task

To delete a task, specify the ID of the task you want to remove.

```bash
deno task delete <ID>
```

**Example:** If you want to delete the task with ID 1, run the following command:

```bash
deno task delete 1
```

#### 4. Change Status

You can change the status of a task to reflect its progress.

##### Change Status to `in progress`

To mark a task as "in progress," use the following command:

```bash
deno task mark-in-progress <ID>
```

**Example:** To mark the task with ID 2 as "in progress," use:

```bash
deno task mark-in-progress 2
```

##### Change Status to `done`

To mark a task as "done," use:

```bash
deno task mark-done <ID>
```

**Example:** To mark the task with ID 3 as "done," use:

```bash
deno task mark-done 3
```

#### 5. List Tasks

To list all tasks, use the following command:

```bash
deno task list
```

This will show you all the tasks in your list, along with their status and timestamps.

### 6. List Tasks with `status`

You can also list all tasks with a specific status. Specify the desired status, such as `todo`, `in-progress`, or `done`.

```bash
deno task list <STATUS> // todo, in-progress, done
```

**Example:** To list only the tasks that are still in the "todo" status:

```bash
deno task list todo
