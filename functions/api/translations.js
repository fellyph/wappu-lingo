/**
 * Translations API
 * GET /api/translations - List user's translations with optional filters
 * POST /api/translations - Submit a new translation
 */

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// Handle GET requests - List translations
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Get user ID from query or header
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return Response.json(
      { error: 'user_id is required' },
      { status: 400, headers: corsHeaders }
    );
  }

  // Build query with optional filters
  let query = 'SELECT * FROM translations WHERE user_id = ?';
  const params = [userId];

  // Filter by project
  const project = url.searchParams.get('project');
  if (project) {
    query += ' AND project_slug = ?';
    params.push(project);
  }

  // Filter by locale
  const locale = url.searchParams.get('locale');
  if (locale) {
    query += ' AND locale = ?';
    params.push(locale);
  }

  // Filter by status
  const status = url.searchParams.get('status');
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  // Filter by date range
  const dateFrom = url.searchParams.get('date_from');
  if (dateFrom) {
    query += ' AND created_at >= ?';
    params.push(dateFrom);
  }

  const dateTo = url.searchParams.get('date_to');
  if (dateTo) {
    query += ' AND created_at <= ?';
    params.push(dateTo);
  }

  // Order by created_at descending
  query += ' ORDER BY created_at DESC';

  // Pagination
  const limit = parseInt(url.searchParams.get('limit')) || 50;
  const offset = parseInt(url.searchParams.get('offset')) || 0;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const result = await env.DB.prepare(query).bind(...params).all();

    return Response.json(
      {
        translations: result.results,
        meta: {
          total: result.results.length,
          limit,
          offset,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Database error:', error);
    return Response.json(
      { error: 'Failed to fetch translations' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle POST requests - Create translation
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: corsHeaders }
    );
  }

  // Validate required fields
  const required = [
    'user_id',
    'project_slug',
    'locale',
    'original_id',
    'original_string',
    'translation',
  ];

  for (const field of required) {
    if (!body[field]) {
      return Response.json(
        { error: `Missing required field: ${field}` },
        { status: 400, headers: corsHeaders }
      );
    }
  }

  try {
    const result = await env.DB.prepare(
      `INSERT INTO translations
       (user_id, user_email, project_slug, project_name, locale, original_id, original_string, translation, context, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.user_id,
        body.user_email || null,
        body.project_slug,
        body.project_name || null,
        body.locale,
        body.original_id,
        body.original_string,
        body.translation,
        body.context || null,
        body.status || 'pending'
      )
      .run();

    return Response.json(
      {
        success: true,
        id: result.meta.last_row_id,
        message: 'Translation saved successfully',
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Database error:', error);
    return Response.json(
      { error: 'Failed to save translation' },
      { status: 500, headers: corsHeaders }
    );
  }
}
