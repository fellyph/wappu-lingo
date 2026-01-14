# Wappu Lingo - WordPress Translator App

## Overview

Wappu Lingo is a mobile-first web application designed to gamify and simplify the process of translating WordPress core, themes, and plugins. The app features Wapuu, the WordPress mascot, to provide an engaging experience for contributors.

## Visual Design (Based on Image)

- **Primary Colors**:
  - Deep Navy Blue (#001E36 or similar) for headers and backgrounds.
  - Vibrant Yellow (#FFD700) for primary buttons and secondary backgrounds.
  - Forest Green (#2E7D32) for success actions and tags.
  - White (#FFFFFF) for cards and text.
- **Typography**: Modern, sans-serif (e.g., Inter, Roboto, or Outfit).
- **Mascot**: Wapuu hugging a WordPress logo, with various expressions (happy, cheering).
- **Layout**: Mobile-first, card-based interface with a bottom navigation bar.

## Key Features

### 1. Dashboard (Home Screen)

- **App Title**: "WordPress Translator"
- **User Stats**:
  - `Translated`: Total strings translated by the user.
  - `Approved`: Total strings approved by reviewers.
- **Primary CTA**: "Start Translating!" button in bright yellow.
- **Mascot**: Large Wapuu icon welcoming the user.
- **Navigation**: Home, Community, Verification, and Settings icons.

### 2. Translation Interface

- **Target Language**: Displayed at the top (e.g., "Translate to: Portuguese (Brazil)").
- **Progress Tracking**: A progress bar showing translation status.
- **Translation Card**:
  - `Original String`: The source text (e.g., "Saturday").
  - `Priority Tag`: Indicates importance.
  - `Source Info`: Where the string originates (e.g., "WordPress Core (Development)").
  - `Translation Input`: Text area or input for user's translation.
  - `Submit Button`: Clear action with a checkmark.
- **Mascot Feedback**: Wapuu appears in the corner to cheer on the user.

### 3. Weekly Summary

- **Summary Header**: "Weekly Summary"
- **Approval Stats**: Number of strings approved in the current week.
- **Encouragement**: Motivational text (e.g., "Great job! More approvals are on the way.").
- **Navigation**: "View All Translations" link.

## Technical Stack (Planned)

- **Framework**: React.js (via Vite)
- **Styling**: Vanilla CSS with modern features (Gradients, Flexbox, Grid, Glassmorphism).
- **State Management**: React Hooks (useState, useEffect).
- **Animations**: Subtle CSS transitions and micro-animations.

### Gravatar API Integration

Source: [Gravatar Developer Docs](https://docs.gravatar.com/)

#### OAuth 2.0 Authentication

**Authorization URL**: `https://public-api.wordpress.com/oauth2/authorize`

Required parameters:
- `client_id`: Application ID from [Gravatar Developer Dashboard](https://gravatar.com/developers/)
- `redirect_uri`: Must match dashboard configuration
- `response_type`: `token` (client-side) or `code` (server-side)
- `scope`: Use indexed array format - `scope[0]=auth&scope[1]=gravatar-profile:read`

**Available Scopes**:
- `auth` - Required for any endpoint access
- `gravatar-profile:read` - Read user profile data
- `gravatar-profile:manage` - Edit user profile data

**Token Handling**:
- Client-side (`response_type=token`): Token returned in URL fragment (`#access_token=...`), valid for 2 weeks
- Server-side (`response_type=code`): Exchange code at `https://public-api.wordpress.com/oauth2/token` with `client_secret`

**Token Validation**: `GET /oauth/token-info?client_id=ID&token=TOKEN`

#### REST API

**Base URL**: `https://api.gravatar.com/v3`

**Authentication**: Bearer token in Authorization header
```
Authorization: Bearer YOUR_TOKEN
```

**Endpoints**:
- `GET /me/profile` - Authenticated user's own profile (requires OAuth token)
- `GET /profiles/{hash}` - Any user's profile by SHA256 email hash (API key or OAuth)

**Rate Limits**:
- Unauthenticated: 100 requests/hour
- Authenticated: 1000 requests/hour
- Avatar requests don't count toward profile limits

#### Creating Email Hash (SHA256)

1. Trim leading/trailing whitespace
2. Convert to lowercase
3. Hash with SHA256

```javascript
const hash = crypto.createHash('sha256')
  .update(email.trim().toLowerCase())
  .digest('hex');
```

Example: `MyEmailAddress@example.com ` → `84059b07d4be67b806386c0aad8070a23f18836bbaae342275dc0a83414c32ee`

#### Profile Response Fields

- `display_name` - User's display name
- `avatar_url` - Avatar image URL
- `profile_url` - Link to full Gravatar profile
- `location` - Geographical location
- `description` - User biography
- `job_title` - Current position
- `company` - Employer name
- `pronouns` - Preferred pronouns
- `pronunciation` - Name pronunciation guide
- `verified_accounts` - Array of verified social accounts (limited to 4 unauthenticated)

Full profile fields (authenticated only): timezone, languages, first/last names, links, interests, gallery images, timestamps.

#### Avatar URL

Use the `avatar_url` from profile response with optional size parameter:
```
{avatar_url}?size=256
```

Requirement: The user's profile picture on the "Dashboard" and "Success" screens must be fetched dynamically from the profile's `avatar_url` field.

### WordPress Translation API (GlotPress)

Source: [translate.wordpress.org](https://translate.wordpress.org/)

The translation strings are fetched from the GlotPress-powered WordPress translation platform.

#### Base URL

`https://translate.wordpress.org/api/projects/`

#### Project Hierarchy

```
/api/projects/                                    # All projects list
/api/projects/wp/dev/                             # WordPress Core (development)
/api/projects/wp-plugins/                         # All plugins (large response)
/api/projects/wp-plugins/{plugin-slug}/           # Specific plugin
/api/projects/wp-plugins/{plugin-slug}/dev/       # Plugin development version
/api/projects/wp-themes/                          # All themes
/api/projects/wp-themes/{theme-slug}/             # Specific theme
```

#### Translation Sets Endpoint

`GET /api/projects/{project-path}/`

Returns project metadata including `translation_sets` array with per-locale statistics:

| Field | Description |
|-------|-------------|
| `locale` | Language code (e.g., "pt-br") |
| `name` | Human-readable language name |
| `current_count` | Approved translations |
| `untranslated_count` | Strings needing translation |
| `waiting_count` | Pending review |
| `fuzzy_count` | Approximate/uncertain translations |
| `all_count` | Total strings in project |
| `percent_translated` | Completion percentage |
| `wp_locale` | WordPress locale code (e.g., "pt_BR") |
| `last_modified` | Last activity timestamp |

#### Individual Strings Endpoint

`GET /api/projects/{project-path}/{locale}/default/`

Returns JSON array of translation string objects:

| Field | Description |
|-------|-------------|
| `singular` | Original English string |
| `plural` | Plural form (if applicable) |
| `context` | Translation context |
| `translations` | Array of translated strings |
| `references` | Source file locations |
| `priority` | String priority level |
| `status` | Translation status |
| `original_id` | Unique string identifier |
| `project_id` | Parent project ID |
| `translator_comments` | Notes for translators |
| `extracted_comments` | Developer comments |

#### Filtering Strings

Append query parameter to filter by status:

```
?filters[status]=untranslated    # Only untranslated strings
?filters[status]=waiting         # Pending review
?filters[status]=fuzzy           # Fuzzy/uncertain
?filters[status]=current         # Approved translations
```

#### Example API Calls

```bash
# Get WP Core pt-br translation stats
GET /api/projects/wp/dev/

# Get WooCommerce pt-br untranslated strings
GET /api/projects/wp-plugins/woocommerce/dev/pt-br/default/?filters[status]=untranslated

# Get WordPress Core pt-br strings
GET /api/projects/wp/dev/pt-br/default/
```

#### Known Limitations

- **No pagination**: API returns all matching strings in single response
- **Read-only**: No write endpoints for submitting translations
- **Large responses**: Plugin projects may have 10,000+ strings
- **No JSON export**: Filtered exports only available as `.po` files via web UI

#### Export URL (PO format only)

```
https://translate.wordpress.org/projects/{path}/{locale}/default/export-translations/?filters[status]=untranslated
```

Note: This returns a `.po` file, not JSON. For JSON data, use the API endpoints above.
