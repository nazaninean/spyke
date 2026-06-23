export default async function handler(req, res) {
  // Allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Whitelist allowed domains for security
  const allowed = [
    'api.openalex.org',
    'api.semanticscholar.org',
    'api.biorxiv.org',
    'www.ebi.ac.uk',
    'eutils.ncbi.nlm.nih.gov',
    'api.crossref.org',
    'api-inference.huggingface.co',
  ];

  let targetUrl;
  try {
    targetUrl = new URL(decodeURIComponent(url));
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!allowed.some(domain => targetUrl.hostname === domain)) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Spyke/1.0 (https://spyke.vercel.app)',
        'Accept': 'application/json',
      },
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const data = await response.text();

    res.setHeader('Content-Type', contentType);
    res.status(response.status).send(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
