import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Popover } from 'primeng/popover';
import { Toast } from 'primeng/toast';

import { AuthService } from '../core/auth/auth.service';
import { injectTranslate } from '../core/i18n/translate';
import { BingyxLogo } from '../shared/ui/logo';

@Component({
  selector: 'bingyx-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Button,
    ConfirmDialog,
    Popover,
    Toast,
    BingyxLogo,
  ],
  templateUrl: './shell.html',
  host: { class: 'flex min-h-full flex-col' },
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly t = injectTranslate();
}
