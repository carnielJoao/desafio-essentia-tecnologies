import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wrap">
      <h2>TODOs</h2>
    </div>
  `,
  styles: [`.wrap{max-width:800px;margin:40px auto;padding:12px}`]
})
export default class TodosComponent {}
