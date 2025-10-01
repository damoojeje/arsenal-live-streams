#!/usr/bin/env python3
"""
DaddyLive Stream Extractor
Based on plugin.video.daddylive addon.py (team-crew)
Extracts direct m3u8 URLs from DaddyLive channel IDs
"""

import sys
import re
import json
import base64
import requests
from typing import Optional, Dict

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def resolve_active_baseurl(seed: str = 'https://daddylive.sx/') -> str:
    """Follow redirects to get active DaddyLive domain"""
    try:
        resp = requests.get(seed, headers={'User-Agent': UA}, allow_redirects=True, timeout=10)
        return resp.url.rstrip('/')
    except Exception as e:
        print(f"Error resolving base URL: {e}", file=sys.stderr)
        return 'https://daddylivestream.com'

def extract_stream_url(channel_id: str, debug: bool = False) -> Optional[Dict[str, str]]:
    """
    Extract direct m3u8 stream URL from DaddyLive channel ID

    Args:
        channel_id: DaddyLive channel ID (e.g., "36", "178")
        debug: Print debug information

    Returns:
        Dict with 'url' and 'headers' keys, or None if extraction fails
    """
    try:
        # Step 1: Get base URL
        base_url = resolve_active_baseurl()
        if debug:
            print(f"DEBUG: Base URL: {base_url}", file=sys.stderr)

        # Step 2: Construct stream page URL
        stream_page_url = f'{base_url}/stream/stream-{channel_id}.php'

        headers = {
            'User-Agent': UA,
            'Referer': base_url + '/',
            'Origin': base_url
        }

        # Step 3: Fetch stream page HTML
        if debug:
            print(f"DEBUG: Fetching {stream_page_url}", file=sys.stderr)
        response = requests.get(stream_page_url, headers=headers, timeout=10)
        html = response.text
        if debug:
            print(f"DEBUG: Got {len(html)} bytes of HTML", file=sys.stderr)

        # Step 4: Check if wikisport stream (3 levels deep)
        if 'wikisport.best' in html:
            for _ in range(3):
                iframes = re.findall(r'iframe src="([^"]*)', html)
                if not iframes:
                    return None
                url2 = iframes[0]
                response = requests.get(url2, headers=headers, timeout=10)
                html = response.text
        else:
            # Step 5: Find PLAYER 2 iframe
            player2_match = re.findall(r'data-url="([^"]+)"\s+title="PLAYER 2"', html)
            if not player2_match:
                return None

            # Handle relative URLs properly
            player2_url = player2_match[0]
            if not player2_url.startswith('http'):
                url2 = base_url + player2_url
            else:
                url2 = player2_url
            response = requests.get(url2, headers=headers, timeout=10)
            html = response.text

            # Step 6: Find nested iframe
            iframe_match = re.search(r'iframe src="([^"]*)', html)
            if not iframe_match:
                return None

            url2 = iframe_match.group(1)
            response = requests.get(url2, headers=headers, timeout=10)
            html = response.text

        # Step 7: Extract JavaScript variables
        # Extract CHANNEL_KEY
        ck_match = re.search(r'const\s+CHANNEL_KEY\s*=\s*"([^"]+)"', html)
        if not ck_match:
            return None
        channel_key = ck_match.group(1)

        # Extract XJZ bundle
        bundle_match = re.search(r'const\s+XJZ\s*=\s*"([^"]+)"', html)
        if not bundle_match:
            return None
        bundle = bundle_match.group(1)

        # Decode bundle (nested base64)
        parts = json.loads(base64.b64decode(bundle).decode('utf-8'))
        decoded_parts = {}
        for k, v in parts.items():
            decoded_parts[k] = base64.b64decode(v).decode('utf-8')

        # Extract host array
        host_match = re.search(r'host\s*=\s*\[([^\]]+)\]', html)
        if not host_match:
            return None

        host_parts = [part.strip().strip('"\'') for part in host_match.group(1).split(',')]
        host = ''.join(host_parts)

        # Step 8: XOR decode secret path
        bx = [40, 60, 61, 33, 103, 57, 33, 57]
        sc = ''.join(chr(b ^ 73) for b in bx)

        # Build authentication URL
        auth_url = (
            f'{host}{sc}?channel_id={channel_key}&'
            f'ts={decoded_parts.get("b_ts", "")}&'
            f'rnd={decoded_parts.get("b_rnd", "")}&'
            f'sig={decoded_parts.get("b_sig", "")}'
        )

        # Step 9: Call auth endpoint
        requests.get(auth_url, headers=headers, timeout=10)

        # Step 10: Get server assignment
        server_lookup_match = re.findall(r'fetchWithRetry\(\s*\'([^\']*)', html)
        if not server_lookup_match:
            return None

        server_lookup = server_lookup_match[0]
        host_raw = host.split('//')[1] if '//' in host else host
        host_raw = 'https://' + host_raw.split('/')[0]

        server_lookup_url = f"{host_raw}{server_lookup}{channel_key}"
        server_response = requests.get(server_lookup_url, headers=headers, timeout=10)
        server_data = server_response.json()
        server_key = server_data.get('server_key', '')

        # Step 11: Build final m3u8 URL
        if server_key == 'top1/cdn':
            m3u8_url = f"https://top1.newkso.ru/top1/cdn/{channel_key}/mono.m3u8"
        else:
            m3u8_url = f"https://{server_key}new.newkso.ru/{server_key}/{channel_key}/mono.m3u8"

        # Return URL with required headers
        return {
            'url': m3u8_url,
            'headers': {
                'Referer': host_raw + '/',
                'Origin': host_raw,
                'User-Agent': UA,
                'Connection': 'Keep-Alive'
            }
        }

    except Exception as e:
        print(f"Error extracting stream: {e}", file=sys.stderr)
        return None

def main():
    """CLI entry point"""
    if len(sys.argv) < 2:
        print("Usage: python3 extract_stream.py <channel_id> [--debug]", file=sys.stderr)
        sys.exit(1)

    channel_id = sys.argv[1]
    debug = '--debug' in sys.argv
    result = extract_stream_url(channel_id, debug=debug)

    if result:
        print(json.dumps(result))
        sys.exit(0)
    else:
        print(json.dumps({'error': 'Failed to extract stream'}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
