"use client";

import React, { useState } from "react";
import Button from "../ui/Button";

interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export default function ReminderTaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      dueDate: new Date().toISOString().split('T')[0],
      completed: false,
    };

    setTasks(prev => [...prev, task]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm h-full overflow-auto">
      <h2 className="text-xl font-semibold text-[#0A2342] mb-3">📅 Reminders / Tasks</h2>
      <p className="text-sm text-gray-600 mb-4">
        Manage your legal tasks and deadlines simply.
      </p>

      {/* Add Task */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <Button onClick={addTask} disabled={!newTask.trim()}>
          Add
        </Button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No tasks yet. Add your first task!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 border rounded-lg ${
                task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {task.title}
                </span>
                <div className="text-xs text-gray-500">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteTask(task.id)}
              >
                Delete
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}