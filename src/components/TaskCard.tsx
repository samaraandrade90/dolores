import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Calendar, Clock, Edit, Trash2, Repeat, MoreHorizontal } from 'lucide-react';
import { Task, Category, TaskInstance } from '../types';
import { formatCurrency } from '../lib/supabase';

interface TaskCardProps {
  task: TaskInstance;
  category: Category;
  onToggleComplete: (taskId: string, instanceDate?: string) => void;
  onEdit: (task: TaskInstance) => void;
  onDelete: (taskId: string, instanceDate?: string) => void;
  showRecurringTag?: boolean;
  getFrequencyLabel?: (frequency: string, customFrequencyMonths?: number) => string;
  isCompleting?: boolean;
  isDragging?: boolean;
}

export function TaskCard({
  task,
  category,
  onToggleComplete,
  onEdit,
  onDelete,
  showRecurringTag,
  getFrequencyLabel,
  isCompleting = false,
  isDragging = false
}: TaskCardProps) {
  // FIXED: Add safety checks for task and category
  if (!task || !category) {
    return null;
  }

  const handleToggleComplete = () => {
    if (isCompleting) return; // Prevent multiple clicks during completion animation
    onToggleComplete(task.id, task.instanceDate);
  };

  const handleEdit = () => {
    if (isCompleting) return;
    onEdit(task);
  };

  const handleDelete = () => {
    if (isCompleting) return;
    onDelete(task.id, task.instanceDate);
  };

  // FIXED: Get frequency label safely
  const frequencyLabel = showRecurringTag && task.frequency !== 'none' && getFrequencyLabel 
    ? getFrequencyLabel(task.frequency, task.customFrequencyMonths)
    : '';

  // FIXED: Robust value checking - handles all edge cases
  const hasValidValue = () => {
    if (task.value === null || task.value === undefined) return false;
    
    // Convert to number to handle string values
    const numericValue = typeof task.value === 'string' ? parseFloat(task.value) : task.value;
    
    // Check if it's a valid number and greater than 0
    return !isNaN(numericValue) && numericValue > 0;
  };

  return (
    <Card className={`p-4 transition-all duration-200 border-l-4 rounded-lg shadow-sm ${
      task.completed 
        ? 'bg-muted/50 border-muted hover:shadow-md' 
        : 'hover:shadow-md'
    } ${isCompleting ? 'completing' : ''} ${isDragging ? 'dragging' : ''}`}
    style={{
      borderLeftColor: category.color
    }}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-0.5">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="h-5 w-5"
            disabled={isCompleting}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Category */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium leading-tight ${
                task.completed ? 'line-through text-muted-foreground' : ''
              }`}>
                {task.title || 'Tarefa sem título'}
              </h3>
              
              {task.description && (
                <p className={`text-sm mt-1 leading-relaxed ${
                  task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'
                }`}>
                  {task.description}
                </p>
              )}
            </div>

            {/* Category Badge */}
            <Badge 
              variant="outline" 
              className="flex-shrink-0 text-xs"
              style={{ 
                borderColor: category.color,
                color: category.color
              }}
            >
              {category.name}
            </Badge>
          </div>

          {/* Task Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {/* Date */}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {task.date ? new Date(task.date + 'T00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit'
                  }) : 'Sem data'}
                </span>
                {/* Recurring Tag */}
                {frequencyLabel && (
                  <div className="flex items-center gap-1 ml-2 px-1.5 py-0.5 bg-muted rounded text-xs">
                    <Repeat className="h-3 w-3" />
                    <span>{frequencyLabel}</span>
                  </div>
                )}
              </div>

              {/* Time */}
              {task.time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{task.time.slice(0, 5)}</span>
                </div>
              )}

              {/* Value - FIXED: More robust checking */}
              {hasValidValue() && (
                <span className={`font-medium ${
                  task.completed ? '' : 'text-green-600 dark:text-green-400'
                }`}>
                  {formatCurrency(task.value)}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 w-11 p-0 opacity-60 hover:opacity-100"
                  disabled={isCompleting}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem 
                  onClick={handleEdit}
                  disabled={isCompleting}
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                  disabled={isCompleting}
                >
                  <Trash2 className="h-3 w-3 mr-2 text-destructive" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}