import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { TaskCard } from './TaskCard';
import { Search, Calendar } from 'lucide-react';
import { Task, Category } from '../types';
import { createLocalDate } from '../utils/dateHelpers';

interface SearchModalProps {
  tasks: Task[];
  categories: Category[];
  onToggleComplete: (taskId: string, instanceDate?: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function SearchModal({ tasks, categories, onToggleComplete, onEdit, onDelete }: SearchModalProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getCategoryById = (id: string) => {
    return categories.find(cat => cat.id === id) || categories[0];
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryById(task.categoryId).name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFrequencyLabel = (frequency: string, customFrequencyMonths?: number) => {
    switch (frequency) {
      case 'daily': return 'Todo dia';
      case 'weekly': return 'Toda semana'; 
      case 'monthly': return 'Todo mês';
      case 'custom': return customFrequencyMonths ? `A cada ${customFrequencyMonths} meses` : 'Personalizada';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 sm:h-8 sm:w-8">
          <Search className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar Tarefas</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          <Input
            placeholder="Digite para buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 sm:h-10"
          />
          
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
            {searchTerm.length > 0 && (
              <>
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma tarefa encontrada para "{searchTerm}"</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTasks.map((task) => {
                      // FIXED: Use createLocalDate to avoid timezone issues
                      const taskDate = createLocalDate(task.date);
                      const currentYear = new Date().getFullYear();
                      
                      return (
                        <div key={task.id} className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {taskDate.toLocaleDateString('pt-BR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: taskDate.getFullYear() !== currentYear ? 'numeric' : undefined
                            })}
                          </div>
                          <TaskCard
                            task={{
                              ...task,
                              instanceDate: task.date,
                              isRecurringInstance: task.frequency !== 'none'
                            }}
                            category={getCategoryById(task.categoryId)}
                            onToggleComplete={onToggleComplete}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            showRecurringTag={task.frequency !== 'none'}
                            getFrequencyLabel={getFrequencyLabel}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
            
            {searchTerm.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Digite acima para buscar suas tarefas</p>
                <p className="text-sm mt-1">Você pode buscar por título, descrição ou categoria</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}