import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../core/services/security/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Визначаємо, який токен потрібен
  const isRefreshRequest =
    req.url.includes('/validate/refresh') || req.url.includes('/refresh_token');

  const token = isRefreshRequest
    ? localStorage.getItem('refresh_token')
    : authService.getToken();

  // 🪪 Якщо токен є — додаємо заголовок
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
