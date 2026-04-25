'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'

type Todo = {
  id: string
  task: string
  is_completed: boolean
  created_at: string
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setTodos(data)
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ task: newTask }])
        .select()

      if (error) throw error
      if (data) {
        setTodos([data[0], ...todos])
        setNewTask('')
      }
    } catch (error) {
      console.error('Error adding todo:', error)
    }
  }

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t))
      
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: !currentStatus })
        .eq('id', id)

      if (error) {
        // Revert on error
        setTodos(todos.map(t => t.id === id ? { ...t, is_completed: currentStatus } : t))
        throw error
      }
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      setTodos(todos.filter(t => t.id !== id))

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting todo:', error)
      fetchTodos() // Refetch if error to ensure sync
    }
  }

  return (
    <div className="container">
      <h1>My ToDos</h1>
      
      <form onSubmit={addTodo} className="input-group">
        <input 
          type="text" 
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add Task</button>
      </form>

      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <ul className="todo-list">
          {todos.map(todo => (
            <li key={todo.id} className={`todo-item ${todo.is_completed ? 'completed' : ''}`}>
              <div className="todo-content" onClick={() => toggleComplete(todo.id, todo.is_completed)}>
                <div className="checkbox"></div>
                <span className="todo-text">{todo.task}</span>
              </div>
              <button 
                className="delete-btn" 
                onClick={() => deleteTodo(todo.id)}
                aria-label="Delete"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </li>
          ))}
          {!loading && todos.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
              No tasks yet. Add one above!
            </div>
          )}
        </ul>
      )}
    </div>
  )
}
