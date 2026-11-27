import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'games' },
      {
        path: 'games',
        title: 'titles.games',
        loadComponent: () => import('./features/games/games-page').then((m) => m.GamesPage),
      },
      {
        path: 'games/new',
        title: 'titles.newGame',
        loadComponent: () => import('./features/games/game-form-page').then((m) => m.GameFormPage),
      },
      {
        path: 'games/:id/invites',
        title: 'titles.invite',
        loadComponent: () => import('./features/games/invite-page').then((m) => m.InvitePage),
      },
      {
        path: 'games/:id/control',
        title: 'titles.control',
        loadComponent: () => import('./features/games/control-page').then((m) => m.ControlPage),
      },
      {
        path: 'games/:id/edit',
        title: 'titles.editGame',
        loadComponent: () => import('./features/games/game-form-page').then((m) => m.GameFormPage),
      },
    ],
  },
  {
    path: 'j/:code',
    title: 'titles.join',
    loadComponent: () => import('./features/play/join-page').then((m) => m.JoinPage),
  },
  {
    path: 's/:code',
    title: 'titles.screen',
    loadComponent: () => import('./features/screen/screen-page').then((m) => m.ScreenPage),
  },
  {
    path: 'play',
    title: 'titles.play',
    loadComponent: () => import('./features/play/play-page').then((m) => m.PlayPage),
  },
  {
    path: '**',
    title: 'titles.notFound',
    loadComponent: () => import('./features/not-found-page').then((m) => m.NotFoundPage),
  },
];
