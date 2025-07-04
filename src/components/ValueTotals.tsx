import { Check, Clock } from 'lucide-react';
import { TaskInstance } from '../types';
import { formatCurrency } from '../lib/supabase';

interface ValueTotalsProps {
  tasks: TaskInstance[];
  viewMode: 'day' | 'week' | 'month' | 'year';
  filterState: 'all' | 'completed' | 'pending';
  onFilterChange: (filter: 'all' | 'completed' | 'pending') => void;
}

export function ValueTotals({ tasks, viewMode, filterState, onFilterChange }: ValueTotalsProps) {
  // Calculate totals
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  
  // Calculate monetary values (only for tasks that have values)
  const totalValue = tasks.reduce((sum, task) => sum + (task.value || 0), 0);
  const completedValue = completedTasks.reduce((sum, task) => sum + (task.value || 0), 0);
  const pendingValue = pendingTasks.reduce((sum, task) => sum + (task.value || 0), 0);

  // Check if we have any monetary values to show
  const hasValues = totalValue > 0 || completedValue > 0 || pendingValue > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-40">
      <div className="w-full max-w-md mx-auto sm:max-w-lg lg:max-w-2xl xl:max-w-7xl">
        <div className="p-4">
          {/* Values Grid - 3 Cards Layout with monetary values inside buttons */}
          <div className="flex gap-[15px]">
            {/* Total/Todas */}
            <div 
              className={`flex-1 cursor-pointer transition-all ${
                filterState === 'all'
                  ? 'bg-[#f8f8f9] dark:bg-muted border border-[#f3f3f4] dark:border-muted'
                  : 'bg-white dark:bg-card shadow-sm'
              } rounded-2xl`}
              onClick={() => onFilterChange('all')}
            >
              <div className="p-4 text-center">
                {/* Number */}
                <div className="text-[20px] font-['Space_Grotesk'] font-medium text-neutral-500 dark:text-muted-foreground leading-normal mb-1">
                  {tasks.length}
                </div>
                
                {/* Label */}
                <div className="text-[14px] font-['Space_Grotesk'] font-semibold text-neutral-500 dark:text-muted-foreground leading-normal mb-2">
                  Todas
                </div>

                {/* Monetary Value - only show if has values */}
                {hasValues && (
                  <div className="text-[12px] font-['Space_Grotesk'] font-medium text-neutral-500 dark:text-muted-foreground leading-normal">
                    {formatCurrency(totalValue)}
                  </div>
                )}
              </div>
            </div>

            {/* Completed/Concluídas */}
            <div 
              className={`flex-1 cursor-pointer transition-all ${
                filterState === 'completed'
                  ? 'bg-[#f8f8f9] dark:bg-muted border border-[#f3f3f4] dark:border-muted'
                  : 'bg-white dark:bg-card shadow-sm'
              } rounded-2xl`}
              onClick={() => onFilterChange('completed')}
            >
              <div className="p-4 text-center">
                {/* Number */}
                <div className="text-[20px] font-['Space_Grotesk'] font-medium text-[#16ae65] leading-normal mb-1">
                  {completedTasks.length}
                </div>
                
                {/* Label */}
                <div className="text-[14px] font-['Space_Grotesk'] font-medium text-[#16ae65] leading-normal mb-2">
                  Concluídas
                </div>

                {/* Monetary Value with icon - only show if has values */}
                {hasValues && (
                  <div className="flex items-center justify-center gap-1 text-[12px] font-['Space_Grotesk'] font-medium text-[#16ae65] leading-normal">
                    <Check className="h-3 w-3" />
                    <span>{formatCurrency(completedValue)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pending/Pendentes */}
            <div 
              className={`flex-1 cursor-pointer transition-all ${
                filterState === 'pending'
                  ? 'bg-[#f8f8f9] dark:bg-muted border border-[#f3f3f4] dark:border-muted'
                  : 'bg-white dark:bg-card shadow-sm'
              } rounded-2xl`}
              onClick={() => onFilterChange('pending')}
            >
              <div className="p-4 text-center">
                {/* Number */}
                <div className="text-[20px] font-['Space_Grotesk'] font-medium text-[#2497fd] leading-normal mb-1">
                  {pendingTasks.length}
                </div>
                
                {/* Label */}
                <div className="text-[14px] font-['Space_Grotesk'] font-semibold text-[#2497fd] leading-normal mb-2">
                  Pendentes
                </div>

                {/* Monetary Value with icon - only show if has values */}
                {hasValues && (
                  <div className="flex items-center justify-center gap-1 text-[12px] font-['Space_Grotesk'] font-medium text-[#2497fd] leading-normal">
                    <Clock className="h-3 w-3" />
                    <span>{formatCurrency(pendingValue)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}