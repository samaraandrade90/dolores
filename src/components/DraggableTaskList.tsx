import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { TaskCard } from './TaskCard';
import { TaskInstance, Category } from '../types';

interface DraggableTaskListProps {
  tasks: TaskInstance[];
  getCategoryById: (id: string) => Category;
  onToggleComplete: (taskId: string, instanceDate?: string) => Promise<void>;
  onEdit: (task: TaskInstance) => void;
  onDelete: (taskId: string, instanceDate?: string) => Promise<void>;
  onReorderTasks: (reorderedTasks: TaskInstance[]) => void;
  showRecurringTag: boolean;
  getFrequencyLabel: (frequency: string, customFrequencyMonths?: number) => string;
  completingTasks: Set<string>;
}

export function DraggableTaskList({
  tasks,
  getCategoryById,
  onToggleComplete,
  onEdit,
  onDelete,
  onReorderTasks,
  showRecurringTag,
  getFrequencyLabel,
  completingTasks,
}: DraggableTaskListProps) {
  const [isDragging, setIsDragging] = useState(false);

  // FIXED: Add safety checks for tasks array
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return null;
  }

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback((result: DropResult) => {
    setIsDragging(false);

    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    try {
      // Create a new array with reordered tasks
      const reorderedTasks = Array.from(tasks);
      const [removed] = reorderedTasks.splice(sourceIndex, 1);
      reorderedTasks.splice(destinationIndex, 0, removed);

      // Call the parent component's reorder handler
      onReorderTasks(reorderedTasks);
    } catch (error) {
      console.error('Error reordering tasks:', error);
    }
  }, [tasks, onReorderTasks]);

  const handleToggleComplete = useCallback(async (taskId: string, instanceDate?: string) => {
    try {
      await onToggleComplete(taskId, instanceDate);
    } catch (error) {
      console.error('Toggle task failed:', error);
    }
  }, [onToggleComplete]);

  const handleEdit = useCallback((task: TaskInstance) => {
    if (!task) {
      console.error('Cannot edit undefined task');
      return;
    }
    onEdit(task);
  }, [onEdit]);

  const handleDelete = useCallback(async (taskId: string, instanceDate?: string) => {
    try {
      await onDelete(taskId, instanceDate);
    } catch (error) {
      console.error('Delete task failed:', error);
    }
  }, [onDelete]);

  return (
    <div className="draggable-task-list">
      <DragDropContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Droppable droppableId="task-list" type="task">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-3 ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
            >
              {tasks.map((task, index) => {
                // FIXED: Add safety checks for task object
                if (!task || !task.id) {
                  return null;
                }

                const taskKey = `${task.id}-${task.instanceDate || 'none'}`;
                const isCompleting = completingTasks.has(taskKey);

                return (
                  <Draggable
                    key={taskKey}
                    draggableId={taskKey}
                    index={index}
                    isDragDisabled={isCompleting}
                  >
                    {(provided, snapshot) => {
                      const isBeingDragged = snapshot.isDragging;

                      return (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            draggable-task-container
                            ${isBeingDragged ? 'being-dragged' : ''}
                            ${isCompleting ? 'completing' : ''}
                            ${snapshot.isDragging ? 'dragging' : ''}
                          `}
                          style={{
                            ...provided.draggableProps.style,
                            // Override transform for completing items to prevent conflicts
                            ...(isCompleting && {
                              transform: provided.draggableProps.style?.transform || 'none'
                            })
                          }}
                        >
                          <div className={`
                            task-card-wrapper
                            ${isBeingDragged ? 'being-dragged' : ''}
                            ${isCompleting ? 'completing' : ''}
                          `}>
                            <TaskCard
                              task={task}
                              category={getCategoryById(task.categoryId)}
                              onToggleComplete={() => handleToggleComplete(task.id, task.instanceDate)}
                              onEdit={() => handleEdit(task)}
                              onDelete={() => handleDelete(task.id, task.instanceDate)}
                              showRecurringTag={showRecurringTag}
                              getFrequencyLabel={getFrequencyLabel}
                              isCompleting={isCompleting}
                              isDragging={isDragging}
                            />
                          </div>
                        </div>
                      );
                    }}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}