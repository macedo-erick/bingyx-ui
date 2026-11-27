# bingyx-ui

Angular 22 app for Bingyx: the organiser's screens, the player's card on the phone and the
public draw screen for the TV. PrimeNG 22 with a Christmas preset, Tailwind 4, Transloco (pt-BR).

## Running locally

Start the API stack first (`bingyx-api`, see its README), then:

```bash
yarn install
yarn start
```

The app serves on http://localhost:4203 and signs the organiser in through the local Keycloak at
http://localhost:8098/auth. Registration is open on the local realm, so create an organiser
account from the sign-in page.

## Checks

```bash
yarn lint
yarn format:check
yarn test
yarn build
```
