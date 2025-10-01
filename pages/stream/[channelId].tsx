import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

/**
 * Stream Page - Redirects to DaddyLive stream
 * Channel IDs from DaddyLive API are resolved to their stream pages
 */

export default function StreamPage() {
  const router = useRouter();
  const { channelId } = router.query;
  const [error, setError] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loadingEmbed, setLoadingEmbed] = useState(true);

  useEffect(() => {
    if (!channelId) return;

    // Redirect to our clean player page (no ads!)
    // The player page embeds the DaddyLive iframe directly
    router.push(`/player/${channelId}`);
  }, [channelId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-arsenalRed via-red-600 to-red-800 flex items-center justify-center">
      <Head>
        <title>Loading Stream - Arsenal Streams</title>
        <meta name="description" content="Redirecting to stream" />
      </Head>

      <div className="text-center">
        <div className="mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto"></div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Loading Stream...
        </h1>

        <p className="text-white text-lg opacity-90">
          Redirecting to DaddyLive stream page
        </p>

        {error && (
          <div className="mt-6 bg-white bg-opacity-20 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-white">{error}</p>
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-block bg-white text-arsenalRed px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            ← Back to Matches
          </Link>
        </div>
      </div>
    </div>
  );
}