import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Calendar, Clock, ChevronDown, ChevronUp, X, Plus } from 'lucide-react';
import { Task, Category } from '../types';
import { parseCurrencyToCents, formatCurrency, formatCurrencyInput, isValidCurrencyInput, cleanCurrencyInput } from '../lib/supabase';

export interface QuickAddTaskProps {
  categories: Category[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  selectedDate: Date;
  initialData?: Task;
  forceExpanded?: boolean;
  onCancel?: () => void;
}

type ExpansionState = 'collapsed' | 'basic' | 'full';

export function QuickAddTask({ 
  categories, 
  onAddTask, 
  selectedDate, 
  initialData,
  forceExpanded = false,
  onCancel 
}: QuickAddTaskProps) {
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [date, setDate] = useState(
    initialData?.date || selectedDate.toISOString().split('T')[0]
  );
  const [time, setTime] = useState(initialData?.time || '');
  const [frequency, setFrequency] = useState(initialData?.frequency || 'none');
  const [customFrequencyMonths, setCustomFrequencyMonths] = useState(initialData?.customFrequencyMonths || 1);
  const [value, setValue] = useState(
    initialData?.value ? formatCurrency(initialData.value) : ''
  );
  const [rawValue, setRawValue] = useState(''); // Para controlar entrada sem máscara

  // UI state - SEMPRE inicia compacto (collapsed), exceto se forceExpanded
  const [expansionState, setExpansionState] = useState<ExpansionState>(
    forceExpanded ? 'full' : 'collapsed'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-select first category if none selected
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categoryId, categories]);

  // Focus input when expanding
  useEffect(() => {
    if (expansionState === 'basic' || expansionState === 'full') {
      inputRef.current?.focus();
    }
  }, [expansionState]);

  // Handle ESC key and click outside (disabled when forceExpanded)
  useEffect(() => {
    if (forceExpanded) {
      // In forceExpanded mode, only handle ESC for cancel
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onCancel?.();
        } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      
          event.preventDefault();
          if (title.trim() && categoryId && date && !isSubmitting) {
            const form = cardRef.current?.querySelector('form');
            if (form) {
              form.requestSubmit();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (expansionState === 'basic' || expansionState === 'full')) {
        setExpansionState('collapsed');
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (!target || !cardRef.current) return;

      // Don't close if clicking on select-related elements (including portals)
      const isSelectRelated = 
        // Within our card
        cardRef.current.contains(target) ||
        // Select content (rendered in portals)
        target.closest('[data-radix-select-content]') ||
        target.closest('[data-slot="select-content"]') ||
        target.closest('[data-radix-select-viewport]') ||
        target.closest('[data-radix-popper-content-wrapper]') ||
        // Any Radix portal
        target.closest('[data-radix-portal]') ||
        // Select trigger elements
        target.closest('[data-radix-select-trigger]') ||
        target.closest('[data-slot="select-trigger"]') ||
        // Select item elements  
        target.closest('[data-radix-select-item]') ||
        target.closest('[data-slot="select-item"]');

      // Only close if we're in expanded state and click is truly outside
      if (
        !isSelectRelated &&
        (expansionState === 'basic' || expansionState === 'full')
      ) {
        setExpansionState('collapsed');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expansionState, forceExpanded, onCancel, title, categoryId, date, isSubmitting]);

  // Get selected category
  const selectedCategory = categories.find(cat => cat.id === categoryId);

  // Handle input focus - expand to basic mode (disabled when forceExpanded)
  const handleInputFocus = () => {
    if (forceExpanded) return; // Don't change state when forced expanded
    if (expansionState === 'collapsed') {
      setExpansionState('basic');
    }
  };

  // Handle currency input change with formatting
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    console.log('💰 Input value received:', inputValue);
    
    // Validar se entrada é permitida
    if (!isValidCurrencyInput(inputValue)) {
      console.log('❌ Invalid currency input, ignoring');
      return;
    }
    
    // Limpar entrada
    const cleanedInput = cleanCurrencyInput(inputValue);
    console.log('🧹 Cleaned input:', cleanedInput);
    
    // Se usuário apagou tudo, limpar campos
    if (!cleanedInput) {
      setValue('');
      setRawValue('');
      return;
    }
    
    // Atualizar valor bruto para tracking
    setRawValue(cleanedInput);
    
    // Aplicar formatação automática se há números
    const numbersOnly = cleanedInput.replace(/\D/g, '');
    if (numbersOnly) {
      const formatted = formatCurrencyInput(cleanedInput);
      console.log('✨ Formatted value:', formatted);
      setValue(formatted);
    } else {
      setValue(cleanedInput); // Permite entrada parcial como "R$"
    }
  };

  // Validate and normalize time format
  const normalizeTime = (timeValue: string): string | null => {
    if (!timeValue || timeValue.trim() === '') {
      return null;
    }
    
    const trimmed = timeValue.trim();
    
    // Check if it's already in HH:MM format (from HTML5 time input)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(trimmed)) {
      return trimmed;
    }
    
    // If not valid format, return null
    console.warn('Invalid time format:', timeValue);
    return null;
  };

  // Quick add function for collapsed state
  const handleQuickAdd = async () => {
    if (!title.trim() || !categoryId || !date) return;
    
    try {
      setIsSubmitting(true);
      
      const taskData = {
        title: title.trim(),
        description: '',
        categoryId,
        date,
        time: null, // Always null for quick add
        completed: false,
        frequency: 'none' as const,
        customFrequencyMonths: null,
        value: 0,
        userId: '', // Will be set by the parent component
        updatedAt: new Date().toISOString()
      };

      await onAddTask(taskData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setValue('');
      setRawValue('');
      setTime('');
      setFrequency('none');
      setCustomFrequencyMonths(1);
      
      // Keep collapsed state and auto-select same category
      setExpansionState('collapsed');
      
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !categoryId || !date) return;
    
    try {
      setIsSubmitting(true);
      
      // Normalize time and handle frequency constraints
      const normalizedTime = normalizeTime(time);
      
      // Parse value properly
      let parsedValue = 0;
      if (value && value.trim()) {
        try {
          parsedValue = parseCurrencyToCents(value);
          console.log('💰 Final parsed value:', { original: value, parsed: parsedValue });
        } catch (error) {
          console.error('Error parsing value:', error);
          parsedValue = 0;
        }
      }
      
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        date,
        time: normalizedTime, // Use normalized time (null if empty/invalid)
        completed: false,
        frequency: frequency as Task['frequency'],
        customFrequencyMonths: frequency === 'custom' ? customFrequencyMonths : null,
        value: parsedValue,
        userId: '', // Will be set by the parent component
        updatedAt: new Date().toISOString()
      };

      console.log('📝 Submitting task with data:', taskData);
      await onAddTask(taskData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setValue('');
      setRawValue('');
      setTime('');
      setFrequency('none');
      setCustomFrequencyMonths(1);
      
      // Collapse back to minimal state (unless forced expanded)
      if (!forceExpanded) {
        setExpansionState('collapsed');
      }
      
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get card classes for theme
  const getCardClasses = () => {
    return 'transition-colors duration-200';
  };

  // Get frequency label
  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Diária';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'custom': return 'Personalizada';
      default: return 'Única';
    }
  };

  const currentState = forceExpanded ? 'full' : expansionState;

  return (
    <div className="w-full">
      {initialData && !forceExpanded && (
        <div className="mb-4">
          <h3 className="font-medium text-sm text-muted-foreground">Editando Tarefa</h3>
        </div>
      )}

      <div ref={cardRef}>
        <Card className={`${getCardClasses()} p-4 quick-add-card`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main Input - Always visible with enhanced styling */}
            <div className="space-y-3">
              {/* Enhanced Input Container with Add Button */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    placeholder={initialData ? "Editar título da tarefa..." : "O que você precisa fazer hoje?"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={handleInputFocus}
                    className="font-medium"
                    required
                  />
                </div>
                
                {/* Quick Add Button - Only show when collapsed and has content */}
                {currentState === 'collapsed' && title.trim() && (
                  <Button
                    type="button"
                    onClick={handleQuickAdd}
                    className="h-10 w-10 p-0 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 border-0 rounded-lg flex-shrink-0"
                    disabled={!title.trim() || !categoryId || !date || isSubmitting}
                  >
                    <Plus className="h-5 w-5 text-white dark:text-black" />
                  </Button>
                )}
                
                {/* Expand Button - Only show when collapsed and no content */}
                {currentState === 'collapsed' && !title.trim() && (
                  <Button
                    type="button"
                    onClick={() => setExpansionState('basic')}
                    className="h-10 w-10 p-0 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 border-0 rounded-lg flex-shrink-0"
                  >
                    <Plus className="h-4 w-4 text-white dark:text-black" />
                  </Button>
                )}
              </div>

              {/* Basic Expanded Options */}
              {(currentState === 'basic' || currentState === 'full') && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria</label>
                    <Select value={categoryId} onValueChange={setCategoryId} required>
                      <SelectTrigger>
                        <SelectValue>
                          {selectedCategory && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: selectedCategory.color }}
                              />
                              {selectedCategory.name}
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
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

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Data
                      </label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Horário
                      </label>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Full Expanded Options */}
              {currentState === 'full' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      placeholder="Descrição (opcional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Value - Enhanced with automatic formatting */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Valor <span className="text-xs text-muted-foreground">(opcional)</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="0,00"
                        value={value}
                        onChange={handleValueChange}
                        className="pl-8"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        
                      </div>
                    </div>
                    
                  </div>

                  {/* Frequency */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Frequência
                    </label>
                    <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                      <SelectTrigger>
                        <SelectValue>
                          <Badge variant="outline" className="text-xs">
                            {getFrequencyLabel(frequency)}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Única</SelectItem>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="custom">Personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Frequency Months */}
                  {frequency === 'custom' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Repetir a cada (meses)</label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={customFrequencyMonths}
                        onChange={(e) => setCustomFrequencyMonths(parseInt(e.target.value) || 1)}
                        placeholder="Número de meses"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons - Show only when expanded */}
            {(currentState === 'basic' || currentState === 'full') && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  {/* More Options Button - Only show in basic state and not forced expanded */}
                  {currentState === 'basic' && !forceExpanded && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpansionState('full')}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Mais opções
                    </Button>
                  )}

                  {/* Less Options Button - Only show in full state and not forced expanded */}
                  {currentState === 'full' && !forceExpanded && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpansionState('basic')}
                      className="flex items-center gap-1"
                    >
                      <ChevronUp className="h-4 w-4" />
                      Menos opções
                    </Button>
                  )}

                  {/* Cancel Button - Only show when forced expanded (edit mode) - NO ICON */}
                  {forceExpanded && onCancel && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onCancel}
                      className="flex items-center gap-1"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>

                {/* Add/Save Button */}
                <Button 
                  type="submit" 
                  disabled={!title.trim() || !categoryId || !date || isSubmitting}
                  className="flex-shrink-0 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                >
                  {isSubmitting ? 'Salvando...' : (initialData ? 'Salvar' : 'Ahh, dor no corpo!')}
                </Button>
              </div>
            )}
          </form>

          {/* Help text for keyboard shortcuts in edit mode */}
          {forceExpanded && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Ctrl+Enter para salvar • ESC para cancelar
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}