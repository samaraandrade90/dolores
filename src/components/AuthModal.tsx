import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Logo } from './Logo';
import { DotGrid } from './DotGrid';
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Sun, Moon, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset' | 'verify-email';

export function AuthModal({ onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Email verification states
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verificationEmail, setVerificationEmail] = useState('');
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Apply dark mode to document immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Update theme color for mobile browsers
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
          themeColorMeta = document.createElement('meta');
          themeColorMeta.setAttribute('name', 'theme-color');
          document.head.appendChild(themeColorMeta);
        }
        themeColorMeta.setAttribute('content', isDarkMode ? '#000000' : '#ffffff');
      } catch (error) {
        console.error('Failed to update theme:', error);
      }
    }
  }, [isDarkMode]);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCountdown]);

  // Theme toggle handler
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      localStorage.setItem('darkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setMessage(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setResendCountdown(0);
    setVerificationEmail('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Verifique seu email para confirmar sua conta');
        } else {
          setError('Erro ao fazer login. Tente novamente.');
        }
        return;
      }
      
      if (data.user) {
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        if (error.message.includes('User already registered')) {
          setError('Este email já está cadastrado. Tente fazer login.');
        } else {
          setError('Erro ao criar conta. Tente novamente.');
        }
        return;
      }
      
      if (data.user) {
        if (data.user.email_confirmed_at) {
          // User was automatically confirmed
          onAuthSuccess();
        } else {
          // User needs to confirm email - show verification screen
          setVerificationEmail(email.trim());
          setMode('verify-email');
          resetForm();
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`
      });
      
      if (error) {
        setError('Erro ao enviar email de recuperação. Tente novamente.');
        return;
      }
      
      setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setMode('signin');
      resetForm();
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCountdown > 0 || !verificationEmail) return;
    
    setResendLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        setError('Erro ao reenviar email. Tente novamente.');
      } else {
        setMessage('Email de verificação reenviado!');
        setResendCountdown(60); // 1 minute countdown
      }
    } catch (error) {
      console.error('Resend email error:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        setError('Erro ao fazer login com Google. Tente novamente.');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'signin': return 'Entrar';
      case 'signup': return 'Criar Conta';
      case 'reset': return 'Recuperar Senha';
      case 'verify-email': return 'Verificar Email';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'signin': return 'Entre com sua conta para acessar suas tarefas';
      case 'signup': return 'Crie uma nova conta para começar a organizar suas tarefas';
      case 'reset': return 'Insira seu email para receber instruções de recuperação';
      case 'verify-email': return 'Confirme seu email para ativar sua conta';
    }
  };

  // Email verification screen
  const renderEmailVerificationScreen = () => (
    <CardContent className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {message && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <Mail className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Clique no link do email para verificar sua conta e depois faça login.
          </p>
          <p className="text-xs text-muted-foreground">
            Não encontrou o email? Verifique sua pasta de spam.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Resend Email Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResendEmail}
          disabled={resendLoading || resendCountdown > 0}
        >
          {resendLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          {resendCountdown > 0 ? (
            `Reenviar em ${resendCountdown}s`
          ) : (
            'Reenviar Email'
          )}
        </Button>

        {/* Back to Login Button */}
        <Button
          type="button"
          variant="default"
          className="w-full"
          onClick={() => handleModeChange('signin')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o Login
        </Button>
      </div>
    </CardContent>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Dot Grid Background */}
      <DotGrid isDarkMode={isDarkMode} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Theme Toggle - Using lucide-react icons */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-10 w-10 p-0 rounded-full"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Auth Card - Logo moved inside, standard border */}
          <Card className="auth-modal shadow-lg">
            <CardHeader className="space-y-4 text-center">
              {/* Logo inside the card */}
              <div className="flex justify-center">
                <Logo className="h-8 w-40 text-foreground" />
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-base">{getModeTitle()}</CardTitle>
                <CardDescription className="text-base">
                  {getModeDescription()}
                </CardDescription>
              </div>
            </CardHeader>
            
            {/* Email Verification Screen */}
            {mode === 'verify-email' ? renderEmailVerificationScreen() : (
              <CardContent className="space-y-6">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Success Message */}
                {message && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <Mail className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                {/* Google Sign In */}
                {mode !== 'reset' && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full google-login-btn"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      Continuar com Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">ou</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Email Form */}
                <form onSubmit={
                  mode === 'signin' ? handleEmailSignIn :
                  mode === 'signup' ? handleEmailSignUp :
                  handlePasswordReset
                } className="space-y-4">
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  {mode !== 'reset' && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirme sua senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={loading}
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={loading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {mode === 'signin' ? 'Entrar' :
                     mode === 'signup' ? 'Criar Conta' :
                     'Enviar Email'}
                  </Button>
                </form>

                {/* Mode Switch Links */}
                <div className="text-center space-y-2">
                  {mode === 'signin' && (
                    <>
                      <Button
                        variant="link"
                        onClick={() => handleModeChange('reset')}
                        disabled={loading}
                        className="text-sm h-auto p-0 font-normal"
                      >
                        Esqueceu sua senha?
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Não tem uma conta?{' '}
                        <Button
                          variant="link"
                          onClick={() => handleModeChange('signup')}
                          disabled={loading}
                          className="h-auto p-0 font-normal"
                        >
                          Criar conta
                        </Button>
                      </div>
                    </>
                  )}

                  {mode === 'signup' && (
                    <div className="text-sm text-muted-foreground">
                      Já tem uma conta?{' '}
                      <Button
                        variant="link"
                        onClick={() => handleModeChange('signin')}
                        disabled={loading}
                        className="h-auto p-0 font-normal"
                      >
                        Entrar
                      </Button>
                    </div>
                  )}

                  {mode === 'reset' && (
                    <Button
                      variant="link"
                      onClick={() => handleModeChange('signin')}
                      disabled={loading}
                      className="text-sm h-auto p-0 font-normal"
                    >
                      Voltar para o login
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}