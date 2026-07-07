import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminToken } from '../utils/api';

export function ProtectedRoute({ children }: { children: ReactNode }) {
	const token = getAdminToken();

	if (!token) {
		return <Navigate to="/admin/login" replace />;
	}

	return <>{children}</>;
}
