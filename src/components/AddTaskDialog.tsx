import { useState, useEffect } from 'react';
import { Task, Category } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Edit } from 'lucide-react';

interface AddTaskDialogProps {
  categories: Category[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  editingTask?: Task | null;
  onCloseEdit?: () => void;
  selectedDate: Date;
}

export function AddTaskDialog({ 
  categories, 
  onAddTask, 
  onUpdateTask,
  editingTask,
  onCloseEdit,
  selectedDate 
}: AddTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [date, setDate] = useState(selectedDate.toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [frequency, setFrequency] = useState<Task['frequency']>('none');
  const [customFrequencyMonths, setCustomFrequencyMonths] = useState(1);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setCategoryId(editingTask.categoryId || '');
      setDate(editingTask.date);
      setTime(editingTask.time || '');
      setFrequency(editingTask.frequency);
      setCustomFrequencyMonths(editingTask.customFrequencyMonths || 1);
      setIsOpen(true);
    }
  }, [editingTask]);

  useEffect(() => {
    if (!editingTask) {
      setDate(selectedDate.toISOString().split('T')[0]);
    }
  }, [selectedDate, editingTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      categoryId,
      date,
      time: time || undefined,
      frequency,
      customFrequencyMonths: frequency === 'custom' ? customFrequencyMonths : undefined,
      completed: editingTask?.completed || false,
      userId: '', // Will be set by the parent component
      updatedAt: new Date().toISOString()
    };

    if (editingTask && onUpdateTask) {
      onUpdateTask(editingTask.id, taskData);
      onCloseEdit?.();
    } else {
      onAddTask(taskData);
    }

    // Reset form
    setTitle('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setTime('');
    setFrequency('none');
    setCustomFrequencyMonths(1);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (editingTask && onCloseEdit) {
      onCloseEdit();
    }
  };

  return (
    <Dialog open={isOpen || !!editingTask} onOpenChange={editingTask ? handleClose : setIsOpen}>
      {!editingTask && (
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tarefa
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingTask ? (
              <>
                <Edit className="h-4 w-4 mr-2 inline" />
                Editar Tarefa
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2 inline" />
                Nova Tarefa
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {editingTask 
              ? 'Modifique as informações da tarefa selecionada'
              : 'Preencha os dados para criar uma nova tarefa'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da tarefa"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="frequency">Frequência</Label>
              <Select value={frequency} onValueChange={(value: Task['frequency']) => setFrequency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Apenas uma vez</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {frequency === 'custom' && (
            <div>
              <Label htmlFor="customFrequency">Repetir a cada (meses)</Label>
              <Input
                id="customFrequency"
                type="number"
                min="1"
                max="12"
                value={customFrequencyMonths}
                onChange={(e) => setCustomFrequencyMonths(parseInt(e.target.value))}
              />
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingTask ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}