interface SecretsStoreSecret {
  get(): Promise<string>;
}

interface Env {
  // Production: SecretsStoreSecret (has .get() method)
  // Local (.dev.vars): plain string
  GRAVATAR_CLIENT_ID?: SecretsStoreSecret | string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const binding = context.env.GRAVATAR_CLIENT_ID;

    if (!binding) {
      // Return empty config if not configured (allows app to run without OAuth)
      return Response.json({
        gravatarClientId: null,
      });
    }

    // Check if it's a Secrets Store binding (has .get method) or a plain string (local dev)
    const clientId =
      typeof binding === 'object' && 'get' in binding
        ? await binding.get()
        : binding;

    return Response.json({
      gravatarClientId: clientId,
    });
  } catch (error) {
    console.error('Config endpoint error:', error);
    return Response.json({
      gravatarClientId: null,
      error: 'Failed to load config',
    }, { status: 500 });
  }
};
