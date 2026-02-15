import { type RouteConfig, layout, route, index } from '@react-router/dev/routes';

export default [
  layout('routes/layout.tsx', [
    index('routes/index.tsx'),
    route('entries', 'routes/entries.tsx'),
    route('processing', 'routes/processing.tsx'),
    route('databases', 'routes/databases.tsx'),
    route('settings', 'routes/settings.tsx'),
  ]),
] satisfies RouteConfig;
