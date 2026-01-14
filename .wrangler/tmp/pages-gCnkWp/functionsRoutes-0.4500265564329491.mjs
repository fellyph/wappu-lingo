import { onRequestGet as __api_translations_js_onRequestGet } from "/Users/fellyph/Sites/wappu-lingo/functions/api/translations.js"
import { onRequestOptions as __api_translations_js_onRequestOptions } from "/Users/fellyph/Sites/wappu-lingo/functions/api/translations.js"
import { onRequestPost as __api_translations_js_onRequestPost } from "/Users/fellyph/Sites/wappu-lingo/functions/api/translations.js"

export const routes = [
    {
      routePath: "/api/translations",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_translations_js_onRequestGet],
    },
  {
      routePath: "/api/translations",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_translations_js_onRequestOptions],
    },
  {
      routePath: "/api/translations",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_translations_js_onRequestPost],
    },
  ]