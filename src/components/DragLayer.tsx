import { useDragLayer } from 'react-dnd';
import { TaskCard } from './TaskCard';
import { TaskInstance, Category } from '../types';

const layerStyles: React.CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

function getItemStyles(initialOffset: any, currentOffset: any) {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }

  const { x, y } = currentOffset;

  const transform = `translate(${x}px, ${y}px) scale(1.05) rotate(3deg)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

interface DragLayerProps {
  getCategoryById: (id: string) => Category;
  getFrequencyLabel?: (frequency: string, customFrequencyMonths?: number) => string;
}

export function DragLayer({ getCategoryById, getFrequencyLabel }: DragLayerProps) {
  const {
    itemType,
    isDragging,
    item,
    initialOffset,
    currentOffset,
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  function renderItem() {
    switch (itemType) {
      case 'task':
        if (!item?.task) return null;
        
        const task: TaskInstance = item.task;
        const category = getCategoryById(task.categoryId);
        
        return (
          <div 
            className="drag-preview"
            style={{
              width: '90vw',
              maxWidth: '400px',
            }}
          >
            <TaskCard
              task={task}
              category={category}
              onToggleComplete={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              showRecurringTag={task.isRecurringInstance}
              getFrequencyLabel={getFrequencyLabel}
            />
          </div>
        );
      default:
        return null;
    }
  }

  if (!isDragging) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(initialOffset, currentOffset)}>
        {renderItem()}
      </div>
    </div>
  );
}