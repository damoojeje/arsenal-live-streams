import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface StreamData {
  url: string;
  headers?: Record<string, string>;
  quality?: string;
  provider?: string;
  error?: string;
  fallback?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StreamData>
) {
  const { provider = 'daddylive', channelId } = req.query;

  if (!channelId || typeof channelId !== 'string') {
    return res.status(400).json({
      url: '',
      error: 'Channel ID is required'
    });
  }

  try {
    // Path to Python virtual environment and script
    const projectRoot = path.join(process.cwd());
    const venvPython = path.join(projectRoot, 'venv', 'bin', 'python3');
    const resolverScript = path.join(projectRoot, 'python', 'stream_resolver.py');

    // Execute Python stream resolver
    const { stdout, stderr } = await execAsync(
      `${venvPython} ${resolverScript} ${provider} ${channelId}`,
      {
        timeout: 15000, // 15 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      }
    );

    if (stderr) {
      console.error('Stream resolver stderr:', stderr);
    }

    // Parse JSON response from Python script
    const result: StreamData = JSON.parse(stdout.trim());

    // If resolution failed, return fallback iframe URL
    if (result.error) {
      return res.status(200).json({
        url: '',
        error: result.error,
        fallback: result.fallback || `https://dlhd.dad/stream/stream-${channelId}.php`
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error resolving stream:', error);

    // Return fallback on error
    return res.status(200).json({
      url: '',
      error: error instanceof Error ? error.message : 'Stream resolution failed',
      fallback: `https://dlhd.dad/stream/stream-${channelId}.php`
    });
  }
}
