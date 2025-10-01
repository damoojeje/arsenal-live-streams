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
                if debug:
                    print("DEBUG: PLAYER 2 not found", file=sys.stderr)
                return None

            # Handle relative URLs properly
            player2_url = player2_match[0]
            if not player2_url.startswith('http'):
                url2 = base_url + player2_url
            else:
                url2 = player2_url

            if debug:
                print(f"DEBUG: PLAYER 2 URL: {url2}", file=sys.stderr)

            response = requests.get(url2, headers=headers, timeout=10)
            html = response.text

            if debug:
                print(f"DEBUG: PLAYER 2 HTML length: {len(html)}", file=sys.stderr)

            # Step 6: Find nested iframe
            iframe_match = re.search(r'iframe src="([^"]*)', html)
            if not iframe_match:
                if debug:
                    print("DEBUG: Nested iframe not found", file=sys.stderr)
                return None

            url2 = iframe_match.group(1)
            if debug:
                print(f"DEBUG: Nested iframe URL: {url2}", file=sys.stderr)

            response = requests.get(url2, headers=headers, timeout=10)
            html = response.text

            if debug:
                print(f"DEBUG: Final embed HTML length: {len(html)}", file=sys.stderr)

        # Step 7: Extract JavaScript variables
        # Extract CHANNEL_KEY
        ck_match = re.search(r'const\s+CHANNEL_KEY\s*=\s*"([^"]+)"', html)
        if not ck_match:
            if debug:
                print("DEBUG: CHANNEL_KEY not found", file=sys.stderr)
            return None
        channel_key = ck_match.group(1)
        if debug:
            print(f"DEBUG: CHANNEL_KEY: {channel_key}", file=sys.stderr)

        # Extract bundle (try multiple variable names - they change it frequently)
        bundle_match = re.search(r'const\s+(XJZ|XKZK|xjz|xkzk)\s*=\s*"([^"]+)"', html)
        if not bundle_match:
            if debug:
                print("DEBUG: Bundle variable not found (tried XJZ, XKZK)", file=sys.stderr)
            return None
        bundle_name = bundle_match.group(1)
        bundle = bundle_match.group(2)
        if debug:
            print(f"DEBUG: Bundle found as '{bundle_name}' (length: {len(bundle)})", file=sys.stderr)

        # Decode bundle (nested base64)
        parts = json.loads(base64.b64decode(bundle).decode('utf-8'))
        decoded_parts = {}
        for k, v in parts.items():
            try:
                decoded_parts[k] = base64.b64decode(v).decode('utf-8')
            except:
                decoded_parts[k] = v  # Some values might not be base64

        if debug:
            print(f"DEBUG: Decoded bundle keys: {list(decoded_parts.keys())}", file=sys.stderr)

        # Get host from bundle (newer method) or from host array (older method)
        if 'b_host' in decoded_parts:
            host = decoded_parts['b_host']
            if debug:
                print(f"DEBUG: Host from bundle: {host}", file=sys.stderr)
        else:
            # Extract host array (fallback to older method)
            host_match = re.search(r'host\s*=\s*\[([^\]]+)\]', html)
            if not host_match:
                if debug:
                    print("DEBUG: Host not found", file=sys.stderr)
                return None
            host_parts = [part.strip().strip('"\'') for part in host_match.group(1).split(',')]
            host = ''.join(host_parts)
            if debug:
                print(f"DEBUG: Host from array: {host}", file=sys.stderr)

        # Step 8: Get script path (newer method) or XOR decode (older method)
        if 'b_script' in decoded_parts:
            script_path = decoded_parts['b_script']
            if debug:
                print(f"DEBUG: Script path: {script_path}", file=sys.stderr)
        else:
            # Fallback to XOR decode
            bx = [40, 60, 61, 33, 103, 57, 33, 57]
            script_path = ''.join(chr(b ^ 73) for b in bx)
            if debug:
                print(f"DEBUG: XOR decoded script path: {script_path}", file=sys.stderr)

        # Build authentication URL
        auth_url = (
            f'{host}{script_path}?channel_id={channel_key}&'
            f'ts={decoded_parts.get("b_ts", "")}&'
            f'rnd={decoded_parts.get("b_rnd", "")}&'
            f'sig={decoded_parts.get("b_sig", "")}'
        )

        if debug:
            print(f"DEBUG: Auth URL: {auth_url}", file=sys.stderr)

        # Step 9: Call auth endpoint
        auth_response = requests.get(auth_url, headers=headers, timeout=10)
        if debug:
            print(f"DEBUG: Auth response status: {auth_response.status_code}", file=sys.stderr)

        # Step 10: Get server assignment
        server_lookup_match = re.findall(r'fetchWithRetry\(\s*\'([^\']*)', html)
        if not server_lookup_match:
            if debug:
                print("DEBUG: fetchWithRetry not found, trying direct lookup", file=sys.stderr)
            # Try alternate pattern
            server_lookup_match = re.findall(r'fetch\(\s*[\'"]([^\'"]*/api/[^\'\"]*)', html)

        if not server_lookup_match:
            if debug:
                print("DEBUG: Server lookup endpoint not found", file=sys.stderr)
            return None

        server_lookup = server_lookup_match[0]
        host_raw = host.split('//')[1] if '//' in host else host
        host_raw = 'https://' + host_raw.split('/')[0]

        server_lookup_url = f"{host_raw}{server_lookup}{channel_key}"

        # Use proper headers with the CDN domain
        cdn_headers = {
            'User-Agent': UA,
            'Referer': 'https://jxoxkplay.xyz/',
            'Origin': 'https://jxoxkplay.xyz'
        }

        if debug:
            print(f"DEBUG: Server lookup URL: {server_lookup_url}", file=sys.stderr)

        server_response = requests.get(server_lookup_url, headers=cdn_headers, timeout=10)
        if debug:
            print(f"DEBUG: Server response status: {server_response.status_code}", file=sys.stderr)
            print(f"DEBUG: Server response: {server_response.text[:200]}", file=sys.stderr)

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
