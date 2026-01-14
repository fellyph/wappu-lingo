# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wappu Lingo is a mobile-first React web application that gamifies WordPress translation. Users can translate WordPress core, themes, and plugins strings while tracking their contributions. The app features Wapuu (WordPress mascot) as a visual companion throughout the experience.

## Development Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run lint     # Run ESLint (--max-warnings 0)
npm run preview  # Preview production build
```

## Tech Stack

- **React 18** with Vite 4 (JSX, not TypeScript)
- **Vanilla CSS** with CSS custom properties (no CSS-in-JS or preprocessors)
- **lucide-react** for icons
- **WordPress.com OAuth** for authentication via Gravatar API

## Architecture

The app is a single-file React application (`src/App.jsx`) with:

- **State-based navigation**: `screen` state controls which view is shown (dashboard, translating, summary)
- **OAuth flow**: Token extracted from URL hash fragment, stored in localStorage (`gravatar_token`), user profile fetched from Gravatar API
- **Component structure**: One main `App` component with inline sub-components (Dashboard, LoginScreen, TranslationScreen, SummaryScreen)

### Environment Variables

- `VITE_GRAVATAR_CLIENT_ID` - WordPress.com OAuth client ID (accessed via `import.meta.env`)

## Gravatar API Integration

### OAuth 2.0 Authentication (Experimental)

**Authorization URL**: `https://public-api.wordpress.com/oauth2/authorize`

Required parameters:
- `client_id`: Application ID from Gravatar Developer Dashboard
- `redirect_uri`: Must match dashboard configuration
- `response_type`: `token` for client-side apps (returns token in URL fragment, valid 2 weeks)
- `scope`: Indexed array format - `scope[0]=auth&scope[1]=gravatar-profile:read`

**Available Scopes**:
- `auth` - Required for any endpoint access
- `gravatar-profile:read` - Read user profile data
- `gravatar-profile:manage` - Edit user profile data

**Token Validation**: `GET /oauth/token-info?client_id=ID&token=TOKEN`

### REST API

**Base URL**: `https://api.gravatar.com/v3`

**Authentication**: Bearer token in Authorization header
```
Authorization: Bearer YOUR_TOKEN
```

**Endpoints**:
- `GET /me/profile` - Authenticated user's profile (requires OAuth token)
- `GET /profiles/{hash}` - Any user's profile by SHA256 email hash

**Rate Limits**:
- Unauthenticated: 100 requests/hour
- Authenticated: 1000 requests/hour

### Creating Email Hash (SHA256)

1. Trim leading/trailing whitespace
2. Convert to lowercase
3. Hash with SHA256

```javascript
const hash = crypto.createHash('sha256')
  .update(email.trim().toLowerCase())
  .digest('hex');
```

### Profile Response Fields

- `display_name`, `avatar_url`, `profile_url`
- `location`, `description`, `job_title`, `company`
- `pronouns`, `pronunciation`
- `verified_accounts` (limited to 4 unauthenticated, more with auth)

### Avatar URL

Append size parameter: `{avatar_url}?size=256`

## WordPress Translation API (GlotPress)

**Base URL**: `https://translate.wordpress.org/api/projects/`

### Project Hierarchy

```
/api/projects/                                    # All projects
/api/projects/wp/dev/                             # WP Core (development)
/api/projects/wp-plugins/                         # All plugins
/api/projects/wp-plugins/{plugin-slug}/           # Plugin project
/api/projects/wp-plugins/{plugin-slug}/dev/       # Plugin dev version
```

### Translation Sets Endpoint

`GET /api/projects/{path}/` returns project metadata with `translation_sets` array containing per-locale stats:

```json
{
  "translation_sets": [{
    "locale": "pt-br",
    "name": "Portuguese (Brazil)",
    "current_count": 7000,
    "untranslated_count": 74,
    "waiting_count": 5,
    "fuzzy_count": 2,
    "all_count": 7074,
    "percent_translated": "99%",
    "wp_locale": "pt_BR"
  }]
}
```

### Individual Strings Endpoint

`GET /api/projects/{path}/{locale}/default/` returns JSON array of translation strings:

```json
{
  "singular": "Saturday",
  "plural": null,
  "context": null,
  "translations": ["Sábado"],
  "references": ["src/file.php:123"],
  "priority": "normal",
  "status": "current",
  "original_id": "12345",
  "project_id": "2905"
}
```

**Filter by status**: `?filters[status]=untranslated`

### Limitations

- No pagination support (known issue)
- Read-only API
- Large responses for projects with many strings
- `.po` export available but no JSON export for filtered results

### Example Endpoints

```
# WP Core pt-br strings
/api/projects/wp/dev/pt-br/default/

# WooCommerce pt-br untranslated
/api/projects/wp-plugins/woocommerce/dev/pt-br/default/?filters[status]=untranslated
```

## Design System

CSS custom properties defined in `src/index.css`:
- Colors: `--color-navy`, `--color-yellow`, `--color-green`, `--color-white`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Border radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
- Font: Outfit (loaded from Google Fonts)

Mobile-first layout constrained to 480px max-width with bottom navigation bar.
