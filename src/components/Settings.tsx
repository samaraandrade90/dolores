import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { ArrowLeft, Key, Palette, Eye, EyeOff, Loader2, Plus, Edit, Trash2, Sun, Moon } from 'lucide-react';
import { Category } from '../types';
import { toast } from 'sonner';

export interface SettingsProps {
  user: any;
  categories: Category[];
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
  onAddCategory: (category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onBack: () => void;
  isGoogleUser?: boolean;
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

export function Settings({ 
  user, 
  categories,
  isDarkMode,
  setIsDarkMode,
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory, 
  onChangePassword,
  onBack,
  isGoogleUser = false
}: SettingsProps) {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Category management state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState(PRESET_COLORS[0]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0] || 'Usuário';
    }
    return 'Usuário';
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!currentPassword.trim()) {
      toast.error('Digite sua senha atual');
      return;
    }

    if (!newPassword.trim()) {
      toast.error('Digite uma nova senha');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('A nova senha deve ser diferente da atual');
      return;
    }

    try {
      setIsChangingPassword(true);
      await onChangePassword(currentPassword, newPassword);
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast('Senha alterada', {
        className: 'material-toast',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Handle specific error messages
      if (error?.message?.includes('Invalid login credentials')) {
        toast.error('Senha atual incorreta');
      } else if (error?.message?.includes('Password should be at least')) {
        toast.error('A nova senha deve ter pelo menos 6 caracteres');
      } else {
        toast.error('Erro ao alterar senha. Tente novamente.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast.error('Digite o nome da categoria');
      return;
    }

    try {
      setIsAddingCategory(true);
      
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, { 
          name: categoryName.trim(), 
          color: categoryColor 
        });
        toast.success('Categoria atualizada com sucesso!');
        setEditingCategory(null);
      } else {
        await onAddCategory({ 
          name: categoryName.trim(), 
          color: categoryColor,
          sortOrder: categories.length
        });
        toast.success('Categoria criada com sucesso!');
      }

      // Reset form
      setCategoryName('');
      setCategoryColor(PRESET_COLORS[0]);
    } catch (error: any) {
      console.error('Error managing category:', error);
      toast.error('Erro ao salvar categoria. Tente novamente.');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color);
  };

  const handleDeleteCategory = async (id: string) => {
    if (categories.length <= 1) {
      toast.error('Você deve ter pelo menos uma categoria');
      return;
    }

    try {
      await onDeleteCategory(id);
      toast.success('Categoria removida com sucesso!');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao remover categoria. Tente novamente.');
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor(PRESET_COLORS[0]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-md mx-auto sm:max-w-lg lg:max-w-2xl">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-10 w-10 p-0 sm:h-8 sm:w-8"
            >
              <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Configurações</h1>
              <p className="text-sm text-muted-foreground">{getUserDisplayName()}</p>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 space-y-6 lg:px-6">
          {/* Appearance Section - NEW FIRST SECTION */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize a aparência do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Modo Escuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Alterne entre modo claro e escuro
                  </p>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                  aria-label="Alternar modo escuro"
                />
              </div>
            </CardContent>
          </Card>

          <Separator />
          
          {/* Categories Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Gerenciar Categorias
              </CardTitle>
              <CardDescription>
                Organize suas tarefas criando, editando ou removendo categorias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Categories List */}
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-5 h-5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="h-9 w-9 p-0 sm:h-8 sm:w-8"
                      >
                        <Edit className="h-4 w-4 sm:h-3 sm:w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive sm:h-8 sm:w-8"
                        disabled={categories.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add/Edit Category Form */}
              <div className="pt-4 border-t">
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName" className="text-base font-medium">
                      {editingCategory ? 'Editar categoria' : 'Nova categoria'}
                    </Label>
                    <Input
                      id="categoryName"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="Nome da categoria"
                      required 
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-base font-medium">Cor</Label>
                    <div className="grid grid-cols-8 gap-2 mt-3">
                      {PRESET_COLORS.map((presetColor) => (
                        <button
                          key={presetColor}
                          type="button"
                          onClick={() => setCategoryColor(presetColor)}
                          className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-105 ${
                            categoryColor === presetColor ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-foreground/20' : 'border-border'
                          }`}
                          style={{ backgroundColor: presetColor }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    {editingCategory && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={resetCategoryForm} 
                        className="flex-1"
                        disabled={isAddingCategory}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isAddingCategory || !categoryName.trim()}
                    >
                      {isAddingCategory ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingCategory ? 'Salvando...' : 'Adicionando...'}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          {editingCategory ? 'Salvar' : 'Adicionar'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Password Section - Different content for Google vs regular users */}
          <Separator />
          
          {isGoogleUser ? (
            /* Google User - Show info about Google-managed password */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Segurança da Conta
                </CardTitle>
                <CardDescription>
                  Sua conta é protegida pelo Google
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Conectado via Google</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sua senha é gerenciada pelo Google. Para alterá-la, acesse as configurações da sua conta Google.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Para alterar sua senha:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>1. Acesse <strong>myaccount.google.com</strong></li>
                    <li>2. Vá para <strong>Segurança</strong></li>
                    <li>3. Clique em <strong>Senha</strong></li>
                    <li>4. Siga as instruções do Google</li>
                  </ol>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('https://myaccount.google.com/security', '_blank')}
                >
                  Abrir Configurações do Google
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Regular User - Show password change form */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>
                  Altere sua senha para manter sua conta segura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Digite sua senha atual"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Digite uma nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10"
                        minLength={6}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 6 caracteres
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Digite novamente a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Password strength indicator */}
                  {newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`h-1 w-full rounded-full ${
                          newPassword.length >= 8 ? 'bg-green-500' : 
                          newPassword.length >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className={`${
                          newPassword.length >= 8 ? 'text-green-600' : 
                          newPassword.length >= 6 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {newPassword.length >= 8 ? 'Forte' : 
                           newPassword.length >= 6 ? 'Média' : 'Fraca'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      'Alterar Senha'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}


          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
              </div>
              
              {user?.user_metadata?.full_name && (
                <div>
                  <Label>Nome</Label>
                  <p className="text-sm text-muted-foreground mt-1">{user.user_metadata.full_name}</p>
                </div>
              )}
              
              <div>
                <Label>Conta criada em</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  }) : 'Data indisponível'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}