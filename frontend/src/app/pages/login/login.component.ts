import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().trim().email('Formato de e-mail inválido.'),
  password: z.string().min(4, 'Senha deve ter ao menos 4 caracteres.'),
});
type LoginData = z.infer<typeof LoginSchema>;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="min-h-screen grid place-items-start pt-12 bg-white">
    <div class="w-full max-w-md mx-auto px-4">
      <div class="text-center font-semibold text-2xl text-gray-800 mb-3">TechX</div>

      <section class="bg-white border border-gray-200 rounded-2xl shadow p-7">
        <h2 class="text-center text-xl font-bold text-gray-900 mb-4">Acesse sua conta</h2>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-3">
          <div>
            <label class="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              formControlName="email"
              autocomplete="email"
              placeholder="Digite seu email completo"
              class="w-full h-12 px-3 rounded-lg border border-gray-300 bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <small class="text-red-700 text-xs"
              *ngIf="form.controls.email.touched && form.controls.email.invalid">
              {{
                form.controls.email.errors?.['zod'] ??
                (form.controls.email.errors?.['required'] && 'E-mail é obrigatório.') ??
                (form.controls.email.errors?.['email'] && 'Formato de e-mail inválido.')
              }}
            </small>
          </div>

          <div>
            <label class="block text-sm text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              formControlName="password"
              autocomplete="current-password"
              placeholder="Digite sua senha"
              class="w-full h-12 px-3 rounded-lg border border-gray-300 bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <small class="text-red-700 text-xs"
              *ngIf="form.controls.password.touched && form.controls.password.invalid">
              {{
                form.controls.password.errors?.['zod'] ??
                (form.controls.password.errors?.['required'] && 'Senha é obrigatória.') ??
                (form.controls.password.errors?.['minlength'] && 'Senha deve ter ao menos 4 caracteres.')
              }}
            </small>
          </div>

          <button type="submit"
            class="w-full h-12 rounded-lg bg-blue-600 text-white font-semibold
                   flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            [disabled]="form.invalid || loading()" [attr.aria-busy]="loading()">
            <span *ngIf="loading()"
                  class="inline-block w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin"></span>
            {{ loading() ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <p class="text-red-700 text-sm text-center mt-3" *ngIf="error()">{{ error() }}</p>
      </section>
    </div>
  </div>
  `,
})
export default class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private token = inject(TokenStorageService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['demo@demo.com', [Validators.required, Validators.email]],
    password: ['123456', [Validators.required, Validators.minLength(4)]],
  });

  onSubmit() {
    if (this.loading()) return;

    const parsed = LoginSchema.safeParse(this.form.value);
    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;
      if (issues.email?.length) this.form.get('email')?.setErrors({ zod: issues.email[0] });
      if (issues.password?.length) this.form.get('password')?.setErrors({ zod: issues.password[0] });
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(parsed.data as LoginData).subscribe({
      next: (res) => {
        this.token.setToken(res.token);
        this.token.setUser(res.user);
        this.router.navigate(['/app/todos']);
      },
      error: (err) => {
        if (err?.status === 401) {
          this.error.set('Credenciais inválidas. Verifique seu e-mail e senha.');
        } else {
          const backendMsg = err?.error?.message;
          this.error.set(
            backendMsg === 'Invalid credentials'
              ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
              : (backendMsg || 'Falha no login.')
          );
        }
        this.loading.set(false);
      }
    });
  }
}
