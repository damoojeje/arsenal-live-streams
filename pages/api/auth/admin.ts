import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Admin Authentication API
 * 
 * Password is stored in environment variable ADMIN_PASSWORD (no NEXT_PUBLIC_ prefix)
 * This keeps the password server-side only and never exposes it to the client.
 * 
 * Set the password in .env.local (which is gitignored):
 * ADMIN_PASSWORD=your_secure_password_here
 */

interface AuthResponse {
  success: boolean;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password required' });
    }

    // Get password from environment variable (server-side only, not exposed to client)
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set!');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // Validate password
    if (password === adminPassword) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }
}

