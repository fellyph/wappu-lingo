# Wappu Lingo

A gamified WordPress translation learning app that helps contributors practice translating WordPress Core and popular plugins.

![Wappu Lingo](public/wapuu.png)

## Features

- **Translation Practice**: Fetch real untranslated strings from WordPress Core, WooCommerce, Jetpack, and Akismet
- **Multiple Languages**: Support for 10+ locales including Portuguese, Spanish, French, German, Japanese, and more
- **Session-based Learning**: Practice with randomized sets of 5-30 strings per session
- **Progress Tracking**: Track your translations, skips, and session statistics
- **Gravatar Integration**: Sign in with your WordPress.com account
- **Responsive Design**: Mobile-first UI with optimized desktop layout

## Live Demo

https://wappu-lingo.pages.dev

## Tech Stack

- **React 18** with Vite
- **Vanilla CSS** with CSS custom properties
- **lucide-react** for icons
- **WordPress.com OAuth** for authentication
- **GlotPress API** for translation strings

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/fellyph/wappu-lingo.git
cd wappu-lingo

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_GRAVATAR_CLIENT_ID=your_client_id_here
```

To get a client ID:
1. Go to [Gravatar Developer Dashboard](https://gravatar.com/developers/applications)
2. Create a new application
3. Add `http://localhost:5174/` as a redirect URI
4. Copy the Client ID to your `.env.local` file

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## Project Structure

```
src/
├── App.jsx                    # Main application component
├── index.css                  # Global styles and design tokens
├── main.jsx                   # React entry point
├── components/
│   └── SettingsScreen.jsx     # Settings UI
├── constants/
│   ├── projects.js            # Available translation projects
│   └── locales.js             # Supported languages
├── hooks/
│   ├── useSettings.js         # User preferences management
│   └── useTranslationSession.js # Translation session state
├── services/
│   ├── glotpress.js           # GlotPress API client
│   └── storage.js             # localStorage wrapper
└── imgs/                      # Static images
```

## Supported Projects

| Project | Slug |
|---------|------|
| WordPress Core | `wp/dev` |
| WooCommerce | `wp-plugins/woocommerce/dev` |
| Jetpack | `wp-plugins/jetpack/dev` |
| Akismet | `wp-plugins/akismet/dev` |

## Supported Locales

Portuguese (Brazil), Spanish, French, German, Italian, Japanese, Chinese (Simplified), Russian, Arabic, Dutch

## Deployment

### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name wappu-lingo
```

Remember to add your production URL to the Gravatar OAuth redirect URIs.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## API References

- [Gravatar API Documentation](https://docs.gravatar.com)
- [GlotPress/WordPress Translation API](https://translate.wordpress.org/api/projects/)

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Wapuu](https://jawordpressorg.github.io/wapuu/) - The adorable WordPress mascot
- [WordPress Polyglots](https://make.wordpress.org/polyglots/) - The translation community
- [GlotPress](https://glotpress.org/) - The translation management system
