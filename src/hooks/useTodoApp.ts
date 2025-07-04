import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Task, Category } from '../types';

export interface TaskInstance extends Task {
  instanceDate?: string;
  isRecurringInstance?: boolean;
}

export function useTodoApp() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<Map<string, boolean>>(new Map());

  // UI state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Loading timeout safety - prevent infinite loading
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError(null);
      }
    }, 15000);

    return () => clearTimeout(emergencyTimeout);
  }, [loading]);

  // Initialize auth
  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        setConnectionStatus('reconnecting');
        
        initTimeout = setTimeout(() => {
          if (mounted && loading) {
            setLoading(false);
            setError(null);
            setConnectionStatus('connected');
          }
        }, 5000);

        let session;
        try {
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            session = null;
          } else {
            session = data?.session;
          }
        } catch (sessionCheckError) {
          session = null;
        }

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          setConnectionStatus('connected');
          
          // Load data in background
          loadDataInBackground(session.user);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setConnectionStatus('connected');
        }

        setLoading(false);
        setError(null);

      } catch (error: any) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          setError('Conexão instável - funcionalidade básica disponível');
          setConnectionStatus('disconnected');
        }
      } finally {
        if (mounted) {
          clearTimeout(initTimeout);
        }
      }
    };

    const loadDataInBackground = async (currentUser: User) => {
      try {
        const dataPromises = [
          fetchTasksSafely(currentUser),
          fetchCategoriesSafely(currentUser),
          fetchTaskCompletionsSafely(currentUser)
        ];

        const results = await Promise.allSettled(dataPromises);
        
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const dataType = ['tasks', 'categories', 'completions'][index];
            console.error(`Failed to load ${dataType}:`, result.reason);
          }
        });

        setConnectionStatus('connected');
      } catch (error) {
        console.error('Background data loading failed:', error);
        setConnectionStatus('disconnected');
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          setError(null);
          setConnectionStatus('connected');
          
          loadDataInBackground(session.user);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setTasks([]);
          setCategories([]);
          setTaskCompletions(new Map());
          setConnectionStatus('connected');
        }
      } catch (error: any) {
        console.error('❌ Auth state change error:', error);
        setError('Erro na sincronização');
        setConnectionStatus('disconnected');
      }
    });

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Dark mode persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
      } catch (error) {
        console.error('Failed to save dark mode preference:', error);
      }
    }
  }, [isDarkMode]);

  // Safe data fetching with timeouts
  const fetchTasksSafely = async (currentUser: User) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tasks timeout')), 3000)
    );

    try {
      await Promise.race([fetchTasks(currentUser), timeoutPromise]);
    } catch (error) {
      setTasks([]);
    }
  };

  const fetchCategoriesSafely = async (currentUser: User) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Categories timeout')), 3000)
    );

    try {
      await Promise.race([fetchCategories(currentUser), timeoutPromise]);
    } catch (error) {
      setCategories([]);
    }
  };

  const fetchTaskCompletionsSafely = async (currentUser: User) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Task completions timeout')), 3000)
    );

    try {
      await Promise.race([fetchTaskCompletions(currentUser), timeoutPromise]);
    } catch (error) {
      setTaskCompletions(new Map());
    }
  };

  // Fetch tasks
  const fetchTasks = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Tasks query error:', error);
        throw error;
      }
      
      // Map tasks data from snake_case to camelCase
      const mappedTasks = data?.map(task => {
        const mappedTask = {
          id: task.id,
          title: task.title,
          description: task.description,
          completed: task.completed,
          date: task.date,
          categoryId: task.category_id,
          userId: task.user_id,
          frequency: task.frequency,
          customFrequencyMonths: task.custom_frequency_months,
          value: task.value,
          time: task.time,
          createdAt: task.created_at,
          updatedAt: task.updated_at
        };
        
        if (task.value !== null && task.value !== undefined && task.value > 0) {
          console.log('💰 Task with value loaded:', { id: task.id, title: task.title, value: task.value });
        }
        
        return mappedTask;
      }) || [];
      
      setTasks(mappedTasks);
    } catch (error: any) {
      console.error('❌ Fetch tasks error:', error);
      setTasks([]);
      throw error;
    }
  };

  // Fetch categories
  const fetchCategories = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ Categories query error:', error);
        throw error;
      }
      
      // Map categories data from snake_case to camelCase
      const mappedCategories = data?.map(category => ({
        id: category.id,
        name: category.name,
        color: category.color,
        userId: category.user_id,
        sortOrder: category.sort_order,
        createdAt: category.created_at,
        updatedAt: category.updated_at
      })) || [];
      
      setCategories(mappedCategories);
    } catch (error: any) {
      console.error('❌ Fetch categories error:', error);
      setCategories([]);
      throw error;
    }
  };

  // Fetch task completions for recurring tasks
  const fetchTaskCompletions = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('task_completions')
        .select('task_id, instance_date')
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Task completions query error:', error);
        throw error;
      }
      
      // Create a map of completions: "taskId-instanceDate" -> true
      const completionsMap = new Map<string, boolean>();
      data?.forEach(completion => {
        const key = `${completion.task_id}-${completion.instance_date}`;
        completionsMap.set(key, true);
      });
      
      setTaskCompletions(completionsMap);
    } catch (error: any) {
      console.error('❌ Fetch task completions error:', error);
      setTaskCompletions(new Map());
      throw error;
    }
  };

  // Fetch all data
  const fetchData = async (currentUser: User) => {
    try {
      setConnectionStatus('reconnecting');
      
      await Promise.all([
        fetchTasksSafely(currentUser),
        fetchCategoriesSafely(currentUser),
        fetchTaskCompletionsSafely(currentUser)
      ]);

      setConnectionStatus('connected');
      setError(null);
    } catch (error: any) {
      console.error('❌ Fetch data error:', error);
      setError('Erro ao carregar alguns dados');
      setConnectionStatus('disconnected');
    }
  };

  // Auth functions
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user?.email) throw new Error('No user email found');
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      
      if (signInError) {
        throw new Error('Senha atual incorreta');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
    } catch (error: any) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  // Helper function to check if a task instance is completed
  const isTaskInstanceCompleted = (taskId: string, instanceDate: string): boolean => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    // For non-recurring tasks, use the task's completed status
    if (!task.frequency || task.frequency === 'none') {
      return task.completed;
    }

    // For recurring tasks, check the completions map
    const completionKey = `${taskId}-${instanceDate}`;
    return taskCompletions.get(completionKey) || false;
  };

  // Task management functions
  const addTask = async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      console.log('📝 Adding task with data:', taskData);
      console.log('💰 Task value:', taskData.value);

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: taskData.title,
          description: taskData.description,
          completed: taskData.completed || false,
          date: taskData.date,
          category_id: taskData.categoryId,
          frequency: taskData.frequency,
          custom_frequency_months: taskData.customFrequencyMonths,
          value: taskData.value,
          time: taskData.time,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Task created in database:', data);
      
      // Map new task data
      const mappedTask = {
        id: data.id,
        title: data.title,
        description: data.description,
        completed: data.completed,
        date: data.date,
        categoryId: data.category_id,
        userId: data.user_id,
        frequency: data.frequency,
        customFrequencyMonths: data.custom_frequency_months,
        value: data.value,
        time: data.time,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      setTasks(prev => [mappedTask, ...prev]);
    } catch (error: any) {
      console.error('Add task error:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Map camelCase updates to snake_case for database
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
      if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
      if (updates.customFrequencyMonths !== undefined) dbUpdates.custom_frequency_months = updates.customFrequencyMonths;
      if (updates.value !== undefined) dbUpdates.value = updates.value;
      if (updates.time !== undefined) dbUpdates.time = updates.time;

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));
    } catch (error: any) {
      console.error('Update task error:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTasks(prev => prev.filter(task => task.id !== id));
      
      // Also clean up any completion records for this task
      setTaskCompletions(prev => {
        const newMap = new Map(prev);
        for (const [key] of newMap) {
          if (key.startsWith(`${id}-`)) {
            newMap.delete(key);
          }
        }
        return newMap;
      });
    } catch (error: any) {
      console.error('Delete task error:', error);
      throw error;
    }
  };

  const toggleTaskComplete = async (taskId: string, instanceDate?: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      // Use task's original date if no instance date provided
      const effectiveInstanceDate = instanceDate || task.date;

      // Use the database function to toggle completion
      const { data, error } = await supabase.rpc('toggle_task_instance_completion', {
        p_task_id: taskId,
        p_instance_date: effectiveInstanceDate,
        p_user_id: user.id
      });

      if (error) throw error;

      // Update local state based on task type
      if (!task.frequency || task.frequency === 'none') {
        // For non-recurring tasks, update the task's completed status
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, completed: data } : t
        ));
      } else {
        // For recurring tasks, update the completions map
        setTaskCompletions(prev => {
          const newMap = new Map(prev);
          const completionKey = `${taskId}-${effectiveInstanceDate}`;
          
          if (data) {
            newMap.set(completionKey, true);
          } else {
            newMap.delete(completionKey);
          }
          
          return newMap;
        });
      }
    } catch (error: any) {
      console.error('Toggle task complete error:', error);
      throw error;
    }
  };

  const undoTaskComplete = async (taskId: string, instanceDate?: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      // Use task's original date if no instance date provided
      const effectiveInstanceDate = instanceDate || task.date;

      if (!task.frequency || task.frequency === 'none') {
        // For non-recurring tasks, update the task's completed status
        const { error } = await supabase
          .from('tasks')
          .update({ completed: false })
          .eq('id', taskId);

        if (error) throw error;
        
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, completed: false } : t
        ));
      } else {
        // For recurring tasks, remove the completion record
        const { error } = await supabase
          .from('task_completions')
          .delete()
          .eq('task_id', taskId)
          .eq('instance_date', effectiveInstanceDate)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setTaskCompletions(prev => {
          const newMap = new Map(prev);
          const completionKey = `${taskId}-${effectiveInstanceDate}`;
          newMap.delete(completionKey);
          return newMap;
        });
      }
    } catch (error: any) {
      console.error('Undo task complete error:', error);
      throw error;
    }
  };

  // Category management functions
  const addCategory = async (categoryData: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: categoryData.name,
          color: categoryData.color,
          sort_order: categoryData.sortOrder,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Map new category data
      const mappedCategory = {
        id: data.id,
        name: data.name,
        color: data.color,
        userId: data.user_id,
        sortOrder: data.sort_order,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      setCategories(prev => [...prev, mappedCategory]);
    } catch (error: any) {
      console.error('Add category error:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('categories')
        .update({
          name: updates.name,
          color: updates.color,
          sort_order: updates.sortOrder
        })
        .eq('id', id);

      if (error) throw error;
      
      setCategories(prev => prev.map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      ));
    } catch (error: any) {
      console.error('Update category error:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (error: any) {
      console.error('Delete category error:', error);
      throw error;
    }
  };

  // Utility functions
  const refreshData = async () => {
    if (user) {
      try {
        await fetchData(user);
      } catch (error) {
        console.error('❌ Refresh data error:', error);
      }
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getWeekDates = (date: Date): Date[] => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      dates.push(currentDate);
    }
    return dates;
  };

  // FIXED: Enhanced getTasksForDate that prevents duplicate instances
  const getTasksForDate = (date: Date): TaskInstance[] => {
    const dateString = date.toISOString().split('T')[0];
    const taskInstances: TaskInstance[] = [];
    const addedTaskIds = new Set<string>(); // Track which tasks we've already added

    tasks.forEach(task => {
      const isOriginalTaskDate = task.date === dateString;
      const isRecurringTask = task.frequency && task.frequency !== 'none';
      
      // For non-recurring tasks, only add if it matches the exact date
      if (!isRecurringTask && isOriginalTaskDate) {
        taskInstances.push({
          ...task,
          instanceDate: dateString,
          isRecurringInstance: false,
          completed: isTaskInstanceCompleted(task.id, dateString)
        });
        addedTaskIds.add(task.id);
        return;
      }
      
      // For recurring tasks
      if (isRecurringTask) {
        const taskDate = new Date(task.date);
        const targetDate = new Date(date);
        
        // If this is the original date, add as original (not recurring instance)
        if (isOriginalTaskDate) {
          taskInstances.push({
            ...task,
            instanceDate: dateString,
            isRecurringInstance: false,
            completed: isTaskInstanceCompleted(task.id, dateString)
          });
          addedTaskIds.add(task.id);
          return;
        }
        
        // Only generate recurring instances for dates AFTER the original task date
        // and only if we haven't already added this task
        if (targetDate > taskDate && !addedTaskIds.has(task.id)) {
          let shouldInclude = false;
          
          switch (task.frequency) {
            case 'daily':
              shouldInclude = true;
              break;
            case 'weekly':
              shouldInclude = taskDate.getDay() === targetDate.getDay();
              break;
            case 'monthly':
              shouldInclude = taskDate.getDate() === targetDate.getDate();
              break;
            case 'custom':
              if (task.customFrequencyMonths) {
                const monthsDiff = (targetDate.getFullYear() - taskDate.getFullYear()) * 12 + 
                                 (targetDate.getMonth() - taskDate.getMonth());
                shouldInclude = monthsDiff > 0 && 
                               monthsDiff % task.customFrequencyMonths === 0 &&
                               taskDate.getDate() === targetDate.getDate();
              }
              break;
          }
          
          if (shouldInclude) {
            taskInstances.push({
              ...task,
              instanceDate: dateString,
              isRecurringInstance: true,
              completed: isTaskInstanceCompleted(task.id, dateString)
            });
            addedTaskIds.add(task.id);
          }
        }
      }
    });

    return taskInstances;
  };

  const getTasksForWeek = (date: Date): TaskInstance[] => {
    const weekDates = getWeekDates(date);
    const allInstances: TaskInstance[] = [];
    
    weekDates.forEach(weekDate => {
      allInstances.push(...getTasksForDate(weekDate));
    });
    
    return allInstances;
  };

  const getTasksForMonth = (date: Date): TaskInstance[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const allInstances: TaskInstance[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const monthDate = new Date(year, month, day);
      allInstances.push(...getTasksForDate(monthDate));
    }
    
    return allInstances;
  };

  const getTasksForYear = (date: Date): TaskInstance[] => {
    const year = date.getFullYear();
    const allInstances: TaskInstance[] = [];
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      allInstances.push(...getTasksForMonth(monthDate));
    }
    
    return allInstances;
  };

  return {
    // Auth
    user,
    isAuthenticated,
    signOut,
    changePassword,
    
    // Data
    tasks,
    categories,
    
    // UI state
    selectedDate,
    setSelectedDate,
    isDarkMode,
    setIsDarkMode,
    loading,
    error,
    connectionStatus,
    
    // Task functions
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    undoTaskComplete,
    
    // Category functions
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Getters
    getTasksForDate,
    getTasksForWeek,
    getTasksForMonth,
    getTasksForYear,
    getWeekDates,
    
    // Utilities
    goToToday,
    refreshData,
    
    // Recurring task helpers
    isTaskInstanceCompleted
  };
}