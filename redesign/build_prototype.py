"""Cairn site redesign: build the single-file IA prototype from the real Cairn repo.

python3 -I build_prototype.py [options]   (--help lists them)
Sparse-clones yochaigal/cairn (Markdown + 4 Alegreya fonts only) into DIR if it isn't there, parses the 2e rules,
resources, adventures and all monsters, and writes prototype.html next to this script from prototype_template.html.
The Adventures catalog also reads yochaigal/scrivener (its posts/ only), cloned into .scrivener-src (--refresh re-clones it).
The newest New School Revolution post is cached in cache/blog.json; --blog-feed FILE updates it from the blog's Atom
feed saved from a browser (scripts get a bot-check 404 there, so the build never fetches it).
The Core Rules translations are found and downloaded into cache/l10n/ by --refresh (which also re-clones the repo) or
--translations (which uses the checkout as it is); a plain build only reads that cache. --parity compares every page
with the page the live site (and each language site) serves, and lists the ones that differ.
The checkout is data: it is read, never executed.
"""
import argparse, base64, concurrent.futures, datetime, hashlib, html, json, os, re, shutil, subprocess, sys, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, 'prototype_template.html')
OUT = os.path.join(HERE, 'prototype.html')
REPO = 'https://github.com/yochaigal/cairn.git'
SITE = 'https://cairnrpg.com'
GITHUB_BLOB = 'https://github.com/yochaigal/cairn/blob/main/'
FONTS = [('400', 'normal', 'Alegreya-Regular.woff2'), ('700', 'normal', 'Alegreya-Bold.woff2'),
         ('400', 'italic', 'Alegreya-Italic.woff2'), ('700', 'italic', 'Alegreya-BoldItalic.woff2')]
HERO = os.path.join(HERE, 'assets', 'players-guide-cover.jpg')  # Player's Guide cover (cairnpress.itch.io), cropped above its title
LOGO = '/img/logo.svg'  # the site's logo (_config.yml `logo:`)
# its canvas has wide empty margins: the artwork's bounding box plus 4% of its height on each side, measured with
# getBBox() in a browser, for the shapes with this fingerprint. The header's translateY is measured for it too.
LOGO_VIEWBOX, LOGO_SHAPES = '26.0 14.9 449.4 310.6', '7978134719639e08'
# Expected counts, checked against the repo on every build
EXPECT = {'monsters': 145, 'pg': 6, 'wg': 23, 'bg': 20, 'adv_first-party': 5, 'adv_originals': 57, 'adv_conversions': 62}
# Copy with no source in the repo today. Each line is a proposed `summary:` front matter value for the page named
# by its key; the prototype shows these as drafts. Everything else on the page comes from the author's own files.
PROPOSED = {
    'resources.md': 'Monsters, adventures, tools and tables for running Cairn.',
    'resources/monsters.md': 'Stat blocks for monsters and NPCs, ready to drop into an adventure.',
    'adventures.md': 'First-party adventures, community originals, and conversions from other games.',
    'second-edition/backgrounds.md': 'Each background comes with its own tables for names, gear and details.',
    'hacks.md': 'Optional rules and variants: classes, loadouts, funnels, magic and more.',
    'localization.md': 'Cairn translated by the community, with a guide to adding your own.',
}
# Images inlined in place of their placeholders: the character sheet previews (Player's Guide itch.io gallery) and the
# Start steps' art (the Player's Guide section openers; Overview has none, so it uses the Procedures opener)
IMAGES = {'__SHEET_LANDSCAPE__': 'character-sheet-landscape.jpg', '__SHEET_PORTRAIT__': 'character-sheet-portrait.jpg',
          # all three steps are layered so figures can move: the art with them painted out, and each figure on its own
          '__STEP_OVERVIEW__': 'step-procedures-base.jpg', '__LINEN__': 'backlit-linen.jpg', '__STEP_BIRD__': 'step-procedures-bird.png', '__STEP_ARM__': 'step-procedures-arm.png',
          '__STEP_CHARGEN__': 'step-character-creation-base.jpg', '__STEP_HORSE__': 'step-character-creation-horse.png', '__STEP_CORE__': 'step-rules-base.jpg', '__STEP_SWORD_L__': 'step-rules-left.png', '__STEP_SWORD_R__': 'step-rules-right.png'}
# The newest post on Yochai's blog. Its feed (/feed/, Atom) answers scripts with a Cloudflare 404 and sends no CORS
# headers, so it's saved from a browser and passed with --blog-feed; the build keeps the post in cache/blog.json.
BLOG = {'site': 'https://newschoolrevolution.com/', 'name': 'New School Revolution'}
BLOG_CACHE = os.path.join(HERE, 'cache', 'blog.json')


def die(msg):
    sys.exit('build_prototype: ' + msg)


def sparse_clone(repo, dst, paths):
    """A shallow clone of repo's paths into dst. It clones beside dst first, so a failed clone keeps what's there."""
    dst = os.path.normpath(dst)  # 'foo/' would put the clone inside foo
    tmp = dst + '.tmp'
    shutil.rmtree(tmp, ignore_errors=True)
    run = lambda *a: subprocess.run(['git', *a], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    try:
        run('clone', '-q', '--depth', '1', '--filter=blob:none', '--no-checkout', repo, tmp)
        run('-C', tmp, 'sparse-checkout', 'set', '--no-cone', *paths)
        run('-C', tmp, 'checkout', '-q', 'main')
    except (OSError, subprocess.CalledProcessError) as e:
        shutil.rmtree(tmp, ignore_errors=True)
        raise OSError(getattr(e, 'stderr', b'').decode().strip() or str(e)) from e
    shutil.rmtree(dst, ignore_errors=True)
    os.replace(tmp, dst)


def fetch(src, refresh):
    if os.path.isdir(os.path.join(src, '.git')) and not refresh:
        return
    if os.path.isdir(src) and os.listdir(src) and not os.path.isdir(os.path.join(src, '.git')):
        die('%s exists and is not a checkout; pass an empty --src folder' % src)
    try:
        sparse_clone(REPO, src, ['*.md', LOGO, *['/fonts/static/' + f for _, _, f in FONTS], *IMAGE_ALT])
    except OSError as e:
        die('could not clone %s (%s)' % (REPO, e))


def curl(url, out=None):
    # curl, not urllib: this Python has no CA certificates. Its own default user agent; nothing to get past bot checks.
    r = subprocess.run(['curl', '-sSfL', '--max-time', '30', url, *(['-o', out] if out else [])], capture_output=True)
    if r.returncode:
        raise OSError(r.stderr.decode().strip() or 'curl exited %d' % r.returncode)
    return r.stdout


# ---------- the Adventures catalog: Yochai's Scrivener (a Gorlab card catalog) merged with the Cairn repo's own lists
# Scrivener keeps one Markdown file per adventure in posts/ (front matter only: name, author, source-url, cover-image,
# summary, cost, tags). The build reads it from a shallow clone; covers stay hotlinked from itch.io, as Scrivener does.
SCRIV_REPO = 'https://github.com/yochaigal/scrivener.git'
SCRIV_SRC = os.path.join(HERE, '.scrivener-src')
FEATURED = []  # entry ids for the home page's row; empty: the first-party adventures readable in the prototype
GROUP_LABEL = {'first-party': 'First Party', 'originals': 'Originals', 'conversions': 'Conversions'}


def fetch_scrivener(dst, refresh):
    """Clone Scrivener's posts into dst, or re-clone with --refresh."""
    if os.path.isdir(os.path.join(dst, '.git')) and not refresh:
        return
    try:
        sparse_clone(SCRIV_REPO, dst, ['/posts/'])
    except OSError as e:
        print('adventures: could not clone Scrivener (%s)%s' % (e, '; using the previous checkout' if os.path.isdir(dst) else ''), file=sys.stderr)


def front_matter(text):
    """The YAML front matter Gorlab posts use: scalars (plain or quoted), `- item` lists, and `|` / `>` blocks.
    Front matter with no closing --- runs to the end of the file. None if the file doesn't open with ---."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != '---':
        return None
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == '---'), len(lines))
    out, key, i = {}, None, 1
    unq = lambda v: v[1:-1] if len(v) > 1 and v[0] == v[-1] and v[0] in '"\'' else v
    while i < end:
        line = lines[i]
        m = re.match(r'([A-Za-z][\w-]*):\s*(.*?)\s*$', line)
        if m:
            key, v = m.group(1), m.group(2)
            if v in ('|', '>', '|-', '>-'):
                block, i = [], i + 1
                while i < end and (not lines[i].strip() or lines[i].startswith((' ', '\t'))):
                    block.append(lines[i].strip()); i += 1
                paras = [' '.join(p.split()) if v[0] == '>' else p for p in re.split(r'\n\s*\n', '\n'.join(block).strip())]
                out[key] = '\n\n'.join(p for p in paras if p)
                continue
            out[key] = unq(v) if v else []
        elif re.match(r'\s*- ', line) and key and isinstance(out.get(key), list):
            out[key].append(unq(line.strip()[2:].strip()))
        i += 1
    return out


def as_list(v):
    """A front matter value that may be one scalar or a list, as a list."""
    return v if isinstance(v, list) else [v] if v else []


def scrivener_posts(dst):
    """Every post filed under `adventures`, as front matter dicts, wherever it sits in posts/."""
    out = []
    for root, _, files in os.walk(os.path.join(dst, 'posts')):
        for f in sorted(files):
            if not f.endswith('.md'):
                continue
            p = os.path.join(root, f)
            try:
                fm = front_matter(open(p, encoding='utf-8').read())
            except (OSError, UnicodeDecodeError) as e:
                print('adventures: %s unreadable (%s)' % (f, e), file=sys.stderr); continue
            if fm is None or not fm.get('name'):
                print('adventures: %s skipped: no front matter or no name' % f, file=sys.stderr); continue
            if 'adventures' in as_list(fm.get('category')):
                out.append(dict(fm, file=f))
    return out


def norm_name(s):
    s = plain(s).lower().replace('&', 'and')
    s = re.sub(r'^cas-\d+:\s*', '', s)
    s = re.sub(r'\((?:cairn|2e)[^)]*\)|\bfor cairn\b|\bcairn edition\b', '', s)
    return re.sub(r'[^a-z0-9]+', '', s)


def credit(text):
    """A conversion's credit: the first line that links out, as (author, url, the line in plain text)."""
    body = split_fm(text)[1]
    line = next((l for l in body.splitlines() if re.search(r'\]\(https?://', l)), '')
    url = re.search(r'\]\((https?://[^)\s]+)\)', line)
    text = re.sub(r'\s+', ' ', plain(re.sub(r'^\s*-\s*', '', line)))
    by = re.search(r'\bby\s+(.+)', text)
    author = None
    if by:
        # a name ends at a full stop (not an initial's, as in Gus L./Ratking), a comma, or where the sentence moves on
        author = re.split(r'(?<![\s/][A-Z])\.(?:\s|$)|[,!]|\s+(?:by|and published|written for|for|in|Updated|Posted)\s', by.group(1))[0].strip()
        author = re.sub(r'(?<=[a-z]{2})\.$', '', author)
    return author or None, url.group(1) if url else None, text


def summary_paras(s, name, dupes):
    """Scrivener's summary with any repeated paragraph dropped (noted, to pass on)."""
    out = []
    for p in (s or '').split('\n\n'):
        p = ' '.join(p.split())
        if p and p in out:
            dupes.append(name)
        elif p:
            out.append(p)
    return out


def repo_adventures(src):
    """The Cairn repo's adventure pages, one entry per file, with what each page says about itself."""
    repo = []
    for g in GROUP_LABEL:
        folder = 'adventures/' + g
        for f in md_files(src, folder):
            rel = folder + '/' + f
            text = read(src, rel)
            fm = split_fm(text)[0]
            e = {'name': plain(fm.get('title') or f[:-3]), 'group': g, 'rel': rel, 'page': ROUTES.get(rel), 'url': fm.get('redirect_to')}
            if g == 'conversions':
                e['author'], e['url'], e['credit'] = credit(text)
            elif e['page']:  # a module Scrivener doesn't list yet (CAS-4): its byline and cover from the page itself
                body = split_fm(text)[1]
                by = re.search(r'^An adventure module for .*? by (.+?)\s*$', body, re.M | re.I)
                img = re.search(r'!\[[^\]]*\]\(([^)\s]+)\)', body)
                e['author'] = by.group(1) if by else None
                e['cover'] = urllib.parse.urljoin(SITE + '/', img.group(1)) if img else None
            repo.append(e)
    return repo


def adventures(src, posts):
    """The catalog: every adventure in the Cairn repo and in Scrivener, one entry each, matched by name."""
    by_norm = {}
    for e in repo_adventures(src):
        by_norm.setdefault(norm_name(e['name']), []).append(e)
    out, matched, extras, dupes = [], [], [], []
    for p in posts:
        hit = by_norm.get(norm_name(p['name']), [])
        r = hit.pop(0) if hit else None
        tags = [t for t in as_list(p.get('tags')) if t != 'first-party']
        tags += [g.lower() for g in as_list(p.get('genre')) if g.lower() not in tags]
        group = 'first-party' if 'first-party' in as_list(p.get('tags')) else (r['group'] if r else 'originals')
        cost = p['cost'] if isinstance(p.get('cost'), str) and p['cost'] else None
        out.append({'name': plain(p['name']), 'group': group, 'author': p.get('author') or (r or {}).get('author'),
                    'url': p.get('source-url') or (r or {}).get('url'), 'cover': p.get('cover-image') or None,
                    'summary': summary_paras(p.get('summary'), p['name'], dupes), 'cost': cost, 'tags': tags,
                    'page': (r or {}).get('page'), 'rel': (r or {}).get('rel')})
        (matched if r else extras).append(p['name'])
    repo_only, have = [], {norm_name(e['name']) for e in out}
    for e in (e for es in by_norm.values() for e in es):
        if norm_name(e['name']) in have:  # listed twice in the repo (CAS-2 is also under Originals): one entry
            print('adventures: %s is also listed under %s; shown once' % (e['name'], GROUP_LABEL[e['group']]), file=sys.stderr)
        else:
            repo_only.append(e)
    for e in repo_only:
        out.append({'name': e['name'], 'group': e['group'], 'author': e.get('author'), 'url': e['url'], 'cover': e.get('cover'),
                    'summary': [e['credit']] if e.get('credit') else [], 'cost': None, 'tags': [], 'page': e['page'], 'rel': e['rel']})
    seen = {}
    for e in sorted(out, key=lambda e: (e['name'].lower(), e['group'])):
        base = 'adv-' + (slug(e['name']) or 'adventure')
        n = seen.get(base, 0); seen[base] = n + 1
        e['id'] = base if not n else '%s-%d' % (base, n + 1)
    adventure_report(posts, out, matched, extras, repo_only, dupes)
    for e in out:
        e.pop('rel', None)
    return sorted(out, key=lambda e: e['name'].lower())


def adventure_report(posts, out, matched, extras, repo_only, dupes):
    """What the build tells the maintainer about the catalog: counts, entries only one side has, and data to fix."""
    names = {}
    for e in out:
        names.setdefault((e['group'], norm_name(e['name'])), []).append(e['name'])
    by_group = {g: sum(e['group'] == g for e in out) for g in GROUP_LABEL}
    print('adventures: %d Scrivener entries, %d matched a Cairn repo page, %d added; %s' % (
        len(posts), len(matched), len(extras), ', '.join('%d %s' % (n, g) for g, n in by_group.items())), file=sys.stderr)
    for e in repo_only:
        if e['group'] != 'conversions':
            print('adventures: not in Scrivener: %s (%s)' % (e['name'], e['group']), file=sys.stderr)
    if extras:
        print('adventures: only in Scrivener: %s' % '; '.join(sorted(extras)), file=sys.stderr)
    for k, v in names.items():
        if len(v) > 1:
            print('adventures: %s listed %d times: %s' % (GROUP_LABEL[k[0]], len(v), ' / '.join(v)), file=sys.stderr)
    for n in sorted(set(dupes)):
        print('adventures: Scrivener summary repeats a paragraph: %s' % n, file=sys.stderr)
    nameless = [e['name'] for e in out if e['group'] == 'conversions' and not e['author']]
    if nameless:
        print('adventures: %d conversions credit no author by name: %s' % (len(nameless), '; '.join(nameless)), file=sys.stderr)


def featured(advs):
    by_id = {e['id']: e for e in advs}
    picks = [by_id[i] for i in FEATURED if i in by_id] or [e for e in advs if e['group'] == 'first-party' and e['page']]
    return [e['id'] for e in picks[:4]]


def blog(feed):
    """The newest blog post as {title, url, excerpt, fetched}, or None when there's no cache yet."""
    if feed:
        import xml.etree.ElementTree as ET
        from html.parser import HTMLParser
        A = '{http://www.w3.org/2005/Atom}'

        class Paras(HTMLParser):  # the text of each <p>, tags dropped and entities decoded
            def __init__(self):
                super().__init__(convert_charrefs=True); self.paras, self.cur = [], None
            def handle_starttag(self, tag, attrs):
                if tag == 'p': self.cur = []
            def handle_endtag(self, tag):
                if tag == 'p' and self.cur is not None: self.paras.append(' '.join(''.join(self.cur).split())); self.cur = None
            def handle_data(self, data):
                if self.cur is not None: self.cur.append(data)
        try:
            root = ET.parse(feed).getroot()
            if root.tag != A + 'feed':
                raise ValueError('not an Atom feed (root is <%s>); save /feed/ itself, not the blog page' % root.tag)
            entry = root.find(A + 'entry')
            if entry is None:
                raise ValueError('the feed has no entries')
            title = ' '.join((entry.findtext(A + 'title') or '').split())
            url = next(l.get('href') for l in entry.findall(A + 'link') if l.get('rel') in (None, 'alternate'))
            content = entry.find(A + 'content')
            if content is None or content.get('type') != 'html':
                raise ValueError('expected the post as escaped HTML (<content type="html">)')
            p = Paras(); p.feed(content.text or ''); p.close()
            first = next(x for x in p.paras if x)
        except ET.ParseError as e:
            die('--blog-feed %s: not XML (%s); save the feed (%sfeed/) itself, not the blog page' % (feed, e, BLOG['site']))
        except (OSError, ValueError, StopIteration) as e:
            die('--blog-feed %s: %s' % (feed, str(e) or 'no link or paragraph in the newest entry'))
        if not title or not (url or '').startswith(BLOG['site']):
            die('--blog-feed %s: the newest entry has no title, or links outside %s (%r)' % (feed, BLOG['site'], url))
        # up to the last sentence end within 220 characters; failing that, a word boundary and an ellipsis
        cut = first
        if len(first) > 220:
            ends = [m.end() for m in re.finditer(r'[.!?][)"\u201d\u2019]?(?=\s)', first[:221])]
            cut = first[:ends[-1]] if ends else first[:220].rsplit(' ', 1)[0] + '\u2026'
        post = {'title': title, 'url': url, 'excerpt': cut, 'fetched': datetime.date.today().isoformat()}
        os.makedirs(os.path.dirname(BLOG_CACHE), exist_ok=True)
        json.dump(post, open(BLOG_CACHE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('blog: cached "%s"' % title)
    if not os.path.isfile(BLOG_CACHE):
        print('build_prototype: no blog post cached; the home page leaves the section out (pass --blog-feed)', file=sys.stderr)
        return None
    post = json.load(open(BLOG_CACHE, encoding='utf-8'))
    age = (datetime.date.today() - datetime.date.fromisoformat(post['fetched'])).days
    if age > 30:
        print('build_prototype: the cached blog post is %d days old; save %sfeed/ from a browser and pass --blog-feed' % (age, BLOG['site']), file=sys.stderr)
    return {**post, 'site': BLOG['site'], 'name': BLOG['name']}


def read(src, rel):
    p = os.path.join(src, rel)
    if not os.path.isfile(p):
        die('missing %s in the Cairn repo' % rel)
    return open(p, encoding='utf-8').read()


def md_files(src, folder):
    return sorted(f for f in os.listdir(os.path.join(src, folder)) if f.endswith('.md'))


def split_fm(text):
    m = re.match(r'---\n(.*?)\n---\n?(.*)', text, re.S)
    if not m:
        return {}, text
    fm = {}
    for line in m.group(1).splitlines():
        k, sep, v = line.partition(':')
        if sep:
            fm[k.strip()] = v.strip().strip('"\'')
    return fm, m.group(2)


def title_of(src, rel):
    fm, body = split_fm(read(src, rel))
    h = re.search(r'^# (.+)$', body, re.M)  # jekyll-titles-from-headings fallback
    return fm.get('title') or (h.group(1).strip() if h else os.path.basename(rel)[:-3])


def url_of(rel):
    """Site URL for a repo Markdown path (permalink: pretty)."""
    if rel == 'README.md':
        return SITE + '/'
    return SITE + '/' + rel[:-3] + '/'


def link(src, rel, label=None):
    title = title_of(src, rel)  # also dies if the page is missing
    # a page the prototype has opens in it; any other goes to cairnrpg.com
    return {'label': label or title, 'href': '#' + ROUTES[rel] if rel in ROUTES else url_of(rel), 'path': rel}


# ---------- small escaping Markdown converter (the blocks the Second Edition uses)
# Where links point while a page is converted (set per page by page_source()):
#   site     the site /links resolve on (cairnrpg.com, or a translation's own site)
#   page     this page's URL there, for relative links
#   anchors  this page's own heading anchors -> our ids; fallback: English's, for a mirror translation
#   paths    site path -> page id, for links that open another page in the prototype; others: that page's anchors
#   strict   keep only #, /, relative, http(s) and mailto links (text from someone else's repo)
#   hotlink  an image that isn't inlined shows from its own URL (adventure pages) rather than being left out
SOURCE = {'site': SITE, 'page': SITE + '/', 'anchors': {}, 'fallback': {}, 'paths': {}, 'others': {}, 'strict': False, 'hotlink': False, 'warn': []}
BR, ESC = '\x01', '\x02'  # a kramdown hard line break, and a backslash-escaped character, kept apart from the escaping
FENCES = []  # fenced code blocks, each replaced by a FENCE line while a page is split into sections (see md_sections)
FENCE = '\x03%d\x03'


def site_path(url):
    """A site URL's path without its trailing / or .md: /second-edition/players-guide/core-rules."""
    p = urllib.parse.urlparse(url).path
    p = re.sub(r'(/index)?(\.md|\.html)?/?$', '', p)
    return p or '/'


def find(anchors, a):
    """An anchor's id; a link whose case differs from the heading's anchor (#Yara-İzleri-Tablosu) still lands."""
    a = urllib.parse.unquote(a)
    return anchors.get(a) or anchors.get(a.lower()) or anchors.get(gfm_id(a.replace('-', ' ')).replace('--', '-')) if a else None


def resolve(href):
    """Where a link in the text goes: '#id' for this or another page in the prototype, or an absolute URL."""
    if href.startswith('#'):
        to = find(SOURCE['anchors'], href[1:]) or find(SOURCE['fallback'], href[1:])
        if not to:
            SOURCE['warn'].append('link to %s points at no heading' % href)
        return '#' + to if to else None
    url = urllib.parse.urljoin(SOURCE['page'], href) if not re.match(r'[a-z][a-z0-9+.-]*:', href, re.I) else href
    u = urllib.parse.urlparse(url)
    if u.scheme in ('http', 'https') and (u.hostname or '').lower() == host_of(SOURCE['site']):
        pid = SOURCE['paths'].get(site_path(url))
        if pid:
            if not u.fragment:
                return '#' + pid
            to = find(SOURCE['others'].get(pid, {}), u.fragment)
            if not to:
                SOURCE['warn'].append('link to %s#%s points at no heading; it opens the page' % (pid, u.fragment))
            return '#' + (to or pid)
    if SOURCE['strict'] and u.scheme not in ('http', 'https', 'mailto'):
        SOURCE['warn'].append('dropped a %s link' % (u.scheme or 'schemeless'))
        return None
    return url


def inline(s):
    s = re.sub(r'\\([\\`*_{}\[\]()#+\-.!|>])', lambda m: ESC + '%d;' % ord(m.group(1)), s)
    s = re.sub(r'\s*<br\s*/?>\s*', BR, s, flags=re.I).strip(BR)  # an HTML line break (table cells)
    s = re.sub(r'&(?:[a-zA-Z]+|#\d+);', lambda m: html.unescape(m.group(0)), s)  # named entities (&harr;) become the character
    s = html.escape(s, quote=True)
    def lnk(m):
        text, href = m.group(1), resolve(html.unescape(m.group(2)))
        return '<a href="%s">%s</a>' % (html.escape(href, quote=True), text) if href else text
    s = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', lnk, s)
    s = re.sub(r'\[([^\]]+)\]\(\s*\)', r'\1', s)  # an empty link: just its text
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em>\1</em>', s)
    s = re.sub(r'(?<![\w])_(?!\s)(.+?)(?<!\s)_(?![\w])', r'<em>\1</em>', s)
    return re.sub(ESC + r'(\d+);', r'&#\1;', s).replace(BR, '<br>')


def plain(s):
    s = re.sub(r'!?\[([^\]]*)\]\([^)]+\)', r'\1', s)
    return re.sub(r'\\(.)', r'\1', re.sub(r'[*_]', '', s)).strip()


def table_rows(lines):
    rows = [[c.strip() for c in l.strip().strip('|').split('|')] for l in lines]
    return [r for r in rows if not all(re.fullmatch(r':?-+:?', c) for c in r)]


LIST_ITEM = re.compile(r'^(\s*)([-*+]|\d+\.)\s+(.*)$')  # kramdown: 1. but not 1)
HR = re.compile(r'^\s{0,3}([*_-])(\s*\1){2,}\s*$')
IMAGE = re.compile(r'^\[?!\[([^\]]*)\]\(([^)]+?)(?:\s+"[^"]*")?\)(?:\{:[^}]*\})?(?:\]\(([^)\s]+)\))?$')
IMAGES_2E = {}  # each map's file name without its extension -> {src: data URI, w, h}, filled by images_2e()


def list_html(items):
    """Items (indent, tag, text) as nested lists: an item 2 or more spaces deeper than the one above nests in it."""
    out, stack = [], []
    for ind, tag, text in items:
        if stack and ind >= stack[-1][0] + 2:
            out.append('<%s><li>' % tag); stack.append((ind, tag))
        else:
            while len(stack) > 1 and ind < stack[-1][0]:
                out.append('</li></%s>' % stack.pop()[1])
            if stack and stack[-1][1] == tag:
                out.append('</li><li>')
            else:
                if stack:
                    out.append('</li></%s>' % stack.pop()[1])
                out.append('<%s><li>' % tag); stack.append((ind, tag))
        out.append(inline(text))
    out += ['</li></%s>' % t for _, t in reversed(stack)]
    return ''.join(out)


def figure(m):
    alt, src, href = m.group(1), m.group(2), m.group(3)
    # by file name, so a translation's own copy (zh links cairnrpg.com's, fi renamed one to .webp) finds it too
    stem = os.path.splitext(os.path.basename(urllib.parse.urlparse(src).path))[0]
    img = IMAGES_2E.get(stem)
    if not img and SOURCE['hotlink']:
        url = urllib.parse.urljoin(SOURCE['page'], urllib.parse.quote(src.strip(), safe='/:%?=&#~+'))
        alt = MODULE_IMAGE_ALT.get(src.strip(), alt)
        if src.strip() not in MODULE_IMAGE_ALT and (not alt.strip() or re.search(r'[a-z][A-Z]|[A-Za-z]\d|\bv\d|\(\d+\)', alt)):  # 'CAS1 Map v2', 'TegnyMapSpread', 'Rusal1'
            SOURCE['warn'].append('image %s has alt text %r, which reads like a file name: add it to MODULE_IMAGE_ALT' % (src.strip(), alt))
        tag ='<img class="hotlink" src="%s" alt="%s" loading="lazy" referrerpolicy="no-referrer">' % (html.escape(url, quote=True), html.escape(alt, quote=True))
        return '<figure><a href="%s">%s</a></figure>' % (html.escape(url, quote=True), tag)
    if not img:
        SOURCE['warn'].append('image %s is not inlined' % src)
        return ''
    # a translation keeps its own alt text if it describes the image; its "Click me!" placeholders get the English one
    en, lang = next((v for k, v in IMAGE_ALT.items() if os.path.splitext(os.path.basename(k))[0] == stem), None), ''
    if en and not SOURCE['strict']: alt = en
    elif en and len(alt) < 40: alt, lang = en, ' lang="en"'
    link_to = resolve(href) if href else None
    tag = '<img src="%s" alt="%s"%s width="%d" height="%d" loading="lazy">' % (img['src'], html.escape(alt, quote=True), lang, img['w'], img['h'])
    return '<figure>%s</figure>' % ('<a href="%s">%s</a>' % (html.escape(link_to, quote=True), tag) if link_to else tag)


def blocks(md, caption=None, hids=None, hlevel=4):
    """md as HTML. hids: the ids for its #### to ###### headings, in order. hlevel: the level #### renders at (one below
    the section's own, so a #### straight under a ## doesn't skip one); ##### renders one below that."""
    out, para, items, tbl, quote = [], [], [], [], []
    hids, gap = list(hids or []), False  # gap: a blank line since the last list item
    def joined(lines):
        return ''.join(l.rstrip() + (BR if re.search(r'\S {2,}$', l) and i < len(lines) - 1 else ' ') for i, l in enumerate(lines)).strip()
    def flush():
        if para:
            text = joined(para)
            m = IMAGE.match(text)
            out.append(figure(m) if m else '<p>%s</p>' % inline(text)); para.clear()
        if quote:
            out.append('<blockquote><p>%s</p></blockquote>' % inline(joined(quote))); quote.clear()
        if items:
            out.append(list_html([(i, t, joined(x)) for i, t, x in items])); items.clear()
        if tbl:
            rows = table_rows(tbl)
            # some translations open a table with an empty header row (their sideways Reactions and Scars tables): the
            # next row becomes the header, and no column is a row header, so no <th> is ever empty
            sideways = len(rows) > 1 and not any(plain(c) for c in rows[0])
            if sideways:
                rows = rows[1:]
            head = ''.join('<th scope="col">%s</th>' % inline(plain(c)) if plain(c) else '<td></td>' for c in rows[0])  # no empty <th>
            cell = lambda r: (''.join('<td>%s</td>' % inline(c) for c in r) if sideways else
                              ('<th scope="row">%s</th>' % inline(r[0]) if plain(r[0]) else '<td></td>') + ''.join('<td>%s</td>' % inline(c) for c in r[1:]))
            body = ''.join('<tr>%s</tr>' % cell(r) for r in rows[1:])
            cap = '<caption>%s</caption>' % html.escape(caption) if caption else ''
            out.append('<div class="table-wrap"><table>%s<thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (cap, head, body))
            tbl.clear()
    for line in md.splitlines():
        m = re.fullmatch(r'\x03(\d+)\x03', line.strip())
        if m:
            flush(); out.append('<pre class="fence"><code>%s</code></pre>' % html.escape(FENCES[int(m.group(1))])); continue
        m = re.match(r'(#{4,6}) (.+?)\s*$', line)
        if m:
            flush()
            hid, lvl = hids.pop(0) if hids else '', min(hlevel + len(m.group(1)) - 4, 6)
            out.append('<h%d%s>%s</h%d>' % (lvl, ' id="%s" tabindex="-1"' % hid if hid else '', inline(heading_title(m.group(2))[0]), lvl)); continue
        if HR.match(line):
            flush(); out.append('<hr>'); continue
        if re.match(r'\s*>', line):
            if para or items or tbl:
                flush()
            quote.append(re.sub(r'^\s*> ?', '', line)); continue
        if quote and line.strip():
            flush()
        if IMAGE.match(line.strip()):  # an image on its own line is its own block, even straight after a list item
            flush(); para.append(line.strip()); flush(); continue
        if line.strip().startswith('|'):
            if para or items:
                flush()
            tbl.append(line); continue
        if tbl:
            flush()
        m = LIST_ITEM.match(line)
        if m:
            if para:
                flush()
            items.append((len(m.group(1).expandtabs(4)), 'ol' if m.group(2)[0].isdigit() else 'ul', [m.group(3)])); gap = False; continue
        if not line.strip():
            if items:
                gap = True  # a list carries on past a blank line if another item follows
            else:
                flush()
            continue
        if items and gap and len(line.expandtabs(4)) - len(line.expandtabs(4).lstrip()) >= items[-1][0] + 2:
            items[-1][2].append(BR + line.strip()); gap = False  # an indented paragraph after a blank line stays in the item
        elif items and not gap:
            items[-1][2].append(line.strip())
        else:
            if items:
                flush()
            para.append(line)
    flush()
    return ''.join(out)


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', plain(s).lower()).strip('-')


def heading_title(s):
    """A heading's text, and the id a trailing kramdown attribute gives it, if any: `伤痕表 {: #scars-table }`."""
    m = re.match(r'(.*?)\s*\{:([^}]*)\}\s*$', s)
    if not m:
        return s.strip(), None
    hid = re.search(r'#([\w-]+)', m.group(2))
    return m.group(1).strip(), hid.group(1) if hid else None


# ---------- the Second Edition: every page, in full
SE_INDEX = 'second-edition.md'
CHARGEN_REL = 'second-edition/tools/character-generator.md'
SE_SKIP = {CHARGEN_REL}  # an interactive tool; it stays a link to the live site
GROUPS = {'players-guide': 'pg', 'wardens-guide': 'wg', 'backgrounds': 'bg', 'tools': 'tools'}
# The source's own alt text is "Click Me!"; these describe the maps (proposed, for the author to adopt in the Markdown)
IMAGE_ALT = {
    '/img/2e/dungeon-seed-example.webp': 'Example dungeon seed: nine numbered rooms joined by passages, each labelled with its type and details, '
                                         'such as 6, Special, Smoke and Illusion, with a dotted line marking the Fracture.',
    '/img/2e/forest-seed-example.webp': "Example forest seed: nine numbered sites, from 1, a petrified campsite at the entrance, to 9, a fishing hut "
                                        "at the exit, joined by colour-coded paths: Old Logging Road, Foraging Path, Hunter's Track, Treeline Heights "
                                        "and Dry Riverbed.",
    '/img/2e/pointcrawl-example-map.png': 'Example pointcrawl map: seven numbered points among mountains, forest and marsh, joined by paths '
                                          'marked with their travel time in watches.',
    '/img/2e/setting-seed-example.webp': 'Example setting seed, Mineral Reach: eleven numbered sites between the Mountains, the Plateau and the '
                                         'Wasteland, joined by roads, trails and wilderness routes labelled with their travel times.',
}
IMAGE_MAX = 1600  # px wide; the maps' labels stay legible, and the full size is a click away on cairnrpg.com
ROUTES = {}  # repo path -> the page's id in the prototype ('rules' for Core Rules), filled by site_pages()


def images_2e(src):
    """The example maps, resized into assets/2e/ (WebP) and inlined. They come from the checkout (img/2e/)."""
    names = [k.split('/')[-1] for k in IMAGE_ALT]
    missing = [n for n in names if not os.path.isfile(os.path.join(src, 'img', '2e', n))]
    if missing:
        die('example maps missing from the checkout (%s); run with --refresh' % ', '.join(missing))
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = 200_000_000  # the setting seed map is 12774 x 7967
    os.makedirs(os.path.join(HERE, 'assets', '2e'), exist_ok=True)
    for n in names:
        raw, out = os.path.join(src, 'img', '2e', n), os.path.join(HERE, 'assets', '2e', os.path.splitext(n)[0] + '.webp')
        if not os.path.isfile(out) or os.path.getmtime(out) < os.path.getmtime(raw):
            im = Image.open(raw).convert('RGB')
            im.thumbnail((IMAGE_MAX, IMAGE_MAX * 4))
            im.save(out, 'WEBP', quality=80)
        w, h = Image.open(out).size
        IMAGES_2E[os.path.splitext(n)[0]] = {'src': 'data:image/webp;base64,' + base64.b64encode(open(out, 'rb').read()).decode(), 'w': w, 'h': h}


# The adventures readable in the prototype: the first-party modules (Beyond the Pale only redirects to the store) and
# every conversion. Their images are hotlinked from cairnrpg.com rather than inlined.
ADV_FOLDERS = {'adventures/first-party': 'fp', 'adventures/conversions': 'conv'}
# cas-4's maps are raw <img> blocks with no alt text; these are proposed, like IMAGE_ALT. Others get "Map: <section>".
_CAS4 = '/adventures/first-party/img/cas-4/'
MODULE_IMAGE_ALT = {_CAS4 + 'simple-map-gray.webp': 'Map of Lockwood Manor', _CAS4 + 'iso-map.webp': 'Isometric map of Lockwood Manor',
                    _CAS4 + 'simple-map-white.webp': 'Map of Lockwood Manor', _CAS4 + 'workshop.webp': 'Map: 6. Workshop'}
# CAS-1 to CAS-3 images whose own alt text is just their file name (proposed, written from the images)
_FP = '/adventures/first-party/img/'
MODULE_IMAGE_ALT.update({
    _FP + 'cas-1/CAS1_Map_v2.webp': 'Map of Twin Lakes: West Lake and East Lake between the Stone Forest to the north and the Humpbacks to the '
                                   'south. Old Mill Road runs north from Isthmus Town to Deadmill, the Farming Path south to Dunston (one hour '
                                   'from Isthmus Town) and on to the Cities, three days on horseback, and East Lake Pass, three hours round, '
                                   'skirts the Downs to Bone Sump and White Tower Fens (two hours from Dunston or Isthmus Town).',
    _FP + 'cas-2/BloodOlm_Map.webp': 'Map of the Blue Mouth Caves: a ladder from the campsite (C1) drops into the Ladder Room (C5), and passages '
                                    'loop round the Atrium (C7), from the cave entrance (C2) in the south-east to the Blood Olm Lair (C9) in the '
                                    'north, the Blockade and Refuge (C10a, C10b) in the north-east and the Well (C11) in the west.',
    _FP + 'cas-2/BloodOlm_Cover.webp': 'Cover of Rise of the Blood Olms: three pale, hunched blood olms with eyeless heads and gaping, fanged mouths.',
    _FP + 'cas-2/BloodOlm_Backcover.webp': 'A pale tree with a dark, dripping canopy and a great mass of tangled roots hanging beneath it.',
    _FP + 'cas-2/Rusal1.webp': 'Rusal: a tall, thin, green-skinned humanoid with webbed hands and feet, round yellow eyes and a long white beard.',
    _FP + 'cas-3/TegnyMapSpread.webp': 'Map of Tegny Wood: nine numbered sites, 1 the Bartermoot tents, 2 the Old Dam on the river, 3 Bloody Grove, '
                                      '4 the Stone Circle, 5 the Abandoned Tower, 6 the Slanted Gazebo, 7 the Infected Fork, 8 the Workshop and '
                                      '9 the Last Stand, joined by an animal path, deer crossings and the pilgrim path.',
    _FP + 'cas-3/ChitinKnight.webp': 'Chitin Knight: a hulking figure in crusted chitin plates with a blocky helm, one arm ending in a long curved '
                                    'blade and the other in claws.',
})


def page_rels(src):
    rels = [SE_INDEX]
    for root, _, files in os.walk(os.path.join(src, 'second-edition')):
        rels += [os.path.relpath(os.path.join(root, f), src) for f in files if f.endswith('.md')]
    for folder in ADV_FOLDERS:
        rels += [folder + '/' + f for f in md_files(src, folder) if not split_fm(read(src, folder + '/' + f))[0].get('redirect_to')]
    return sorted(r for r in set(rels) if r not in SE_SKIP)


def is_adventure(rel):
    return os.path.dirname(rel) in ADV_FOLDERS


def group_of(rel):
    if is_adventure(rel):
        return ADV_FOLDERS[os.path.dirname(rel)]
    parts = rel.split('/')
    return GROUPS[parts[1]] if len(parts) == 3 and parts[1] in GROUPS else 'index'


def parent_of(rel):
    parts = rel.split('/')
    if rel == SE_INDEX or is_adventure(rel):
        return None  # an adventure's parent is the Adventures catalog, which isn't a page
    if len(parts) == 2:
        return SE_INDEX
    return 'second-edition/%s.md' % parts[1]


def is_title(heading, title):
    """A module's H1 is its title when it says the same, give or take a CAS-N: prefix or a note in brackets."""
    h = heading_title(heading)[0]
    return norm_name(title) in (norm_name(h), norm_name(re.sub(r'\s*\([^)]*\)\s*$', '', h)))


def map_blocks(body):
    """cas-4's {::nomarkdown} <img .../> {:/nomarkdown} map blocks, as Markdown images (with alt text)."""
    def one(m):
        src = re.search(r'\bsrc="([^"]+)"', m.group(1))
        if not src:
            return ''
        head = re.findall(r'^#{1,6} (.+?)\s*$', body[:m.start()], re.M)
        alt = MODULE_IMAGE_ALT.get(src.group(1)) or 'Map: %s' % (plain(heading_title(head[-1])[0]) if head else 'the area')
        return '![%s](%s)' % (alt.replace(']', ''), src.group(1))
    return re.sub(r'\{::nomarkdown\}\s*(<img\b.*?/?>)\s*\{:/nomarkdown\}', one, body, flags=re.S)


def fences(body):
    """Each ``` block as one FENCE line, so its contents are never read as headings or Markdown."""
    def one(m):
        FENCES.append(m.group(1).strip('\n'))
        return FENCE % (len(FENCES) - 1)
    return re.sub(r'^```[^\n]*\n(.*?)^```\s*$', one, body, flags=re.S | re.M)


def md_sections(text, adventure=False):
    """A page as (title, intro, [(level, heading, text)], shift) for its H2s and H3s; H4s and H5s stay in the text.
    adventure: an adventure page. The first H1 is dropped only when it is the page's title; then every heading moves by
    the same number of levels (shift) so the page's top level becomes its sections: a module's H1 chapters move down
    one, and a conversion that starts at ### or #### moves up."""
    fm, body = split_fm(text)
    shift = 0
    if adventure:
        body = fences(map_blocks(body))
    body = '\n'.join(l for l in body.splitlines() if not re.fullmatch(r'\s*\{:.*\}\s*', l))  # kramdown attribute lines
    h1 = re.search(r'^# (.+?)\s*$', body, re.M)
    first2 = re.search(r'^##', body, re.M)
    if h1 and (not first2 or h1.start() < first2.start()) and (not adventure or is_title(h1.group(1), fm.get('title') or '')):
        body = body[:h1.start()] + body[h1.end():]
    if adventure:
        top = min((len(m) for m in re.findall(r'^(#{1,6}) ', body, re.M)), default=2)
        shift = 2 - top
        body = re.sub(r'^(#{1,6}) ', lambda m: '#' * min(len(m.group(1)) + shift, 6) + ' ', body, flags=re.M)
    parts = re.split(r'^(#{2,3}) (.+?)\s*$', body, flags=re.M)
    title = fm.get('title') or (h1.group(1) if h1 else 'Untitled')
    return plain(heading_title(title)[0]), parts[0].strip(), [(len(parts[i]), parts[i + 1], parts[i + 2]) for i in range(1, len(parts), 3)], shift


def levels(secs):
    """Every heading level from H2 to H6, in order."""
    out = []
    for level, _, body in secs:
        out += [level] + [len(m) for m in re.findall(r'^(#{4,6}) ', body, re.M)]
    return out


def shape(text):
    """How many tables and lists a section has: enough to tell two same-level sections apart."""
    tables = lists = 0
    prev = ''
    for line in text.splitlines():
        if not line.strip():
            continue
        kind = 't' if line.strip().startswith('|') else 'l' if LIST_ITEM.match(line) else 'p'
        tables += kind == 't' and prev != 't'
        lists += kind == 'l' and prev != 'l'
        prev = kind
    return tables, lists


def mirror_mismatch(secs, en_secs):
    """Why a translation can't be paired with English heading by heading, or None."""
    if levels(secs) != levels(en_secs):
        return 'headings differ from English (%d H2, %d H3; English has %d, %d)' % (
            sum(s[0] == 2 for s in secs), sum(s[0] == 3 for s in secs), sum(s[0] == 2 for s in en_secs), sum(s[0] == 3 for s in en_secs))
    for (_, h, t), (_, eh, et) in zip(secs, en_secs):
        if shape(t) != shape(et):
            return 'section %r has a different shape from %r' % (plain(h), plain(eh))
    return None


def translated_share(text, en_text):
    """The share of a file's lines that aren't in the English file (an untouched fork scores 0)."""
    en = {l.strip() for l in en_text.splitlines() if l.strip()}
    lines = [l.strip() for l in split_fm(text)[1].splitlines() if l.strip() and not re.fullmatch(r'[#|:\- ]+', l.strip())]
    return sum(l not in en for l in lines) / len(lines) if lines else 0


def gfm_id(s):
    return re.sub(r'[^\w\- ]', '', plain(s).lower()).replace(' ', '-')


def kramdown_id(s):
    s = re.sub(r'[^a-z0-9 -]', '', re.sub(r'^[^a-zA-Z]+', '', plain(s)).lower()).replace(' ', '-')
    return s or 'section'


def plan_page(text, prefix, mode='en', en_plan=None, code=None, gfm=True, adventure=False):
    """A page's headings and their ids, before anything is rendered, so links between pages can be resolved first.
    en: ids are <prefix>-<slug>, numbered on repeats as GFM does. mirror: English's ids, heading by heading.
    own (a translation with its own structure): <prefix>-<code>-<n>, and <that>-<m> for its H4s and H5s.
    Returns {title, intro, secs: [(level, title, text, id, [h4/h5 ids])], anchors: {the source site's anchor: id}}."""
    title, intro, secs, shift = md_sections(text, adventure)
    if mode == 'mirror':
        why = mirror_mismatch(secs, en_plan['raw'])
        if why:
            raise ValueError(why)
        en_ids = iter([i for s in en_plan['secs'] for i in [s[3]] + s[4]])
    auto, seen_a, seen_i = gfm_id if gfm else kramdown_id, {}, {}
    def numbered(base, seen):
        n = seen.get(base, 0); seen[base] = n + 1
        return base if not n else '%s-%d' % (base, n)
    def source(h):  # the id the page's own site gives this heading
        t, explicit = heading_title(h)
        return explicit or numbered(auto(t), seen_a)
    source(title)  # the page title takes the first anchor
    en_id = lambda h: numbered('%s-%s' % (prefix, slug(heading_title(h)[0]) or 'section'), seen_i)
    anchors, out, n = {}, [], 0
    # an adventure's headings above its first section (a conversion's stat blocks, say) get ids too; first, so repeated
    # anchors number in document order, as on the site
    intro_ids = []
    if adventure:
        for hh in re.findall(r'^#{4,6} (.+?)\s*$', intro, re.M):
            intro_ids.append(en_id(hh)); anchors.setdefault(source(hh), intro_ids[-1])
    for level, h, body in secs:
        def new_id(head, parent=None, m=None):
            if mode == 'mirror':
                return next(en_ids)
            if mode == 'own':
                return '%s-%d' % (parent, m) if parent else '%s-%s-%d' % (prefix, code.lower(), n)
            return en_id(head)
        n += 1
        hid = new_id(h)
        anchors.setdefault(source(h), hid)
        subs = []
        for m, hh in enumerate(re.findall(r'^#{4,6} (.+?)\s*$', body, re.M), 1):
            subs.append(new_id(hh, hid, m)); anchors.setdefault(source(hh), subs[-1])
        out.append((level, plain(heading_title(h)[0]), body, hid, subs))
    return {'title': title, 'intro': intro, 'intro_ids': intro_ids, 'secs': out, 'raw': secs, 'anchors': anchors, 'shift': shift}


def render_page(plan, special=False):
    """A planned page as {title, intro, sections}, under the current SOURCE. special: English Core Rules, whose
    Reactions table is rebuilt as Roll / Reaction and whose Scars table gets a caption."""
    sections, cur = [], None
    for level, t, body, hid, subs in plan['secs']:
        top = level == 2 or cur is None  # an H3 before any H2 is shown as a section, so its headings sit one below that
        if special and t == 'Reactions':
            out = reactions(body)
        else:
            out = blocks(body, caption='Scars: result by HP lost' if special and t == 'Scars Table' else None, hids=subs, hlevel=(2 if top else level) + 1)
        item = {'id': hid, 'title': t, 'html': out}
        if level == 2:
            cur = dict(item, subs=[]); sections.append(cur)
        elif cur is None:  # an H3 before any H2: show it at the top level
            sections.append(dict(item, subs=[]))
        else:
            cur['subs'].append(item)
    intro = blocks(plan['intro'], hids=plan.get('intro_ids'), hlevel=2) if plan['intro'] else ''  # straight under the title
    return {'title': plan['title'], 'intro': intro, 'sections': sections}


def page_source(site, page, anchors, paths, others, fallback=None, strict=False, hotlink=False):
    SOURCE.update(site=site, page=page, anchors=anchors, fallback=fallback or {}, paths=paths, others=others, strict=strict, hotlink=hotlink, warn=[])


def page_html(page):
    return page['intro'] + ''.join(s['html'] + ''.join(x['html'] for x in s['subs']) for s in page['sections'])


def site_pages(src, reserved):
    """Every Second Edition page and every readable adventure, in English, keyed by its id. Also fills ROUTES.
    reserved: the template's own ids."""
    rels = page_rels(src)
    texts = {rel: read(src, rel) for rel in rels}
    bases = {}
    for rel in rels:
        bases.setdefault(os.path.basename(rel), []).append(rel)
    for rel in rels:
        base = os.path.basename(rel)[:-3]
        # a clash between an adventure and a rules page renames the adventure; between two rules pages, both
        clash = [r for r in bases[base + '.md'] if r != rel and (is_adventure(r) == is_adventure(rel) or is_adventure(rel))]
        ROUTES[rel] = 'rules' if rel == CORE_REL else ('%s-%s' % (group_of(rel), base) if clash else base)
    prefix = lambda rel: 'core' if rel == CORE_REL else ROUTES[rel]
    plans = {rel: plan_page(texts[rel], prefix(rel), adventure=is_adventure(rel)) for rel in rels}
    # every id is a hash route: none may repeat across pages, or clash with the template's own ids
    owner = {}
    for rel in rels:
        for i in [ROUTES[rel]] + [x for s in plans[rel]['secs'] for x in [s[3]] + s[4]]:
            clash = owner.get(i) or ('the template' if i in reserved or i == 'adventures' or re.match(r'(home|res|m|adv)-', i) else None)
            if clash and clash != rel:
                die('id %r from %s clashes with %s' % (i, rel, clash))
            owner[i] = rel
    paths = {site_path(url_of(rel)): ROUTES[rel] for rel in rels}
    others = {ROUTES[rel]: plans[rel]['anchors'] for rel in rels}
    pages, warns = {}, []
    for rel in rels:
        fm = split_fm(texts[rel])[0]
        page_source(SITE, url_of(rel), plans[rel]['anchors'], paths, others, hotlink=is_adventure(rel))
        p = render_page(plans[rel], special=rel == CORE_REL)
        warns += ['%s: %s' % (rel, w) for w in SOURCE['warn']]
        if is_adventure(rel):
            warns += ['%s: raw Markdown %r left in the page' % (rel, x) for x in leaks(p)]
        pages[ROUTES[rel]] = dict(p, id=ROUTES[rel], path=rel, group=group_of(rel), parent=ROUTES.get(parent_of(rel)) if parent_of(rel) else None,
                                  order=int(fm['nav_order']) if fm.get('nav_order', '').isdigit() else None,
                                  toc=fm.get('has_children') == 'true' and fm.get('has_toc') != 'false', edit=GITHUB_BLOB + rel, url=url_of(rel), children=[],
                                  **({'srcheads': src_heads(plans[rel])} if is_adventure(rel) else {}))
    page_source(SITE, SITE + '/', {}, {}, {})
    # children, listed as JTD does after the page's own text (nav_order, then title)
    for p in pages.values():
        if p['toc']:
            kids = sorted((c for c in pages.values() if c['parent'] == p['id']), key=lambda c: (c['order'] is None, c['order'] or 0, c['title'].lower()))
            p['children'] = [{'id': c['id'], 'label': c['title']} for c in kids]
            if p['path'] == 'second-edition/tools.md':
                p['children'].append({'href': url_of(CHARGEN_REL), 'label': title_of(src, CHARGEN_REL)})
    for w in warns:
        print('pages: ' + w, file=sys.stderr)
    return pages, plans, texts


def src_heads(plan):
    """An adventure page's headings counted at the source's own levels (before the shift), for --parity."""
    lv = [s[0] for s in plan['secs']] + [len(m) for t in [plan['intro']] + [s[2] for s in plan['secs']] for m in re.findall(r'^(#{4,6}) ', t, re.M)]
    src = [l - plan['shift'] for l in lv]
    return {'h1': src.count(1), 'h2': src.count(2), 'h3': src.count(3), 'h4-5': sum(l >= 4 for l in src)}


def reactions(text):
    """The source table's first row is the roll ranges, the second the reactions: rebuild as Roll / Reaction."""
    tl = [l for l in text.splitlines() if l.strip().startswith('|')]
    rows = table_rows(tl)
    if len(rows) != 2 or len(rows[0]) != len(rows[1]):
        die('Reactions table changed shape: %r' % rows)
    intro = blocks('\n'.join(l for l in text.splitlines() if not l.strip().startswith('|')))
    body = ''.join('<tr><th scope="row">%s</th><td>%s</td></tr>' % (inline(a), inline(b)) for a, b in zip(*rows))
    return intro + ('<div class="table-wrap narrow"><table><caption>Reaction roll (2d6)</caption>'
                    '<thead><tr><th scope="col">Roll</th><th scope="col">Reaction</th></tr></thead><tbody>%s</tbody></table></div>' % body)


# ---------- the Core Rules in other languages: the community's own translations, read from the repos that publish them
# Cairn's localization/second-edition/ has one stub per language, redirecting to that language's site. Each site is
# published from a repo; that repo is the translation used here. Forks named cairn-<code> (the localization guide's
# naming) are added as unofficial for languages with no stub. See NOTES.md, Translations.
CORE_REL = 'second-edition/players-guide/core-rules.md'
CC_REL = 'second-edition/players-guide/character-creation.md'
L10N_STUBS = 'localization/second-edition'
# each language's own name; also the list of codes a cairn-<code> fork may use
LANG_NAMES = {'fi': 'Suomi', 'zh': '中文', 'ru': 'Русский', 'pt-BR': 'Português (Brasil)', 'pt': 'Português', 'es': 'Español',
              'fr': 'Français', 'de': 'Deutsch', 'it': 'Italiano', 'tr': 'Türkçe', 'cs': 'Čeština', 'uk': 'Українська',
              'da': 'Dansk', 'pl': 'Polski', 'nl': 'Nederlands', 'sv': 'Svenska', 'no': 'Norsk', 'is': 'Íslenska',
              'ja': '日本語', 'ko': '한국어', 'th': 'ไทย', 'vi': 'Tiếng Việt', 'id': 'Bahasa Indonesia', 'hu': 'Magyar',
              'ro': 'Română', 'el': 'Ελληνικά', 'bg': 'Български', 'be': 'Беларуская', 'sr': 'Српски', 'hr': 'Hrvatski',
              'sk': 'Slovenčina', 'sl': 'Slovenščina', 'lt': 'Lietuvių', 'lv': 'Latviešu', 'et': 'Eesti', 'ca': 'Català',
              'gl': 'Galego', 'eu': 'Euskara', 'he': 'עברית', 'ar': 'العربية', 'fa': 'فارسی'}
RTL = {'he', 'ar', 'fa'}
# stub filenames (or titles) to codes
STUB_CODES = {'finnish': 'fi', 'chinese': 'zh', 'chinese-simplified': 'zh', 'russian': 'ru', 'brazilian-portuguese': 'pt-BR',
              'portuguese': 'pt', 'spanish': 'es', 'french': 'fr', 'german': 'de', 'italian': 'it', 'turkish': 'tr',
              'czech': 'cs', 'ukrainian': 'uk', 'danish': 'da', 'polish': 'pl', 'dutch': 'nl', 'swedish': 'sv',
              'norwegian': 'no', 'japanese': 'ja', 'korean': 'ko', 'hungarian': 'hu', 'greek': 'el', 'hebrew': 'he'}
# country codes forks use for their language
CODE_ALIASES = {'cz': 'cs', 'ua': 'uk', 'cn': 'zh', 'dk': 'da', 'jp': 'ja', 'kr': 'ko', 'gr': 'el', 'se': 'sv'}
# choices a person makes: pin a repo or file, set a mode, a credit line or note, or leave a language out
L10N_OVERRIDES = {
    'pt-BR': {'file': 'regras/core-rules.md'},  # its own structure, under regras/; the repo is found by its homepage
    'zh': {'repo': 'Ascll-Ray/cairn-zh'},        # not a fork, and its site doesn't link it; its CNAME names the site
    'ru': {'note': 'beta'},
    'es': {'exclude': True},                     # Spanish 2e is a commercial book; its stub links the itch.io page
}
FORK_PATHS = [CORE_REL, 'players-guide/core-rules.md', 'core-rules.md']
LICENCE = re.compile(r'CC[- ]?BY[- ]?SA|Creative Commons Attribution[- ]ShareAlike', re.I)


class GitHub:
    """GitHub's API (60 calls an hour without a token, so they're counted) and raw files (not rate limited)."""
    def __init__(self):
        self.calls = 0

    def api(self, path):
        self.calls += 1
        return json.loads(curl('https://api.github.com/' + path))

    def raw(self, repo, branch, path):
        try:
            return curl('https://raw.githubusercontent.com/%s/%s/%s' % (repo, branch, urllib.parse.quote(path))).decode('utf-8')
        except (OSError, UnicodeDecodeError):
            return None


def host_of(url):
    return (urllib.parse.urlparse(url or '').hostname or '').lower()


def cairn_host(url):
    """A *.cairnrpg.com host, or None."""
    h = host_of(url)
    return h if h.endswith('.cairnrpg.com') else None


def base_lang(code):
    return code.split('-')[0].lower()


def page_url(lang_site, file, text):
    """A page's URL on a language site, ending in / as those sites serve it (permalink: pretty)."""
    fm = split_fm(text)[0]
    path = fm.get('permalink') or '/' + file[:-3] + '/'
    return 'https://%s/%s' % (lang_site, path.strip('/') + '/')


def translation_stubs(src, report):
    """Cairn's own list: every Second Edition stub claims its language, whatever it redirects to."""
    stubs = {}
    for f in md_files(src, L10N_STUBS):
        if f == 'localization-guide.md':
            continue
        fm = split_fm(read(src, L10N_STUBS + '/' + f))[0]
        code = STUB_CODES.get(f[:-3]) or STUB_CODES.get(slug(fm.get('title', '')))
        if not code:
            report.append('stub %s: unknown language; add it to STUB_CODES' % f); continue
        redirect = fm.get('redirect_to', '')
        if code in stubs or any(s['host'] and s['host'] == host_of(redirect) for s in stubs.values()):
            report.append('stub %s: %s is already listed; ignored' % (f, code)); continue
        stubs[code] = {'host': cairn_host(redirect), 'redirect': redirect}
    return stubs


def official_repos(gh, stubs, forks, report):
    """For each stub with a *.cairnrpg.com site, the one repo that publishes it (by CNAME or homepage), found among
    the forks and the repos the site's home page links to."""
    by_name = {f['full_name'].lower(): f for f in forks}
    def info(repo):
        return by_name.get(repo.lower()) or gh.api('repos/' + repo)
    def publishes(r, host):
        cname = (gh.raw(r['full_name'], r['default_branch'], 'CNAME') or '').strip().lower()
        return cname == host or host_of(r.get('homepage')) == host
    chosen = {}
    for code, st in stubs.items():
        ov = L10N_OVERRIDES.get(code, {})
        if ov.get('exclude'):
            report.append('%s: excluded (%s)' % (code, st['redirect'])); continue
        if not st['host']:
            report.append('%s: listed, no site (%s); not shown' % (code, st['redirect'])); continue
        host = st['host']
        if ov.get('repo'):
            cands = [ov['repo']]
        else:
            cands = [f['full_name'] for f in forks if host_of(f.get('homepage')) == host]
            try:
                home = curl('https://%s/' % host).decode('utf-8', 'replace')
            except OSError as e:
                home = ''; report.append('%s: could not read %s (%s)' % (code, host, e))
            for o, r in re.findall(r'github\.com/([\w.-]+)/([\w.-]+)', home):
                full = o + '/' + re.sub(r'\.git$', '', r)
                if full.lower() != 'yochaigal/cairn' and full.lower() not in [c.lower() for c in cands]:
                    cands.append(full)
        wins = []
        for c in cands:
            try:
                r = info(c)
            except OSError:
                continue
            if publishes(r, host):
                wins.append(r)
        if ov.get('repo') and not wins:
            report.append('%s: the pinned %s no longer publishes %s; the site may have moved. Using it anyway' % (code, ov['repo'], host))
            wins = [info(ov['repo'])]
        if len(wins) != 1:
            report.append('%s: %s; not shown' % (code, 'no repo publishes ' + host if not wins else
                          'several repos publish %s (%s); pin one in L10N_OVERRIDES' % (host, ', '.join(w['full_name'] for w in wins))))
            continue
        chosen[code] = {'repo': wins[0], 'host': host, 'official': True, 'file': ov.get('file')}
    return chosen


def unofficial_forks(gh, stubs, forks, en_text, report):
    """Forks named cairn-<code> for languages with no stub, translated, with the English structure."""
    claimed = {base_lang(c) for c in stubs}
    groups, seen_forks = {}, {'not shown (its language is listed)': [], 'untranslated or a different structure': [], 'unknown language code': []}
    for f in forks:
        m = re.fullmatch(r'cairn[-_]([a-z]{2,3})(?:[-_]([a-z]{2}))?', f['name'], re.I)
        if not m:
            continue
        b = CODE_ALIASES.get(m.group(1).lower(), m.group(1).lower())
        if b not in LANG_NAMES:
            seen_forks['unknown language code'].append(f['full_name']); continue
        if b in claimed:
            seen_forks['not shown (its language is listed)'].append(f['full_name']); continue
        for p in FORK_PATHS:
            text = gh.raw(f['full_name'], f['default_branch'], p)
            if text is not None and translated_share(text, en_text) >= .5 and not mirror_mismatch(md_sections(text)[2], md_sections(en_text)[2]):
                groups.setdefault(b, []).append({'repo': f, 'file': p}); break
        else:
            srd = gh.raw(f['full_name'], f['default_branch'], 'cairn-srd.md')
            seen_forks['untranslated or a different structure'].append(f['full_name'] + (' (has cairn-srd.md, no core-rules.md)' if srd else ''))
    chosen = {}
    for b, cs in sorted(groups.items()):
        pin = L10N_OVERRIDES.get(b, {}).get('repo')
        pick = [c for c in cs if c['repo']['full_name'].lower() == pin.lower()] if pin else cs
        if len(pick) != 1:
            report.append('%s: several forks qualify (%s); not shown. Pin one in L10N_OVERRIDES' % (b, ', '.join(c['repo']['full_name'] for c in cs))); continue
        c = pick[0]
        chosen[b] = {'repo': c['repo'], 'host': cairn_host(c['repo'].get('homepage')),
                     'official': False, 'file': c['file']}
    for k, v in seen_forks.items():
        if v:
            report.append('forks %s: %s' % (k, ', '.join(v)))
    return chosen


def fetch_language(gh, code, c, cache, en_texts, old, report):
    """One chosen repo: its files, structure, Markdown settings and licence, with every translated page saved into
    the cache. Returns its index entry, or None when it can't be used."""
    r, ov = c['repo'], L10N_OVERRIDES.get(code, {})
    repo, branch = r['full_name'], r['default_branch']
    try:
        tree = [t['path'] for t in gh.api('repos/%s/git/trees/%s?recursive=1' % (repo, branch))['tree'] if t['type'] == 'blob']
    except (OSError, ValueError, KeyError) as e:
        report.append('%s: could not list %s (%s); not shown' % (code, repo, e)); return None
    file = c['file'] or next((p for want in (lambda p: p == CORE_REL, lambda p: p.endswith('players-guide/core-rules.md'), lambda p: p.endswith('core-rules.md'))
                              for p in tree if want(p)), None)
    if not file:
        report.append('%s: %s has no core-rules.md; not shown' % (code, repo)); return None
    # where each English page is in this repo: the same path under its Second Edition root (fi: second-edition/,
    # zh: the repo root); a repo with its own layout (pt-BR's regras/) by a basename found once in its tree
    root = file[:-len('players-guide/core-rules.md')] if file.endswith('players-guide/core-rules.md') else None
    files, tset = {CORE_REL: file}, set(tree)
    for rel in en_texts:
        if rel == CORE_REL:
            continue
        if root is not None:
            cand = root + rel[len('second-edition/'):] if rel.startswith('second-edition/') else (root.rstrip('/') + '.md' if root else None)
        else:
            same = [p for p in tree if os.path.basename(p) == os.path.basename(rel)]
            cand = same[0] if len(same) == 1 else None
        if cand in tset:
            files[rel] = cand
    with concurrent.futures.ThreadPoolExecutor(4) as pool:  # raw files: not rate limited
        got = dict(zip(files, pool.map(lambda f: gh.raw(repo, branch, f), files.values())))
    old_pages = old.get('pages', {})
    site, pages, untranslated = c['host'], {}, 0
    for rel, f in files.items():
        text, cached = got[rel], os.path.join(cache, 'l10n', code, rel)
        if text is None:
            if not os.path.isfile(cached):
                report.append('%s: could not download %s; not shown' % (code, f)); continue
            report.append('%s: could not download %s; using the cached copy' % (code, f))
            text = open(cached, encoding='utf-8').read()
        if translated_share(text, en_texts[rel]) < .5:
            untranslated += 1; continue
        os.makedirs(os.path.dirname(cached), exist_ok=True)
        open(cached, 'w', encoding='utf-8').write(text)
        o = old_pages.get(rel, {})
        mode = (ov.get('mode') if rel == CORE_REL else None) or (o['mode'] if old.get('repo') == repo and o.get('file') == f and o.get('mode') else
                'own' if mirror_mismatch(md_sections(text)[2], md_sections(en_texts[rel])[2]) else 'mirror')
        pages[rel] = {'file': f, 'mode': mode, 'url': page_url(site, f, text) if site else 'https://github.com/%s/blob/%s/%s' % (repo, branch, f)}
    if CORE_REL not in pages:
        report.append('%s: its Core Rules could not be used; not shown' % code); return None
    cfg = gh.raw(repo, branch, '_config.yml') or ''
    licence = any(LICENCE.search(gh.raw(repo, branch, p) or '') for p in ('README.md', 'LICENSE', 'LICENSE.md'))
    if not licence:
        report.append('%s: no CC-BY-SA licence found in %s README.md or LICENSE; check it before using it' % (code, repo))
    return {
        'code': code, 'name': LANG_NAMES.get(code, code), 'repo': repo, 'branch': branch, 'file': file, 'mode': pages[CORE_REL]['mode'],
        'official': c['official'], 'site': site, 'gfm': not re.search(r'^\s+input:\s*["\']?kramdown\b', cfg, re.M | re.I), 'licence': licence,
        'credit': ov.get('credit') or repo.split('/')[0], 'note': ov.get('note', ''),
        'found': old.get('found') or datetime.date.today().isoformat(), 'pages': pages, 'untranslated': untranslated}


def discover_translations(src, cache, en_texts):
    """Find each language's translation and download it into <cache>/l10n/. Prints what's new, changed or gone."""
    gh, report = GitHub(), []
    idx_path = os.path.join(cache, 'l10n', 'index.json')
    prev = json.load(open(idx_path, encoding='utf-8'))['languages'] if os.path.isfile(idx_path) else {}
    stubs = translation_stubs(src, report)
    forks, page = [], 1
    while True:
        batch = gh.api('repos/yochaigal/cairn/forks?per_page=100&page=%d' % page)
        forks += batch
        if len(batch) < 100:
            break
        page += 1
    chosen = official_repos(gh, stubs, forks, report)
    chosen.update(unofficial_forks(gh, stubs, forks, en_texts[CORE_REL], report))
    os.makedirs(os.path.join(cache, 'l10n'), exist_ok=True)
    langs = {}
    for code, c in chosen.items():
        entry = fetch_language(gh, code, c, cache, en_texts, prev.get(code, {}), report)
        if entry:
            langs[code] = entry
    for code, l in langs.items():
        o = prev.get(code)
        what = 'new' if not o else 'changed' if (o['repo'], o['file'], o['mode'], o['official']) != (l['repo'], l['file'], l['mode'], l['official']) else 'same'
        print('translations: %-5s %s %s, Core Rules %s, %d of %d pages translated%s [%s]' % (code, 'official' if l['official'] else 'unofficial', l['repo'],
              l['mode'], len(l['pages']), len(en_texts), '' if l['licence'] else ', licence not found', what), file=sys.stderr)
    for code in prev:
        if code not in langs:
            print('translations: %-5s gone' % code, file=sys.stderr)
    for line in report:
        print('translations: ' + line, file=sys.stderr)
    print('translations: %d GitHub API calls' % gh.calls, file=sys.stderr)
    json.dump({'updated': datetime.date.today().isoformat(), 'languages': langs}, open(idx_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


LEAKS = re.compile(r'####|^#{1,6} |^>|\{:|\*\*|\]\(|&[a-zA-Z]+;', re.M)


def leaks(page):
    text = re.sub(r'<[^>]+>', '\n', re.sub(r'<pre\b.*?</pre>', '', page_html(page), flags=re.S))
    text = re.sub(r'&(amp|lt|gt|quot|#x27|#39);', '', text)  # our own escaping
    return sorted(set(LEAKS.findall(text)))


def translations(cache, pages, plans):
    """The cached translations, page by page, parsed. Never goes online: --refresh or --translations downloads them."""
    idx_path = os.path.join(cache, 'l10n', 'index.json')
    if not os.path.isfile(idx_path):
        print('translations: none cached; run --refresh (or --translations) to add them', file=sys.stderr)
        return {}
    idx = json.load(open(idx_path, encoding='utf-8'))
    paths_en = {site_path(url_of(rel)): pid for rel, pid in ROUTES.items()}
    out = {}
    for code, lang in idx['languages'].items():
        lp, plans_l, warn = {r: i for r, i in lang.get('pages', {}).items() if r in ROUTES}, {}, []
        for rel, info in lp.items():
            p = os.path.join(cache, 'l10n', code, rel)
            if not os.path.isfile(p):
                warn.append('%s is not downloaded; run --translations' % rel); continue
            try:
                plans_l[rel] = plan_page(open(p, encoding='utf-8').read(), 'core' if rel == CORE_REL else ROUTES[rel], info['mode'], plans[rel], code, lang.get('gfm', True))
            except (ValueError, KeyError, IndexError, StopIteration) as e:
                warn.append('%s skipped: %s' % (rel, e))
        # a link on the language's site goes to that page in the prototype, in the same language where it's translated
        site_url = 'https://' + lang['site'] if lang['site'] else SITE
        paths = dict(paths_en)
        if lang['site']:
            paths.update({site_path(i['url']): ROUTES[r] for r, i in lp.items()})
        others = {pid: {**plans[rel]['anchors'], **(plans_l[rel]['anchors'] if rel in plans_l else {})} for rel, pid in ROUTES.items()}
        lpages = {}
        for rel, pl in plans_l.items():
            info = lp[rel]
            page_source(site_url, info['url'] if lang['site'] else url_of(rel), pl['anchors'], paths, others,
                        fallback=plans[rel]['anchors'] if info['mode'] == 'mirror' else None, strict=True)
            try:
                page = render_page(pl)
            except (ValueError, KeyError, IndexError) as e:
                warn.append('%s skipped: %s' % (rel, e)); continue
            warn += ['%s: %s' % (rel, w) for w in SOURCE['warn']] + ['%s: raw Markdown %r left in the page' % (rel, x) for x in leaks(page)]
            lpages[ROUTES[rel]] = dict(page, mode=info['mode'], url=info['url'], edit='https://github.com/%s/blob/%s/%s' % (lang['repo'], lang['branch'], info['file']))
        page_source(SITE, SITE + '/', {}, {}, {})
        for w in sorted(set(warn)):
            print('translations: %s: %s' % (code, w), file=sys.stderr)
        if not lpages:
            continue
        print('translations: %-5s %d of %d pages' % (code, len(lpages), len(pages)), file=sys.stderr)
        out[code] = {'code': code, 'name': lang['name'], 'dir': 'rtl' if base_lang(code) in RTL else 'ltr', 'site': lang['site'],
                     'official': lang['official'], 'credit': lang['credit'], 'note': lang['note'], 'pages': lpages}
    return dict(sorted(out.items(), key=lambda kv: kv[1]['name'].lower()))


def counts(htm):
    """What a page holds: headings, tables and rows, list items and images."""
    c = lambda pat: len(re.findall(pat, htm))
    return {'h1': c(r'<h1[\s>]'), 'h2': c(r'<h2[\s>]'), 'h3': c(r'<h3[\s>]'), 'h4-5': c(r'<h[45][\s>]'), 'tables': c(r'<table[\s>]'), 'rows': c(r'<tr[\s>]'),
            'items': c(r'<li[\s>]'), 'images': c(r'<img[\s>]')}


def our_counts(page):
    """Our page counted at the source's own heading levels (we render #### one level below its section)."""
    body = page_html(page)
    n = counts(body)
    n.update({'h1': 0, 'h2': len(page['sections']), 'h3': sum(len(s['subs']) for s in page['sections']), 'h4-5': len(re.findall(r'<h[3-6] id=', body))})
    return dict(n, **page['srcheads']) if page.get('srcheads') else n


def parity(pages, l10n):
    """Compare every page with the page the live site serves (Just the Docs' own rendering), and each translation with
    its language site's. Prints each page that differs; returns the number of differences."""
    jobs = [('en', pid, p['url'], p) for pid, p in pages.items()]
    shifted = {p['url']: p['title'] for p in pages.values() if p.get('srcheads')}  # the adventures
    jobs += [(code, pid, t['url'], t) for code, l in l10n.items() if l['site'] for pid, t in l['pages'].items()]
    def live(url):
        try:
            h = curl(url).decode('utf-8', 'replace')
        except OSError as e:
            return None, str(e)
        m = re.search(r'<main[^>]*>(.*)</main>', h, re.S)
        body = m.group(1) if m else h
        body = re.sub(r'(<hr>\s*)?<h2 class="text-delta">.*', '', body, flags=re.S)  # JTD's child list ("Table of contents")
        if url in shifted:  # an adventure's H1s can be its chapters: drop only the one that is the page title, as we do
            first = re.search(r'<h1[\s>].*?</h1>', body, flags=re.S)
            if first and is_title(html.unescape(re.sub(r'<[^>]+>', '', first.group(0))).strip(), shifted[url]):
                body = body[:first.start()] + body[first.end():]
        else:
            body = re.sub(r'<h1[\s>].*?</h1>', '', body, flags=re.S)
        # an all-empty header row (some translations open their tables with one) is dropped here; see blocks()
        body = re.sub(r'<thead>\s*<tr>(\s*<th[^>]*>\s*</th>)+\s*</tr>\s*</thead>', '<thead></thead>', body)
        return counts(body), None
    with concurrent.futures.ThreadPoolExecutor(4) as pool:
        got = list(pool.map(lambda j: live(j[2]), jobs))
    diffs, by_lang = 0, {}
    for (code, pid, url, page), (theirs, err) in zip(jobs, got):
        by_lang.setdefault(code, [0, 0]); by_lang[code][0] += 1
        if err:
            print('parity: %-5s %-28s could not fetch %s (%s)' % (code, pid, url, err), file=sys.stderr); continue
        ours = our_counts(page)
        delta = {k: (ours[k], theirs[k]) for k in ours if ours[k] != theirs[k]}
        if delta:
            diffs += 1; by_lang[code][1] += 1
            print('parity: %-5s %-28s %s' % (code, pid, ', '.join('%s ours %d / live %d' % (k, a, b) for k, (a, b) in delta.items())), file=sys.stderr)
    for code, (n, d) in by_lang.items():
        print('parity: %-5s %d pages compared, %d differ' % (code, n, d), file=sys.stderr)
    return diffs


def chapters(src, folder):
    items = [link(src, folder + '/' + f) for f in md_files(src, folder)]
    return sorted(items, key=lambda c: c['label'].lower())  # JTD orders untitled-order siblings by title


def wardens_parts(src, wg):
    """Use the author's own Part 1-3 grouping from the Warden's Guide index."""
    body = split_fm(read(src, 'second-edition/wardens-guide.md'))[1]
    by_slug = {os.path.basename(c['path'])[:-3]: c for c in wg}
    parts, cur = [], None
    for line in body.splitlines():
        m = re.match(r'### (Part \d+): (.+)', line)
        if m:
            cur = {'label': m.group(2).strip(), 'part': m.group(1), 'items': []}; parts.append(cur); continue
        m = re.match(r'\s*- \[[^\]]+\]\(([a-z0-9-]+)\)\s*$', line)
        if m and cur is not None and m.group(1) in by_slug:
            cur['items'].append(by_slug[m.group(1)])
    seen = [c['path'] for p in parts for c in p['items']]
    if sorted(seen) != sorted(c['path'] for c in wg):
        die("Warden's Guide parts don't cover every chapter exactly once")
    return parts


def monsters(src):
    folder = 'resources/monsters'
    out = []
    for f in md_files(src, folder):
        rel = folder + '/' + f
        body = split_fm(read(src, rel))[1]
        h = re.search(r'^# (.+)$', body, re.M)
        if not h:
            die('no heading in ' + rel)
        rest = body[h.end():].strip().splitlines()
        stats = next((l.strip() for l in rest if l.strip() and not l.lstrip().startswith('-')), '')
        bullets = [inline(re.sub(r'^\s*- ', '', l).strip()) for l in rest if l.lstrip().startswith('- ')]
        # "6 HP, 12 STR, 14 DEX, 8 WIL, bite (d8)": the leading numbers are the stat line, the rest is the attack
        # (and any _detachment_); a few creatures (Pixie, Boggart, Will-o'-wisp) have no attack
        sm = re.match(r'((?:\s*\d+\s+(?:HP|Armor|STR|DEX|WIL)\s*(?:,|$))+)\s*(.*)$', stats)
        if not sm:
            die('unexpected stat line in %s: %r' % (rel, stats))
        attack = sm.group(2).strip()
        # as [label, number] pairs in the source's order (HP, Armor, STR, DEX, WIL), so the card can size them apart
        stats = [[k.upper(), v] for v, k in re.findall(r'(\d+)\s+(HP|Armor|STR|DEX|WIL)', sm.group(1))]
        out.append({'name': h.group(1).strip(), 'stats': stats,
                    'attack': inline(attack[:1].upper() + attack[1:]), 'bullets': bullets, 'href': url_of(rel), 'edit': GITHUB_BLOB + rel})
    return sorted(out, key=lambda m: m['name'].lower())


def logo_svg(src):
    """Rebuild the site logo from its shapes only (path/polygon geometry, nothing else), filled with currentColor
    so it follows the theme. The source is white-on-transparent, which would vanish on the light theme."""
    raw = read(src, LOGO.lstrip('/'))
    shapes = [('path', 'd', m) for m in re.findall(r'<path\b[^>]*\sd="([^"]+)"', raw)]
    shapes += [('polygon', 'points', m) for m in re.findall(r'<polygon\b[^>]*\spoints="([^"]+)"', raw)]
    if not shapes:
        die('logo.svg changed shape')
    ok = re.compile(r'[\d.,\s+\-eMmLlHhVvCcSsQqTtAaZz]+')
    if not all(ok.fullmatch(g) for _, _, g in shapes):
        die('logo.svg geometry has unexpected characters')
    if hashlib.sha256(''.join(g for _, _, g in shapes).encode()).hexdigest()[:16] != LOGO_SHAPES:
        die('logo.svg changed: re-measure LOGO_VIEWBOX and .brand .logo\'s translateY, then update LOGO_SHAPES')
    body = ''.join('<%s %s="%s"/>' % (tag, attr, g) for tag, attr, g in shapes)
    return '<svg class="logo" viewBox="%s" fill="currentColor" aria-hidden="true" focusable="false">%s</svg>' % (LOGO_VIEWBOX, body)


def paragraphs(src, rel):
    """Plain-text prose paragraphs after the H1, skipping lists, headings, tables and HTML."""
    out, cur = [], []
    for line in split_fm(read(src, rel))[1].splitlines():
        t = line.strip()
        if not t or t.startswith(('#', '-', '*', '|', '<', '>')):
            if cur:
                out.append(' '.join(cur)); cur = []
            continue
        cur.append(t)
    if cur:
        out.append(' '.join(cur))
    return [plain(p) for p in out]


def sentences(text, n):
    # a sentence ends at . ! or ? followed by a space or the end, so "4.0" stays whole
    text = re.sub(r'\s+', ' ', text).strip()
    return ' '.join(x.strip() for x in re.findall(r'.+?[.!?](?=\s|$)', text)[:n])


def authored(src, rel, para, n):
    """The author's own sentences from a page, with where they came from."""
    ps = paragraphs(src, rel)
    if len(ps) <= para:
        die('expected prose paragraph %d in %s' % (para + 1, rel))
    return {'text': sentences(ps[para], n), 'src': rel}


def h2s(src, rel):
    seen = []
    for h in re.findall(r'^## (.+?)\s*$', split_fm(read(src, rel))[1], re.M):
        h = plain(h)
        if h not in seen:
            seen.append(h)
    return seen


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--src', default=os.path.join(HERE, '.cairn-src'), help='the Cairn repo checkout (cloned if missing)')
    ap.add_argument('--cache', default=os.path.join(HERE, 'cache'), help='where the translations are cached')
    ap.add_argument('--out', default=OUT, help='the page to write')
    ap.add_argument('--blog-feed', metavar='FILE', help="the blog's Atom feed, saved from a browser")
    ap.add_argument('--refresh', action='store_true', help='re-clone both repos and re-discover the translations')
    ap.add_argument('--translations', action='store_true', help='re-discover the translations from the checkout as it is')
    ap.add_argument('--parity', action='store_true', help='compare every page with the live site')
    args = ap.parse_args()
    src, cache, out = args.src, args.cache, args.out
    fetch(src, args.refresh)
    images_2e(src)
    reserved = {i for i in re.findall(r'\bid="([^"]+)"', open(TEMPLATE, encoding='utf-8').read()) if '$' not in i}
    pages, plans, texts = site_pages(src, reserved)
    fetch_scrivener(SCRIV_SRC, args.refresh)
    posts = scrivener_posts(SCRIV_SRC) if os.path.isdir(SCRIV_SRC) else []
    if not posts:
        print('adventures: no Scrivener checkout; the catalog lists the Cairn repo pages only', file=sys.stderr)
    advs = adventures(src, posts)
    if args.refresh or args.translations:
        try:
            discover_translations(src, cache, {r: t for r, t in texts.items() if r.startswith('second-edition/') or r == SE_INDEX})
        except (OSError, ValueError, KeyError) as e:
            print('translations: discovery failed (%s); keeping the previous list' % e, file=sys.stderr)

    pg = chapters(src, 'second-edition/players-guide')
    wg = chapters(src, 'second-edition/wardens-guide')
    bg = chapters(src, 'second-edition/backgrounds')
    mons = monsters(src)
    adv = {k: len(md_files(src, 'adventures/' + k)) for k in GROUP_LABEL}
    langs = {f[:-3] for d in ('first-edition', 'second-edition') for f in md_files(src, 'localization/' + d) if f != 'localization-guide.md'}
    got = {'hacks': len(md_files(src, 'hacks')), 'languages': len(langs), 'monsters': len(mons), 'pg': len(pg), 'wg': len(wg), 'bg': len(bg), **{'adv_' + k: v for k, v in adv.items()}}
    bad = {k: (got[k], v) for k, v in EXPECT.items() if got[k] != v}
    if bad:
        die('repo counts changed (got, expected): %s' % bad)
    for rel in PROPOSED:
        read(src, rel)  # each proposed summary's page must still exist
    parts = wardens_parts(src, wg)

    L = lambda rel, label=None: link(src, rel, label)
    data = {
        'adventures': advs, 'featured': featured(advs),
        'blog': blog(args.blog_feed),
        'counts': got,
        'copy': {
            'hero': authored(src, 'README.md', 0, 2),
            'share': [authored(src, 'README.md', 1, 1), authored(src, 'README.md', 2, 1)],
            'wardens': authored(src, 'second-edition/wardens-guide.md', 0, 1),
            'steps': [{'path': rel, 'covers': h2s(src, rel)} for rel in ('second-edition/players-guide/overview-and-principles.md', CC_REL, CORE_REL)],
            'proposed': {rel: {'text': t} for rel, t in PROPOSED.items()},
        },
        'pg': pg, 'wg_parts': parts, 'bg': bg,
        'pages': pages,
        'l10n': translations(cache, pages, plans),
        # previous / next runs within a group, in the sidebar's order
        'order': {'pg': [ROUTES[c['path']] for c in pg], 'wg': [ROUTES[c['path']] for p in parts for c in p['items']],
                  'bg': [ROUTES[c['path']] for c in bg], 'index': ['second-edition'] + [c['id'] for c in pages['second-edition']['children']],
                  **{g: [p['id'] for p in sorted((p for p in pages.values() if p['group'] == g), key=lambda p: (p['order'] is None, p['order'] or 0, p['title'].lower()))]
                     for g in ('fp', 'conv')}},
        'monsters': mons,
        'links': {
            'players': L('second-edition/players-guide.md'),
            'wardens': L('second-edition/wardens-guide.md'), 'backgrounds': L('second-edition/backgrounds.md'),
            'overview': L('second-edition/players-guide/overview-and-principles.md'),
            'chargen_page': L(CC_REL),
            'core': L(CORE_REL),
            'files2e': L('second-edition/game-files.md'), 'print2e': L('second-edition/print-copies.md'),
            'chargen': L(CHARGEN_REL, 'Character Generator'),
            'site_builder': L('first-edition/tools/build-an-adventure-site.md'),
            'converting': L('first-edition/tools/converting-monsters.md'),
            'monsters_formats': L('resources/monsters-other-formats.md'),
            'relics': L('resources/more-relics.md'), 'spellbooks': L('resources/more-spellbooks.md'), 'equipment': L('resources/more-equipment.md'),
            'hirelings': L('resources/hirelings.md'), 'pregens': L('resources/pregens.md'), 'sheets': L('resources/hirelings-mounts-and-vehicles-sheets.md'),
            'summary': L('resources/rules-summary.md'), 'hexcrawls': L('resources/hexcrawls-in-cairn.md'), 'writing': L('resources/writing-modules-for-cairn.md'),
            'adventures': L('adventures.md'), 'adv_first': L('adventures/first-party.md'), 'adv_orig': L('adventures/originals.md'), 'adv_conv': L('adventures/conversions.md'),
            'hacks': L('hacks.md'), 'localization': L('localization.md'),
            'submit': L('submissions/submission-guide.md'), 'third': L('third-party.md'),
            'discord': L('discord-server.md'), 'press': L('cairn-press.md'), 'books': L('store/books.md'), 'merch': L('store/merch.md'),
            'newsletter': L('newsletter/subscribe.md', 'Newsletter'), 'app': L('official-app.md'),
            'first': L('first-edition.md'), 'srd1e': L('first-edition/cairn-srd.md'), 'faq1e': L('first-edition/frequently-asked-questions.md'),
            'tools1e': L('first-edition/tools.md'), 'barebones': L('barebones.md'),
        },
    }
    # the catalog is a view of its own, not a page: its links open it, filtered to a group
    for k, g in (('adventures', None), ('adv_first', 'first-party'), ('adv_orig', 'originals'), ('adv_conv', 'conversions')):
        data['links'][k]['href'] = '#adventures' + ('?g=' + g if g else '')
    faces = ''.join("@font-face{font-family:'Alegreya';font-weight:%s;font-style:%s;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}\n"
                    % (w, st, base64.b64encode(open(os.path.join(src, 'fonts', 'static', f), 'rb').read()).decode()) for w, st, f in FONTS)
    tpl = open(TEMPLATE, encoding='utf-8').read()
    for ph in ('/*__FONTS__*/', '/*__DATA__*/[]', '<!--__LOGO__-->', '/*__HERO__*/', *IMAGES):
        if ph not in tpl:
            die('template is missing ' + ph)
    for ph, f in IMAGES.items():
        tpl = tpl.replace(ph, 'data:image/%s;base64,' % ('png' if f.endswith('.png') else 'jpeg') + base64.b64encode(open(os.path.join(HERE, 'assets', f), 'rb').read()).decode())
    payload = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')
    open(out, 'w', encoding='utf-8').write(tpl.replace('/*__FONTS__*/', faces).replace('/*__DATA__*/[]', payload).replace('<!--__LOGO__-->', logo_svg(src))
        .replace('/*__HERO__*/', ':root { --hero-img: url(data:image/jpeg;base64,%s); }' % base64.b64encode(open(HERO, 'rb').read()).decode()))
    print('counts %s' % got, file=sys.stderr)
    print('wrote %s (%.0f KB)' % (out, os.path.getsize(out) / 1024), file=sys.stderr)
    if args.parity:
        parity(data['pages'], data['l10n'])
    if os.path.getsize(out) > 12 * 1024 * 1024:
        print('build_prototype: the page is over 12 MB', file=sys.stderr)


if __name__ == '__main__':
    main()
