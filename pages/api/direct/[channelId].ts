import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface StreamResult {
  url?: string;
  headers?: Record<string, string>;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { channelId } = req.query;

  if (!channelId || typeof channelId !== 'string') {
    return res.status(400).json({ error: 'Channel ID is required' });
  }

  try {
    // Path to Python extraction script
    const scriptPath = path.join(process.cwd(), 'scripts', 'extract_stream.py');

    // Execute Python script
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" "${channelId}"`,
      { timeout: 30000 } // 30 second timeout
    );

    if (stderr && !stdout) {
      console.error('Python script error:', stderr);
      return res.status(500).json({ error: 'Stream extraction failed' });
    }

    // Parse result
    const result: StreamResult = JSON.parse(stdout);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // Return the direct stream URL and headers
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error calling Python extraction:', error);
    return res.status(500).json({
      error: 'Failed to extract stream URL',
      fallback: true // Signal to use iframe fallback
    });
  }
}
