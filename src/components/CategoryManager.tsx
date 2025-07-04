import { useState } from 'react';
import { Category } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  compact?: boolean;
}

const PRESET_COLORS = [
  '#e34ab8', // Pink
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export function CategoryManager({ 
  categories, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory,
  compact = false
}: CategoryManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, { name: name.trim(), color });
      setEditingCategory(null);
    } else {
      onAddCategory({ 
        name: name.trim(), 
        color, 
        userId: '', 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sortOrder: 0
      });
    }

    setName('');
    setColor(PRESET_COLORS[0]);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setColor(category.color);
  };

  const handleDelete = (id: string) => {
    if (categories.length <= 1) {
      alert('Você deve ter pelo menos uma categoria.');
      return;
    }
    onDeleteCategory(id);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setName('');
    setColor(PRESET_COLORS[0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 flex-shrink-0 sm:h-8 sm:w-8">
            <Settings className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="h-10 sm:h-8">
            <Settings className="h-5 w-5 mr-2 sm:h-4 sm:w-4" />
            Categorias
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
          <DialogDescription>
            Organize suas tarefas criando, editando ou removendo categorias
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                    className="h-9 w-9 p-0 sm:h-8 sm:w-8"
                  >
                    <Edit className="h-4 w-4 sm:h-3 sm:w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="h-9 w-9 p-0 text-destructive hover:text-destructive sm:h-8 sm:w-8"
                    disabled={categories.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="categoryName">
                {editingCategory ? 'Editar categoria' : 'Nova categoria'}
              </Label>
              <Input
                id="categoryName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da categoria"
                required 
                className="px-[10px] py-[8px] mx-[0px] my-[8px] mt-[8px] mr-[0px] mb-[0px] ml-[0px] text-[13px] h-11 sm:h-10"
              />
            </div>
            
            <div>
              <Label>Cor</Label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    className={`w-9 h-9 rounded-full border-2 transition-all sm:w-8 sm:h-8 ${
                      color === presetColor ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: presetColor }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              {editingCategory && (
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 h-11 sm:h-10">
                  Cancelar
                </Button>
              )}
              <Button type="submit" className="flex-1 h-11 sm:h-10">
                <Plus className="h-5 w-5 mr-2 sm:h-4 sm:w-4" />
                {editingCategory ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}