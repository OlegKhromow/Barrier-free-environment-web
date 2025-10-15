import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Якщо користувач не залогінений → 401
  if (!auth.isLoggedIn()) {
    router.navigate(['/unauthorized-401']);
    return of(false);
  }

  const requiredRole = route.data['role'] as string | undefined;

  // Якщо роль не вимагається — пропускаємо
  if (!requiredRole) {
    return of(true);
  }

  // Якщо роль вимагається — перевіряємо з бекенду
  return auth.getAuthoritiesByUsername().pipe(
    map((authorities: string[]) => {
      // якщо не має ні USER, ні ADMIN — також 401
      const hasAnyRole = authorities.includes('USER') || authorities.includes('ADMIN');
      if (!hasAnyRole) {
        router.navigate(['/unauthorized-401']);
        return false;
      }

      // якщо не має потрібної ролі — 403
      const hasRequired = authorities.includes(requiredRole);
      if (!hasRequired) {
        router.navigate(['/unauthorized-403']);
        return false;
      }

      return true;
    }),
    catchError(() => {
      router.navigate(['/unauthorized-401']);
      return of(false);
    })
  );
};
