import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from './ui/button';
import { Calendar as CalendarComponent } from './ui/calendar';
// CORREÇÃO: Import para date-fns v4.x
import { ptBR } from 'date-fns/locale';
import { TaskInstance } from '../hooks/useTodoApp';
import { Category } from '../types';

interface TaskMarker {
  categoryId: string;
  categoryColor: string;
  taskCount: number;
}

interface WeeklyCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  weekDates: Date[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  tasks: TaskInstance[];
  categories: Category[];
  getCategoryById: (id: string) => Category;
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export function WeeklyCalendar({
  selectedDate,
  onDateSelect,
  weekDates,
  onPreviousWeek,
  onNextWeek,
  tasks,
  categories,
  getCategoryById
}: WeeklyCalendarProps) {
  const today = new Date();
  const selectedDateString = selectedDate.toDateString();

  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Calendar expansion state
  const [isExpanded, setIsExpanded] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(selectedDate);

  // Helper function to get task markers for a specific date
  const getTaskMarkersForDate = (date: Date): TaskMarker[] => {
    try {
      const dateString = date.toISOString().split('T')[0];
      const dateTasks = tasks.filter(task => {
        if (!task) return false;
        return task.instanceDate === dateString || task.date === dateString;
      });
      if (dateTasks.length === 0) return [];

      // Group tasks by category
      const categoryGroups: { [categoryId: string]: TaskInstance[] } = {};
      dateTasks.forEach(task => {
        const categoryId = task.categoryId || 'default';
        if (!categoryGroups[categoryId]) {
          categoryGroups[categoryId] = [];
        }
        categoryGroups[categoryId].push(task);
      });
      // Create markers for each category (max 5)
      const markers: TaskMarker[] = [];
      const categoryIds = Object.keys(categoryGroups).slice(0, 5); // Max 5 categories

      categoryIds.forEach(categoryId => {
        const category = getCategoryById(categoryId);
        // Adicionando um fallback e log para depuração da cor
        // console.log('Verificando Categoria ID:', categoryId, 'Objeto Categoria:', category, 'Cor:', category?.color);
        markers.push({
          categoryId,
          categoryColor: category ? category.color : '#999999', // Fallback para cor padrão se não encontrar
          taskCount: categoryGroups[categoryId].length
        });
      });
      return markers;
    } catch (error) {
      console.warn('Error getting task markers for date:', date, error);
      return [];
    }
  };

  // Helper function to check if a date has tasks
  const hasTasksOnDate = (date: Date): boolean => {
    return getTaskMarkersForDate(date).length > 0;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };
  // Format month as "Mês/Ano" (e.g., "Junho/2025")
  const formatMonthTitle = (date: Date) => {
    const month = date.toLocaleDateString('pt-BR', { month: 'long' });
    const year = date.getFullYear();
    return `${month.charAt(0).toUpperCase() + month.slice(1)}/${year}`;
  };

  // Minimum swipe distance to trigger navigation
  const minSwipeDistance = 50;
  const onTouchStartHandler = (e: React.TouchEvent) => {
    // Disable swipe when calendar is expanded
    if (isExpanded) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveHandler = (e: React.TouchEvent) => {
    // Disable swipe when calendar is expanded
    if (isExpanded) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    // Disable swipe when calendar is expanded
    if (isExpanded) return;
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onNextWeek(); // Swipe left = next week
    } else if (isRightSwipe) {
      onPreviousWeek(); // Swipe right = previous week
    }
  };
  // Handle calendar date selection - SIMPLIFIED: just select the date
  const handleCalendarDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
      setIsExpanded(false); // Close calendar after selection
    }
  };
  // Handle month title click
  const handleMonthTitleClick = () => {
    setCalendarMonth(selectedDate);
    setIsExpanded(!isExpanded);
  };
  // Handle close expanded calendar
  const handleCloseExpanded = () => {
    setIsExpanded(false);
  };
  // Render task markers for a date - SAME AS COMPACT CALENDAR
  const renderTaskMarkers = (markers: TaskMarker[]) => {
    if (markers.length === 0) return null;

    return (
       <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-[1px] justify-center items-center">
        {markers.map((marker, index) => (
          <div
            key={`${marker.categoryId}-${index}`}
            className="task-marker"
            style={{
              width: '4px',
              height: '4px',
              backgroundColor: marker.categoryColor,
              borderRadius: '2px',
              minWidth: '4px'
            }}
            title={`${marker.taskCount} tarefa(s) da categoria ${getCategoryById(marker.categoryId).name}`}
          />
        ))}
      </div>
    );
  };

  // -------------------------------------------------------------
  // NOVO COMPONENTE CustomDay PARA O CALENDÁRIO EXPANDIDO
  // -------------------------------------------------------------
  // Este componente será passado para o CalendarComponent para renderizar cada dia
  // Ele permite injetar nossos marcadores customizados.
  const CustomDay = ({ date }: { date: Date }) => {
    const isSelected = date.toDateString() === selectedDateString;
    const isToday = date.toDateString() === today.toDateString();
    const markers = getTaskMarkersForDate(date); // Obtém os marcadores para este dia

    return (
      <div
        className={`
          relative w-full h-full p-0 font-medium text-center text-base rounded-lg transition-colors
          ${isSelected ? 'bg-primary text-primary-foreground' : ''}
          ${isToday ? 'bg-accent text-accent-foreground font-semibold' : ''}
          ${!isSelected && !isToday ? 'hover:bg-accent/50' : ''}
          ${date.getMonth() !== calendarMonth.getMonth() ? 'text-muted-foreground opacity-50' : ''}
        `}
        onClick={() => handleCalendarDateSelect(date)}
      >
        <span className="absolute top-1 left-1/2 transform -translate-x-1/2">
          {date.getDate()}
        </span>
        {renderTaskMarkers(markers)} {/* AQUI renderizamos os marcadores customizados */}
      </div>
    );
  };


  if (isExpanded) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border transition-all duration-300">
        {/* Expanded Calendar Header - Only close button */}
        <div className="flex items-center justify-end mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseExpanded}
            className="h-10 w-10 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Full Calendar com componente customizado */}
        <div className="flex justify-center">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarDateSelect}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            locale={ptBR}
            className="rounded-md border-0 w-full max-w-none"
            // Habilitando o Day customizado para renderizar os marcadores
            components={{
              Day: CustomDay
            }}
            // REMOVIDO: modifiers e modifiersClassNames, pois o CustomDay já cuida da lógica
            classNames={{
              months: "flex flex-col w-full",
              month: "flex flex-col gap-6 w-full",
              caption: "flex justify-center pt-2 relative items-center w-full mb-4",
              caption_label: "text-xl font-medium",
              nav: "flex items-center gap-2",
              nav_button: "size-10 bg-transparent p-0 opacity-70 hover:opacity-100 border border-input hover:bg-accent transition-colors",
              nav_button_previous: "absolute left-2",
              nav_button_next: "absolute right-2",
              table: "w-full border-collapse",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground rounded-md flex-1 font-medium text-base text-center py-3",
              row: "flex w-full mt-3",
              cell: "relative p-1 text-center text-base focus-within:relative focus-within:z-20 flex-1 h-14",
              day: "w-full h-full p-0 font-medium aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground transition-colors rounded-lg text-base relative",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground font-semibold",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
          />
        </div>

        {/* REMOVIDO: O BLOCO <style jsx> para o marcador genérico */}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border transition-all duration-300 weekly-calendar">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleMonthTitleClick}
          className="text-lg font-semibold text-foreground capitalize hover:text-primary transition-colors cursor-pointer"
        >
          {formatMonthTitle(weekDates[0])}
        </button>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousWeek}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextWeek}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className="grid grid-cols-7 gap-1"
        onTouchStart={onTouchStartHandler}
        onTouchMove={onTouchMoveHandler}
        onTouchEnd={onTouchEndHandler}
      >
        {weekDates.map((date, index) => {
          const isSelected = date.toDateString() === selectedDateString;
          const isToday = date.toDateString() === today.toDateString();
          const taskMarkers = getTaskMarkersForDate(date);
          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={`
                weekly-calendar-day flex flex-col items-center rounded-lg transition-all duration-200 h-[59px] justify-center touch-manipulation relative
                ${isSelected
                  ? 'bg-primary text-primary-foreground px-3 py-2'
                  : isToday
                  ? 'bg-accent text-accent-foreground px-2 py-2'
                  : 'hover:bg-accent/50 px-2 py-2'
                }
              `}
            >
              <span className={`text-gray-600 dark:text-gray-400 mb-1 ${
                isSelected
                  ? 'text-sm font-medium'
                  : 'text-xs'
              }`}>
                {dayNames[index]}
              </span>
              <span className={`font-medium ${
                isSelected
                  ? 'text-lg'
                  : 'text-sm'
              } ${isSelected ?
                '' : 'text-foreground'}`}>
                {date.getDate()}
              </span>

              {/* Task markers - colored by category */}
              {renderTaskMarkers(taskMarkers)}
            </button>
          );
        })}
      </div>
    </div>
  );
}