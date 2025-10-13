import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900">Todos</h1>
      <p class="text-gray-600 mt-2">Lista de tarefas (placeholder — vamos ligar à API depois).</p>
    </div>
  `,
})
export default class TodosComponent {}
