import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function RoleRoute({ allowedRoles, redirectTo = '/', children }) {
  const { user, isAuthenticated, authChecked, isLoadingAuth } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
