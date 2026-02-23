const SUPPORTED = ['he', 'en', 'es', 'ru', 'fr', 'pt', 'it', 'hu', 'de'] as const;

function parseLang(header: string | null): string {
  if (!header) return 'en';
  // Accept-Language: he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7
  const langs = header.split(',').map((part) => {
    const [tag, qPart] = part.trim().split(';');
    const q = qPart ? parseFloat(qPart.replace('q=', '')) : 1;
    return { lang: tag.trim().split('-')[0].toLowerCase(), q };
  });
  langs.sort((a, b) => b.q - a.q);
  for (const { lang } of langs) {
    if ((SUPPORTED as readonly string[]).includes(lang)) return lang;
  }
  return 'en';
}

export default async function handler(request: Request, context: any) {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const lang = parseLang(request.headers.get('accept-language'));
  const html = await response.text();
  const updated = html.replace(/<html([^>]*)lang="en"/, `<html$1lang="${lang}" data-lang="${lang}"`);
  return new Response(updated, {
    status: response.status,
    headers: response.headers,
  });
}

export const config = { path: '/*' };
