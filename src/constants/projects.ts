import type { Project } from '../types';

export const PROJECTS: Project[] = [
  {
    id: 'wp-core',
    name: 'WordPress Core',
    slug: 'wp/dev',
    description: 'WordPress core software',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    slug: 'wp-plugins/woocommerce/dev',
    description: 'eCommerce plugin',
  },
  {
    id: 'jetpack',
    name: 'Jetpack',
    slug: 'wp-plugins/jetpack/dev',
    description: 'Security and performance',
  },
  {
    id: 'akismet',
    name: 'Akismet',
    slug: 'wp-plugins/akismet/dev',
    description: 'Spam protection',
  },
];

export const DEFAULT_PROJECT = 'woocommerce';
