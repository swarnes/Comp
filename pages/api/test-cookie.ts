import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set a simple test cookie
  res.setHeader('Set-Cookie', [
    'test-cookie=hello; Path=/; HttpOnly; SameSite=Lax',
    'test-cookie-secure=world; Path=/; HttpOnly; SameSite=Lax; Secure',
  ]);
  
  // Return info about the request
  res.status(200).json({
    message: 'Test cookie endpoint',
    cookies: req.cookies,
    headers: {
      host: req.headers.host,
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'x-forwarded-host': req.headers['x-forwarded-host'],
    },
    setCookieHeader: res.getHeader('Set-Cookie'),
  });
}

