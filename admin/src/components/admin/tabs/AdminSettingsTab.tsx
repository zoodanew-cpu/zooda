import { Key, LogOut, Info, Shield } from 'lucide-react';

interface AdminSettingsTabProps {
  onResetPassword: () => void;
  onLogout: () => void;
}

export function AdminSettingsTab({ onResetPassword, onLogout }: AdminSettingsTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Admin Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your admin account settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-warning/10">
              <Key className="h-5 w-5 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground">Password Management</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Change your admin password. You'll need to enter your current password first.
          </p>
          <button
            onClick={onResetPassword}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning text-warning-foreground font-medium text-sm hover:bg-warning/90 transition-all"
          >
            <Key className="h-4 w-4" />
            Reset Password
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">Session Management</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Log out from the admin panel. You'll need to enter your password again to log back in.
          </p>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground font-medium text-sm hover:bg-muted/80 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-info/10">
              <Info className="h-5 w-5 text-info" />
            </div>
            <h3 className="font-semibold text-foreground">Admin Panel Information</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Storage Location:</span>
              <span className="text-foreground font-medium">Local Browser Storage</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Password Security:</span>
              <span className="text-foreground font-medium">Stored locally</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Session:</span>
              <span className="text-foreground font-medium">Until logout</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 rounded-xl border border-primary/20 p-6">
        <div className="flex gap-4">
          <div className="p-2 rounded-lg bg-primary/10 h-fit">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Security Notice</h4>
            <p className="text-sm text-muted-foreground">
              Your admin password is stored locally in your browser. For security reasons,
              avoid using this admin panel on shared computers. If you suspect unauthorized access,
              reset your password immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
