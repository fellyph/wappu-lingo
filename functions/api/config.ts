interface Env {
  // Environment variable configured in Cloudflare Pages settings
  // or in .dev.vars for local development
  GRAVATAR_CLIENT_ID?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const clientId = context.env.GRAVATAR_CLIENT_ID;

    return Response.json({
      gravatarClientId: clientId || null,
    });
  } catch (error) {
    console.error('Config endpoint error:', error);
    return Response.json({
      gravatarClientId: null,
      error: 'Failed to load config',
    }, { status: 500 });
  }
};
