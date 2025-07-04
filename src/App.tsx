import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTodoApp, TaskInstance } from '@/hooks/useTodoApp';
import { AuthModal } from '@/components/AuthModal';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { DraggableTaskList } from '@/components/DraggableTaskList';
import { DragLayer } from '@/components/DragLayer';
import { QuickAddTask } from '@/components/QuickAddTask';
import { SearchModal } from '@/components/SearchModal';
import { CategoryManager } from '@/components/CategoryManager';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
import { Sun, Moon, Calendar, ListTodo, CalendarDays, CalendarRange, CalendarCheck, Loader2, AlertCircle, RefreshCw, LogOut, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Task, Category } from '@/types';

type ViewMode = 'day' | 'week' | 'month' | 'year';
type FilterState = 'all' | 'completed' | 'pending';

// Default fallback category
const DEFAULT_CATEGORY: Category = {
  id: 'default',
  name: 'Geral',
  color: '#6b7280',
  sortOrder: 0,
  userId: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Safe string operations helper
const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
};

// Safe toLowerCase operation
const safeToLowerCase = (value: any): string => {
  const str = safeString(value);
  return str.toLowerCase();
};

// Safe toUpperCase operation - NEW
const safeToUpperCase = (value: any): string => {
  const str = safeString(value);
  return str.toUpperCase();
};

export default function App() {
  const {
    // Auth
    user,
    isAuthenticated,
    signOut,
    
    // Data
    tasks,
    categories,
    selectedDate,
    setSelectedDate,
    isDarkMode,
    setIsDarkMode,
    loading,
    error,
    connectionStatus,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    undoTaskComplete,
    addCategory,
    updateCategory,
    deleteCategory,
    getTasksForDate,
    getTasksForWeek,
    getTasksForMonth,
    getTasksForYear,
    getWeekDates,
    goToToday,
    refreshData,
  } = useTodoApp();

  // Local UI state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterState, setFilterState] = useState<FilterState>('pending');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [taskOrder, setTaskOrder] = useState<{ [key: string]: TaskInstance[] }>({});
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());
  const [ongoingToggles, setOngoingToggles] = useState<Set<string>>(new Set());

  // Connection status
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Track online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    try {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } catch (error) {
      console.warn('Failed to setup online/offline listeners:', error);
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Update theme color
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
          themeColorMeta = document.createElement('meta');
          themeColorMeta.setAttribute('name', 'theme-color');
          document.head.appendChild(themeColorMeta);
        }
        themeColorMeta.setAttribute('content', isDarkMode ? '#222222' : '#FBFBFB');
      } catch (error) {
        console.warn('Failed to update theme:', error);
      }
    }
  }, [isDarkMode]);

  // Helper functions
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Erro ao sair. Tente novamente.');
    }
  };

  const getUserInitials = () => {
    try {
      // More robust checking for user email
      if (!user || !user.email || typeof user.email !== 'string') {
        return 'U';
      }
      
      const email = safeString(user.email);
      
      // Additional check for empty string
      if (!email || email.length === 0) {
        return 'U';
      }
      
      // Get first character safely
      const firstChar = email.charAt(0);
      
      // Final safety check before toUpperCase
      if (!firstChar || typeof firstChar !== 'string') {
        return 'U';
      }
      
      return safeToUpperCase(firstChar);
    } catch (error) {
      console.warn('Error getting user initials:', error);
      return 'U';
    }
  };

  const getUserDisplayName = () => {
    try {
      if (user?.user_metadata?.full_name) {
        return safeString(user.user_metadata.full_name);
      }
      if (user?.email) {
        const email = safeString(user.email);
        return email.split('@')[0] || 'Usuário';
      }
      return 'Usuário';
    } catch (error) {
      console.warn('Error getting user display name:', error);
      return 'Usuário';
    }
  };

  const handleManualRefresh = async () => {
    try {
      toast.loading('Atualizando dados...', { duration: 1000 });
      await refreshData();
      toast.success('Dados atualizados!');
    } catch (error) {
      console.error('Manual refresh error:', error);
      toast.error('Erro ao atualizar dados');
    }
  };

  const getCategoryById = (id: string): Category => {
    try {
      if (!id || typeof id !== 'string') return DEFAULT_CATEGORY;
      
      if (!Array.isArray(categories)) return DEFAULT_CATEGORY;
      
      const found = categories.find(cat => cat && cat.id === id);
      if (found) return found;
      
      if (categories.length > 0) {
        const firstCategory = categories[0];
        if (firstCategory && firstCategory.id) {
          return firstCategory;
        }
      }
      
      return DEFAULT_CATEGORY;
    } catch (error) {
      console.warn('Error getting category by ID:', error);
      return DEFAULT_CATEGORY;
    }
  };

  const getFormattedDate = () => {
    try {
      const weekDates = getWeekDates(selectedDate);
      const currentYear = new Date().getFullYear();
      const selectedYear = selectedDate.getFullYear();
      
      switch (viewMode) {
        case 'day':
          const dayFormat = selectedYear === currentYear 
            ? { weekday: 'long', day: '2-digit', month: '2-digit' }
            : { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
          
          return selectedDate.toLocaleDateString('pt-BR', dayFormat as any);
        case 'week':
          const weekStart = weekDates[0];
          const weekEnd = weekDates[6];
          return `${weekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        case 'month':
          return selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        case 'year':
          return selectedDate.toLocaleDateString('pt-BR', { year: 'numeric' });
        default:
          return '';
      }
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Data inválida';
    }
  };

  const getFrequencyLabel = (frequency: string, customFrequencyMonths?: number) => {
    try {
      const safeFrequency = safeToLowerCase(frequency);
      switch (safeFrequency) {
        case 'daily': return 'Todo dia';
        case 'weekly': return 'Toda semana'; 
        case 'monthly': return 'Todo mês';
        case 'custom': return customFrequencyMonths ? `A cada ${customFrequencyMonths} meses` : 'Personalizada';
        default: return '';
      }
    } catch (error) {
      console.warn('Error getting frequency label:', error);
      return '';
    }
  };

  const getEmptyStateMessage = () => {
    try {
      const categoryFilter = selectedCategoryId 
        ? ` na categoria "${getCategoryById(selectedCategoryId).name}"`
        : '';

      const timeFilter = (() => {
        switch (viewMode) {
          case 'day': return 'para este dia';
          case 'week': return 'para esta semana';
          case 'month': return 'para este mês';
          case 'year': return 'para este ano';
          default: return '';
        }
      })();

      switch (filterState) {
        case 'all':
          return `Nenhuma tarefa ${timeFilter}${categoryFilter}`;
        case 'completed':
          return `Nenhuma tarefa concluída ${timeFilter}${categoryFilter}`;
        case 'pending':
          return `Nenhuma tarefa pendente ${timeFilter}${categoryFilter}`;
        default:
          return `Nenhuma tarefa ${timeFilter}${categoryFilter}`;
      }
    } catch (error) {
      console.warn('Error getting empty state message:', error);
      return 'Nenhuma tarefa encontrada';
    }
  };

  const normalizeTaskInstance = (task: TaskInstance): TaskInstance => {
    try {
      if (!task || typeof task !== 'object') {
        console.warn('Invalid task instance:', task);
        return task;
      }
      
      return {
        ...task,
        instanceDate: task.instanceDate || task.date || new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      console.warn('Error normalizing task instance:', error);
      return task;
    }
  };

  const normalizeTaskInstances = (tasks: TaskInstance[]): TaskInstance[] => {
    try {
      if (!Array.isArray(tasks)) {
        console.warn('Invalid tasks array:', tasks);
        return [];
      }
      return tasks.map(normalizeTaskInstance).filter(Boolean);
    } catch (error) {
      console.warn('Error normalizing task instances:', error);
      return [];
    }
  };

  // Loading screen - simplified
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
          <div className="flex flex-col items-center gap-4">
            <Logo className="h-8 w-40 text-foreground opacity-60" />
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500 opacity-60" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500 opacity-60" />
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {isAuthenticated ? 'Carregando seus dados...' : 'Verificando autenticação...'}
              </p>
              
              {!isOnline && (
                <p className="text-xs text-red-500 text-center">
                  Sem conexão com internet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auth modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AuthModal onAuthSuccess={() => {}} />
      </div>
    );
  }


  // Main component logic
  const weekDates = getWeekDates(selectedDate);
  
  const getTasksForCurrentView = (): TaskInstance[] => {
    try {
      let rawTasks: TaskInstance[];
      
      switch (viewMode) {
        case 'day':
          rawTasks = getTasksForDate(selectedDate);
          break;
        case 'week':
          rawTasks = getTasksForWeek(selectedDate);
          break;
        case 'month':
          rawTasks = getTasksForMonth(selectedDate);
          break;
        case 'year':
          rawTasks = getTasksForYear(selectedDate);
          break;
        default:
          rawTasks = getTasksForDate(selectedDate);
          break;
      }
      
      return normalizeTaskInstances(rawTasks);
    } catch (error) {
      console.error('Error getting tasks for current view:', error);
      return [];
    }
  };

  const filterTasksByCategory = (tasks: TaskInstance[]): TaskInstance[] => {
    try {
      if (!Array.isArray(tasks)) {
        return [];
      }
      if (!selectedCategoryId) {
        return tasks;
      }
      return tasks.filter(task => task && task.categoryId === selectedCategoryId);
    } catch (error) {
      console.error('Error filtering tasks by category:', error);
      return [];
    }
  };

  const allTasksForView = filterTasksByCategory(getTasksForCurrentView());

  // Helper function to generate recurring task instances with correct dates
  const generateRecurringInstances = (task: Task, startDate: Date, endDate: Date): TaskInstance[] => {
    const instances: TaskInstance[] = [];
    const taskDate = new Date(task.date);
    
    try {
      switch (task.frequency) {
        case 'daily':
          // Generate daily instances
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d >= taskDate && d.toDateString() !== taskDate.toDateString()) {
              instances.push({
                ...task,
                instanceDate: d.toISOString().split('T')[0],
                // Update the display date to the instance date
                date: d.toISOString().split('T')[0]
              });
            }
          }
          break;

        case 'weekly':
          // Generate weekly instances (same day of the week)
          const dayOfWeek = taskDate.getDay();
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d.getDay() === dayOfWeek && d >= taskDate && d.toDateString() !== taskDate.toDateString()) {
              instances.push({
                ...task,
                instanceDate: d.toISOString().split('T')[0],
                // Update the display date to the instance date
                date: d.toISOString().split('T')[0]
              });
            }
          }
          break;

        case 'monthly':
          // Generate monthly instances (same day of month)
          const dayOfMonth = taskDate.getDate();
          let currentMonth = new Date(taskDate);
          currentMonth.setMonth(currentMonth.getMonth() + 1);
          
          while (currentMonth <= endDate) {
            // Set to the same day of month, handling edge cases
            let targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayOfMonth);
            
            // If the target day doesn't exist in this month (e.g., Feb 30), use the last day of the month
            if (targetDate.getMonth() !== currentMonth.getMonth()) {
              targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            }
            
            if (targetDate >= startDate && targetDate <= endDate) {
              instances.push({
                ...task,
                instanceDate: targetDate.toISOString().split('T')[0],
                // Update the display date to the instance date
                date: targetDate.toISOString().split('T')[0]
              });
            }
            
            currentMonth.setMonth(currentMonth.getMonth() + 1);
          }
          break;

        case 'custom':
          // Generate custom frequency instances (every N months)
          if (task.customFrequencyMonths && task.customFrequencyMonths > 0) {
            const monthInterval = task.customFrequencyMonths;
            const dayOfMonth = taskDate.getDate();
            let currentMonth = new Date(taskDate);
            currentMonth.setMonth(currentMonth.getMonth() + monthInterval);
            
            while (currentMonth <= endDate) {
              // Set to the same day of month, handling edge cases
              let targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayOfMonth);
              
              // If the target day doesn't exist in this month, use the last day of the month
              if (targetDate.getMonth() !== currentMonth.getMonth()) {
                targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
              }
              
              if (targetDate >= startDate && targetDate <= endDate) {
                instances.push({
                  ...task,
                  instanceDate: targetDate.toISOString().split('T')[0],
                  // Update the display date to the instance date
                  date: targetDate.toISOString().split('T')[0]
                });
              }
              
              currentMonth.setMonth(currentMonth.getMonth() + monthInterval);
            }
          }
          break;
      }
    } catch (error) {
      console.warn('Error generating recurring instances for task:', task.id, error);
    }

    return instances;
  };

  // Calculate all dates with tasks including recurring tasks for calendar markers
  const getAllTaskDatesForCalendar = (): TaskInstance[] => {
    try {
      if (!Array.isArray(tasks)) return [];

      const allTaskInstances: TaskInstance[] = [];
      const weekDates = getWeekDates(selectedDate);
      const startDate = weekDates[0];
      const endDate = weekDates[6];

      // Expand the range to include surrounding weeks for better calendar display
      const rangeStart = new Date(startDate);
      rangeStart.setDate(rangeStart.getDate() - 21); // 3 weeks before
      const rangeEnd = new Date(endDate);
      rangeEnd.setDate(rangeEnd.getDate() + 21); // 3 weeks after

      tasks.forEach(task => {
        if (!task) return;

        // Add the original task date if it's in range
        const taskDate = new Date(task.date);
        if (taskDate >= rangeStart && taskDate <= rangeEnd) {
          allTaskInstances.push({
            ...task,
            instanceDate: task.date
          });
        }

        // Generate recurring instances
        if (task.frequency && task.frequency !== 'none') {
          const instances = generateRecurringInstances(task, rangeStart, rangeEnd);
          allTaskInstances.push(...instances);
        }
      });

      return normalizeTaskInstances(allTaskInstances);
    } catch (error) {
      console.error('Error getting all task dates for calendar:', error);
      return [];
    }
  };

  const tasksForCalendarMarkers = getAllTaskDatesForCalendar();

  const getFilteredTasks = (): TaskInstance[] => {
    try {
      if (!Array.isArray(allTasksForView)) {
        return [];
      }

      const orderKey = `${viewMode}-${selectedDate.toDateString()}-${filterState}-${selectedCategoryId || 'all'}`;
      const orderedTasks = taskOrder[orderKey];
      
      let filteredTasks: TaskInstance[];
      switch (filterState) {
        case 'all':
          filteredTasks = allTasksForView;
          break;
        case 'completed':
          filteredTasks = allTasksForView.filter(task => task && task.completed);
          break;
        case 'pending':
          filteredTasks = allTasksForView.filter(task => task && !task.completed);
          break;
        default:
          filteredTasks = allTasksForView.filter(task => task && !task.completed);
      }

      if (orderedTasks && Array.isArray(orderedTasks) && orderedTasks.length === filteredTasks.length) {
        const filteredTaskIds = new Set(filteredTasks.map(t => `${t.id}-${t.instanceDate || 'none'}`));
        const validOrderedTasks = orderedTasks.filter(t => t && filteredTaskIds.has(`${t.id}-${t.instanceDate || 'none'}`));
        
        if (validOrderedTasks.length === filteredTasks.length) {
          return validOrderedTasks;
        }
      }

      return filteredTasks;
    } catch (error) {
      console.error('Error getting filtered tasks:', error);
      return [];
    }
  };

  const filteredTasks = getFilteredTasks();

  const handleReorderTasks = (reorderedTasks: TaskInstance[]) => {
    try {
      if (!Array.isArray(reorderedTasks)) {
        return;
      }
      const orderKey = `${viewMode}-${selectedDate.toDateString()}-${filterState}-${selectedCategoryId || 'all'}`;
      setTaskOrder(prev => ({
        ...prev,
        [orderKey]: reorderedTasks
      }));
    } catch (error) {
      console.error('Error reordering tasks:', error);
    }
  };

  const handleToggleTaskComplete = async (taskId: string, instanceDate?: string) => {
    try {
      const toggleKey = `${safeString(taskId)}-${safeString(instanceDate) || 'none'}`;
      
      if (ongoingToggles.has(toggleKey)) {
        return;
      }
      
      setOngoingToggles(prev => new Set([...prev, toggleKey]));
      
      const taskToToggle = allTasksForView.find(task => 
        task && task.id === taskId && (!instanceDate || task.instanceDate === instanceDate)
      );
      
      if (!taskToToggle) {
        console.error('Task not found for toggle:', { taskId, instanceDate });
        return;
      }

      const wasCompleted = taskToToggle.completed;
      
      if (!wasCompleted) {
        setCompletingTasks(prev => {
          const newSet = new Set([...prev, toggleKey]);
          return newSet;
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await toggleTaskComplete(taskId, instanceDate);
      
      if (!wasCompleted) {
        setTimeout(() => {
          setCompletingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(toggleKey);
            return newSet;
          });
        }, 900);
      }
      
      if (!wasCompleted) {
        const undoAction = () => {
          if (undoTaskComplete) {
            undoTaskComplete(taskId, instanceDate)
              .catch((error) => {
                console.error('Undo action failed:', error);
              });
          }
        };
        
        toast('Tarefa concluída', {
          action: {
            label: 'Desfazer',
            onClick: undoAction
          },
          duration: 4000,
          className: 'material-toast',
        });
      }
    } catch (error) {
      console.error('toggleTaskComplete failed:', error);
      const toggleKey = `${safeString(taskId)}-${safeString(instanceDate) || 'none'}`;
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(toggleKey);
        return newSet;
      });
      toast.error('Erro ao atualizar tarefa');
    } finally {
      const toggleKey = `${safeString(taskId)}-${safeString(instanceDate) || 'none'}`;
      setTimeout(() => {
        setOngoingToggles(prev => {
          const newSet = new Set(prev);
          newSet.delete(toggleKey);
          return newSet;
        });
      }, 500);
    }
  };

  const handlePreviousWeek = () => {
    try {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 7);
      setSelectedDate(newDate);
    } catch (error) {
      console.error('Error navigating to previous week:', error);
    }
  };

  const handleNextWeek = () => {
    try {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 7);
      setSelectedDate(newDate);
    } catch (error) {
      console.error('Error navigating to next week:', error);
    }
  };

  const renderTasksList = (tasks: TaskInstance[], showDateHeaders = false) => {
    try {
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return null;
      }

      if (showDateHeaders && viewMode !== 'day') {
        const tasksByDate: { [key: string]: TaskInstance[] } = {};
        tasks.forEach(task => {
          if (!task) return;
          // Use the display date (which reflects the instance date for recurring tasks)
          const dateKey = task.instanceDate || task.date || new Date().toISOString().split('T')[0];
          if (!tasksByDate[dateKey]) {
            tasksByDate[dateKey] = [];
          }
          tasksByDate[dateKey].push(task);
        });

        return (
          <div className="space-y-4">
            {Object.entries(tasksByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dateString, dateTasks]) => (
                <div key={dateString} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-1">
                    {new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: viewMode === 'year' ? 'short' : 'short',
                      day: 'numeric',
                      month: viewMode === 'year' ? 'short' : 'short',
                      ...(viewMode === 'year' && { year: 'numeric' })
                    })}
                    <div className="flex items-center justify-center w-6 h-6 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                      {dateTasks.length}
                    </div>
                  </div>
                  <div className="ml-2">
                    <DraggableTaskList
                      tasks={dateTasks}
                      getCategoryById={getCategoryById}
                      onToggleComplete={handleToggleTaskComplete}
                      onEdit={setEditingTask}
                      onDelete={deleteTask}
                      onReorderTasks={(reorderedTasks) => {
                        const orderKey = `${viewMode}-${dateString}-${filterState}-${selectedCategoryId || 'all'}`;
                        setTaskOrder(prev => ({
                          ...prev,
                          [orderKey]: reorderedTasks
                        }));
                      }}
                      showRecurringTag={true}
                      getFrequencyLabel={getFrequencyLabel}
                      completingTasks={completingTasks}
                    />
                  </div>
                </div>
              ))}
          </div>
        );
      }

      return (
        <DraggableTaskList
          tasks={tasks}
          getCategoryById={getCategoryById}
          onToggleComplete={handleToggleTaskComplete}
          onEdit={setEditingTask}
          onDelete={deleteTask}
          onReorderTasks={handleReorderTasks}
          showRecurringTag={false}
          getFrequencyLabel={getFrequencyLabel}
          completingTasks={completingTasks}
        />
      );
    } catch (error) {
      console.error('Error rendering tasks list:', error);
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Erro ao exibir tarefas</p>
        </div>
      );
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background pb-40">
        <div className="w-full max-w-md mx-auto sm:max-w-lg lg:max-w-2xl xl:max-w-7xl">
          {/* Header with user menu */}
          <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <Logo className="h-6 w-32 text-foreground" />
              
              <div className="flex items-center gap-2 sm:gap-1">
                <SearchModal
                  tasks={tasks || []}
                  categories={categories || []}
                  onToggleComplete={handleToggleTaskComplete}
                  onEdit={setEditingTask}
                  onDelete={deleteTask}
                />
                <CategoryManager
                  categories={categories || []}
                  onAddCategory={addCategory}
                  onUpdateCategory={updateCategory}
                  onDeleteCategory={deleteCategory}
                  compact={true}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="h-10 w-10 p-0 sm:h-8 sm:w-8"
                >
                  {isDarkMode ? <Sun className="h-5 w-5 sm:h-4 sm:w-4" /> : <Moon className="h-5 w-5 sm:h-4 sm:w-4" />}
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 sm:h-8 sm:w-8">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-xs font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{getUserDisplayName()}</p>
                      <p className="text-xs text-muted-foreground">{safeString(user?.email)}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 space-y-6 lg:px-6 xl:px-8">
            {/* Error Alert - with manual refresh option */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span>{error}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    className="sm:ml-2 w-full sm:w-auto h-10 sm:h-8"
                  >
                    <RefreshCw className="h-4 w-4 mr-1 sm:h-3 sm:w-3" />
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Add Task */}
            <QuickAddTask
              categories={categories || []}
              onAddTask={addTask}
              selectedDate={selectedDate}
            />

            {/* Calendar */}
            {viewMode !== 'year' && (
              <WeeklyCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                weekDates={weekDates}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
                tasks={tasksForCalendarMarkers}
                categories={categories || []}
                getCategoryById={getCategoryById}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-2">
              {(() => {
                const today = new Date();
                const isToday = selectedDate.toDateString() === today.toDateString();
                
                return !isToday ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToToday}
                      className="flex items-center gap-2 h-10 px-4 sm:h-8 sm:px-3"
                    >
                      <Calendar className="h-4 w-4" />
                      Hoje
                    </Button>
                  </div>
                ) : (
                  <div></div>
                );
              })()}
              
              <div className="flex gap-1 bg-muted rounded-lg p-1 view-mode-buttons">
                <Button
                  variant={viewMode === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                  className="h-10 px-3 sm:h-8 sm:px-2 flex items-center gap-1"
                >
                  <Calendar className="h-4 w-4 sm:h-3 sm:w-3" />
                  <span className="text-sm">Dia</span>
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className="h-10 px-3 sm:h-8 sm:px-2 flex items-center gap-1"
                >
                  <CalendarDays className="h-4 w-4 sm:h-3 sm:w-3" />
                  <span className="text-sm">Semana</span>
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="h-10 px-3 sm:h-8 sm:px-2 flex items-center gap-1"
                >
                  <CalendarRange className="h-4 w-4 sm:h-3 sm:w-3" />
                  <span className="text-sm">Mês</span>
                </Button>
                <Button
                  variant={viewMode === 'year' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('year')}
                  className="h-10 px-3 sm:h-8 sm:px-2 flex items-center gap-1"
                >
                  <CalendarCheck className="h-4 w-4 sm:h-3 sm:w-3" />
                  <span className="text-sm">Ano</span>
                </Button>
              </div>
            </div>

            {/* Date info with category filter */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm lg:text-base font-medium">{getFormattedDate()}</span>
                <div className="flex items-center justify-center w-6 h-6 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                  {filteredTasks.length}
                </div>
              </div>
              
              <CategoryFilter
                categories={categories || []}
                selectedCategoryId={selectedCategoryId}
                onCategorySelect={setSelectedCategoryId}
              />
            </div>

            {/* Tasks List */}
            <div className="space-y-6">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{getEmptyStateMessage()}</p>
                  <p className="text-sm mt-1">Digite acima para adicionar uma nova tarefa!</p>
                </div>
              ) : (
                <div>
                  {renderTasksList(filteredTasks, viewMode !== 'day')}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <Footer 
            tasks={allTasksForView}
            viewMode={viewMode}
            filterState={filterState}
            onFilterChange={setFilterState}
          />

          {/* Edit Task Modal */}
          {editingTask && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="font-semibold mb-4">Editar Tarefa</h2>
                <QuickAddTask
                  categories={categories || []}
                  onAddTask={async (taskData) => {
                    updateTask(editingTask.id, taskData);
                    setEditingTask(null);
                  }}
                  selectedDate={new Date(editingTask.date)}
                  initialData={editingTask}
                  forceExpanded={true}
                  onCancel={() => setEditingTask(null)}
                />
              </div>
            </div>
          )}

          <Toaster 
            position="bottom-center"
            expand={false}
            richColors={false}
            closeButton={false}
            toastOptions={{
              duration: 4000,
              className: 'material-toast',
            }}
          />
        </div>

        <DragLayer 
          getCategoryById={getCategoryById}
          getFrequencyLabel={getFrequencyLabel}
        />
      </div>
    </DndProvider>
  );
}