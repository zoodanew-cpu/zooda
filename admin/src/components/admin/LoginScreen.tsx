import { Shield, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface LoginScreenProps {
  onSubmit: (password: string) => void;
}

export function LoginScreen({ onSubmit }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="min-h-screen bg-background bg-dots-pattern flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      
      <div className="w-full max-w-md animate-slide-in-up relative">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/25">
                <Shield className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center animate-bounce-subtle">
                <Sparkles className="h-3 w-3 text-success-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground mt-2 text-sm">Enter your admin password to continue</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-muted/50 border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            <button 
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Sign In
            </button>
          </form>
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            Protected by local authentication
          </p>
        </div>
      </div>
    </div>
  );
}

interface SetupPasswordScreenProps {
  onSubmit: (password: string, confirm: string) => void;
}

export function SetupPasswordScreen({ onSubmit }: SetupPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password, confirm);
  };

  return (
    <div className="min-h-screen bg-background bg-dots-pattern flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      
      <div className="w-full max-w-md animate-slide-in-up relative">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/25">
                <Shield className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-warning flex items-center justify-center">
                <Lock className="h-3 w-3 text-warning-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Set Admin Password</h1>
            <p className="text-muted-foreground mt-2 text-sm">First time setup. Create a secure password.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-muted/50 border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-muted/50 border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-primary transition-all"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 mt-2"
            >
              Set Password
            </button>
          </form>
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            Your password is stored locally in your browser
          </p>
        </div>
      </div>
    </div>
  );
}
