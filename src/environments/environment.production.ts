import { Environment } from './environment.model';

// The UI, the API and Keycloak share one origin behind nginx (/ui, /api, /auth), so the image
// carries no domain and the same build serves whatever host it is deployed under.
const origin = window.location.origin;

export const environment: Environment = {
  production: true,
  apiUrl: `${origin}/api`,
  keycloak: {
    url: `${origin}/auth`,
    realm: 'bingyx',
    clientId: 'bingyx-ui',
  },
  primeUiLicense:
    'eyJpZCI6ImE0MmJjNTAyLWY4OTUtNGVmNi05ZTczLTFlOTc3ODYxN2E5YyIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODU4MDY5MDYsImV4cCI6MTgxNzM0MjkwNn0.T5cOipxcy6E1I8jTBQaa3v3073YOytbhr2FkKKqV7HJOghFd6VCnItsxdXVkaFIbHP3V3i4iy-11eVMD0cZ0Bw',
};
