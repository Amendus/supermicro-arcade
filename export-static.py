#!/usr/bin/env python3
"""Snapshot the live Arcade host into a static tree for foxhaven.ai/supermicro.

The host must already be running at http://127.0.0.1:8816.
Output is this script's directory: index.html + assets/.

Usage:
  python3 export-static.py
"""
import os
import re
import urllib.request

ORIGIN = os.environ.get('ARCADE_ORIGIN', 'http://127.0.0.1:8816')
PREFIX = '/supermicro'
OUT = os.path.dirname(os.path.abspath(__file__))
TEXT_EXT = {'.html', '.js', '.css', '.json', '.svg', '.txt', '.map'}

def fetch(path):
    req = urllib.request.Request(ORIGIN + path, headers={'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read(), res.headers.get('Content-Type', '')

def refs_in(text):
    found = set(re.findall(r'/assets/embedded/[A-Za-z0-9._-]+', text))
    found.update(re.findall(r'(?:src|href)=["\'](/[^"\']+)["\']', text))
    return {r.split('?')[0] for r in found if r.startswith('/assets/')}

def rewrite(text):
    text = text.replace('"/assets/', '"/supermicro/assets/')
    text = text.replace("'/assets/", "'/supermicro/assets/")
    text = text.replace('(/assets/', '(/supermicro/assets/')
    text = text.replace('=/assets/', '=/supermicro/assets/')
    return text

def main():
    os.makedirs(os.path.join(OUT, 'assets', 'embedded'), exist_ok=True)
    html, _ = fetch('/')
    text = html.decode('utf-8', 'replace')
    queue = sorted(refs_in(text))
    seen = set()
    while queue:
        path = queue.pop(0)
        if path in seen or not path.startswith('/assets/'):
            continue
        seen.add(path)
        try:
            body, ctype = fetch(path)
        except Exception as exc:
            print('MISS', path, exc)
            continue
        dest = os.path.join(OUT, path.lstrip('/'))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        ext = os.path.splitext(path)[1].lower()
        if ext in TEXT_EXT or 'javascript' in ctype or 'text/' in ctype or 'json' in ctype:
            decoded = body.decode('utf-8', 'replace')
            for extra in refs_in(decoded):
                if extra not in seen:
                    queue.append(extra)
            body = rewrite(decoded).encode('utf-8')
        with open(dest, 'wb') as fh:
            fh.write(body)
        print('ok', path, len(body))
    index = rewrite(text)
    if '<base ' not in index:
        index = index.replace('<head>', '<head>\n<base href="/supermicro/">', 1)
    with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8') as fh:
        fh.write(index)
    print('index', len(index), 'assets', len(seen))

if __name__ == '__main__':
    main()
