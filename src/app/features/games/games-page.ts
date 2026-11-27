import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Button } from 'primeng/button';

import { injectTranslate } from '../../core/i18n/translate';
import { EDITABLE_STATUSES, GameSummary, IN_PLAY_STATUSES } from '../../shared/models/game';
import { BingyxEmptyState } from '../../shared/ui/empty-state';
import { BingyxPageHeader } from '../../shared/ui/page-header';
import { BingyxStatusTag } from '../../shared/ui/status-tag';
import { formatDayTime } from '../../shared/util/date';
import { GameService } from './game.service';

@Component({
  selector: 'bingyx-games-page',
  imports: [RouterLink, Button, BingyxPageHeader, BingyxEmptyState, BingyxStatusTag],
  templateUrl: './games-page.html',
})
export class GamesPage {
  protected readonly service = inject(GameService);
  private readonly confirm = inject(ConfirmationService);
  protected readonly t = injectTranslate();
  protected readonly formatDayTime = formatDayTime;

  constructor() {
    this.service.reload();
  }

  protected editable(game: GameSummary): boolean {
    return EDITABLE_STATUSES.includes(game.status);
  }

  protected invitable(game: GameSummary): boolean {
    return ['open', 'running', 'checking'].includes(game.status);
  }

  protected deletable(game: GameSummary): boolean {
    return !IN_PLAY_STATUSES.includes(game.status);
  }

  protected remove(game: GameSummary): void {
    this.confirm.confirm({
      header: this.t('games.deleteHeader'),
      message: this.t('games.deleteMessage', { name: game.name }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.t('common.delete'),
      rejectLabel: this.t('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.service.remove(game.id).subscribe();
      },
    });
  }
}
