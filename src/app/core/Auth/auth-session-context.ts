import { Injectable } from '@angular/core';

export type IdentityType =
  | 'admin'
  | 'persona';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionContext {
  private readonly storageKey =
    'habitaControlIdentityType';

  setAdmin(): void {
    sessionStorage.setItem(
      this.storageKey,
      'admin'
    );
  }

  setPersona(): void {
    sessionStorage.setItem(
      this.storageKey,
      'persona'
    );
  }

  getIdentityType():
    IdentityType | null {
    const value =
      sessionStorage.getItem(
        this.storageKey
      );

    if (
      value === 'admin' ||
      value === 'persona'
    ) {
      return value;
    }

    return null;
  }

  clear(): void {
    sessionStorage.removeItem(
      this.storageKey
    );
  }
}