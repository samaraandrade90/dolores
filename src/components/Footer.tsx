import { Check, Clock } from 'lucide-react';
import { TaskInstance } from '../types';
import { formatCurrency } from '../lib/supabase';

interface FooterProps {
  tasks: TaskInstance[];
  viewMode: 'day' | 'week' | 'month' | 'year';
  filterState: 'all' | 'completed' | 'pending';
  onFilterChange: (filter: 'all' | 'completed' | 'pending') => void;
}

export function Footer({
  tasks,
  viewMode,
  filterState,
  onFilterChange,
}: FooterProps) {
  // Calculate totals
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  
  // Calculate monetary values
  const totalValue = tasks.reduce((sum, task) => sum + (task.value || 0), 0);
  const completedValue = completedTasks.reduce((sum, task) => sum + (task.value || 0), 0);
  const pendingValue = pendingTasks.reduce((sum, task) => sum + (task.value || 0), 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40">
      <div className="w-full max-w-md mx-auto sm:max-w-lg lg:max-w-2xl xl:max-w-7xl">
        <div className="p-4">
          {/* 3 Cards Layout following exact Figma design */}
          <div className="flex gap-[15px] h-[122px]">
            
            {/* Card 1: Todas/All */}
            <div 
              className={`flex-1 cursor-pointer transition-all duration-200 rounded-2xl ${
                filterState === 'all'
                  ? 'bg-[#f8f8f9] dark:bg-muted border border-[#f3f3f4] dark:border-muted'
                  : 'bg-white dark:bg-card'
              }`}
              onClick={() => onFilterChange('all')}
            >
              <div className="flex flex-col items-center justify-center h-full p-4 gap-2">
                {/* Number and Label */}
                <div className="flex flex-col gap-1 items-center text-center">
                  <div className="font-['Space_Grotesk'] font-medium text-[20px] leading-normal text-neutral-500 dark:text-muted-foreground">
                    {tasks.length}
                  </div>
                  <div className="font-['Space_Grotesk'] font-semibold text-[14px] leading-normal text-neutral-500 dark:text-muted-foreground">
                    Todas
                  </div>
                </div>

                {/* Divider and Value */}
                <div className="relative w-full">
                  <div className="border-t border-neutral-500 dark:border-muted-foreground" />
                  <div className="flex justify-center pt-2">
                    <div className="font-['Space_Grotesk'] font-medium text-[12px] leading-normal text-neutral-500 dark:text-muted-foreground text-center">
                      {formatCurrency(totalValue)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Concluídas/Completed */}
            <div 
              className={`flex-1 cursor-pointer transition-all duration-200 rounded-2xl ${
                filterState === 'completed'
                  ? 'bg-[#f8f8f9] dark:bg-muted border border-[#f3f3f4] dark:border-muted'
                  : 'bg-white dark:bg-card'
              }`}
              onClick={() => onFilterChange('completed')}
            >
              <div className="flex flex-col items-center justify-center h-full p-4 gap-2">
                {/* Number and Label */}
                <div className="flex flex-col gap-1 items-center text-center">
                  <div className="font-['Space_Grotesk'] font-medium text-[20px] leading-normal text-[#16ae65]">
                    {completedTasks.length}
                  </div>
                  <div className="font-['Space_Grotesk'] font-medium text-[14px] leading-normal text-[#16ae65]">
                    Concluídas
                  </div>
                </div>

                {/* Divider and Value with Icon */}
                <div className="relative w-full">
                  <div className="border-t border-[#16ae65]" />
                  <div className="flex justify-center pt-2">
                    <div className="flex items-center gap-2 font-['Space_Grotesk'] font-medium text-[12px] leading-normal text-[#16ae65] text-center">
                      <Check className="h-3 w-3" />
                      <span>{formatCurrency(completedValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Pendentes/Pending */}
            <div 
              className={`flex-1 cursor-pointer transition-all duration-200 rounded-2xl relative ${
                filterState === 'pending'
                  ? 'bg-[#f8f8f9] dark:bg-muted border border-[#f3f3f4] dark:border-muted'
                  : 'bg-white dark:bg-card'
              }`}
              onClick={() => onFilterChange('pending')}
            >

              
              <div className="flex flex-col items-center justify-center h-full p-4 gap-2">
                {/* Number and Label */}
                <div className="flex flex-col gap-1 items-center text-center">
                  <div className="font-['Space_Grotesk'] font-medium text-[20px] leading-normal text-[#2497fd]">
                    {pendingTasks.length}
                  </div>
                  <div className="font-['Space_Grotesk'] font-semibold text-[14px] leading-normal text-[#2497fd]">
                    Pendentes
                  </div>
                </div>

                {/* Divider and Value with Icon */}
                <div className="relative w-full">
                  <div className="border-t border-[#2497fd]" />
                  <div className="flex justify-center pt-2">
                    <div className="flex items-center gap-2 font-['Space_Grotesk'] font-medium text-[12px] leading-normal text-[#2497fd] text-center">
                      <Clock className="h-3 w-3" />
                      <span>{formatCurrency(pendingValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}