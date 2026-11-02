"""Cairn site redesign: the checks to run before the prototype is shared.

python3 check.py
Fails (exit 1) on what is certainly wrong: pyflakes errors, a JS syntax error, a failed build (including the build's
own EXPECT counts), or raw Markdown left in an English page. Everything else is a report of leads to look at, not
proof (NOTES.md, Checks run, lists them). The build writes to a temporary file, so the served prototype.html is left
alone; as on any build, it can still refresh assets/2e/*.webp.
"""
import ast, collections, json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, 'build_prototype.py')
TEMPLATE = os.path.join(HERE, 'prototype_template.html')
# Leaks caused by typos in the Cairn repo's own Markdown, reported every run but not failed on (fix them upstream)
UPSTREAM = {
    'adventures/conversions/neverland.md': "line 11 closes a link with ']' instead of ')'",
    'adventures/conversions/willow.md': "line 166 has an unbalanced '**'",
}
failed = []


def run(*cmd):
    p = subprocess.run(cmd, capture_output=True, text=True, cwd=HERE)
    return p.returncode, (p.stdout + p.stderr).strip()


def section(title, lines, limit=25):
    lines = list(lines)
    print('\n== %s (%d)' % (title, len(lines)))
    for line in lines[:limit]:
        print('  ' + line)
    if len(lines) > limit:
        print('  … %d more' % (len(lines) - limit))


def fail(title, lines):
    failed.append(title)
    section('FAIL ' + title, lines, limit=100)


def block(text, start):
    """The text from start to the brace that closes the first one opened after it."""
    depth, i = 0, text.index('{', start)
    for j in range(i, len(text)):
        depth += {'{': 1, '}': -1}.get(text[j], 0)
        if not depth:
            return text[start:j + 1]
    return text[start:]


def repeats(units, size, min_chars):
    """Runs of `size` normalised statements that occur more than once, as 'line, line: text'."""
    seen = collections.defaultdict(list)
    for i in range(len(units) - size + 1):
        key = ' ⏎ '.join(u for _, u in units[i:i + size])
        if len(key) >= min_chars:
            seen[key].append(units[i][0])
    return ['lines %s: %s' % (', '.join(map(str, at)), k[:140]) for k, at in seen.items() if len(at) > 1]


def python_checks():
    for name in (BUILD, __file__):
        rc, out = run(sys.executable, '-m', 'pyflakes', name)
        if 'No module named pyflakes' in out:
            fail('pyflakes', ['not installed: python3 -m pip install --user pyflakes'])
            break
        if rc:
            fail('pyflakes ' + os.path.basename(name), out.splitlines())
    rc, out = run(sys.executable, '-m', 'pylint', '--disable=all', '--score=n', '--enable=unused-import,unused-variable,'
                  'unused-argument,redefined-outer-name,redefined-builtin,too-many-branches,too-many-statements', BUILD)
    section('pylint (report only)', ['not installed: python3 -m pip install --user pylint'] if 'No module named pylint' in out else [l for l in out.splitlines() if ': ' in l])

    source = open(BUILD, encoding='utf-8').read()
    tree = ast.parse(source)
    funcs = [(n.end_lineno - n.lineno + 1, len(ast.get_source_segment(source, n)), n.name, n.lineno)
             for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
    section('build_prototype.py longest functions (lines, chars)',
            ['%4d lines %6d chars  %s (line %d)' % f for f in sorted(funcs, key=lambda f: -f[1])[:10]])
    stmts = sorted(((n.lineno, re.sub(r'\s+', ' ', ast.unparse(n))) for n in ast.walk(tree)
                    if isinstance(n, ast.stmt) and not isinstance(n, (ast.FunctionDef, ast.ClassDef, ast.If, ast.For, ast.With, ast.Try))))
    section('build_prototype.py repeated statements (3 in a row)', repeats(stmts, 3, 150))
    return source


def comment_ratio(label, lines, is_comment):
    code = [l for l in lines if l.strip()]
    comments = [l for l in code if is_comment(l.strip())]
    return '%-24s %4d of %4d non-blank lines are comments (%.0f%%)' % (label, len(comments), len(code), 100 * len(comments) / max(len(code), 1))


def template_checks(build_source, built):
    tpl = open(TEMPLATE, encoding='utf-8').read()
    css = tpl[tpl.index('<style>') + 7:tpl.index('</style>')]
    js_start = tpl.index('<script>') + 8
    js = tpl[js_start:tpl.index('</script>', js_start)]
    js_line = tpl[:js_start].count('\n') + 1
    markup = tpl.replace(css, '').replace(js, '')

    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(js)
    rc, out = run('node', '--check', f.name)
    os.unlink(f.name)
    if rc:
        fail('node --check', out.replace(f.name, 'template script').splitlines())

    names = re.findall(r'\b(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=)', js)
    unused = sorted({n for pair in names for n in pair if n and len(re.findall(r'(?<![\w$])(?:(?<=\.\.\.)|(?<!\.))%s(?![\w$])' % re.escape(n), js)) == 1})
    section('JS names declared but never used (leads)', unused)

    written = set(re.findall(r'\bid=\\?"([\w-]+)', markup + js + built)) | set(re.findall(r"\.id\s*=\s*'([\w-]+)'", js))
    looked_up = set(re.findall(r"""(?:\$\(|querySelector\()['"`]#([\w-]+)['"`]\)|getElementById\(['"`]([\w-]+)['"`]\)""", js))
    section('ids looked up but never written (leads)', sorted({i for pair in looked_up for i in pair if i} - written))

    plain_css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    preludes = [p.strip() for p in re.findall(r'([^{}]+)\{', plain_css) if not p.strip().startswith(('@', 'from', 'to')) and not p.strip()[0].isdigit()]
    selectors = re.sub(r'\[[^\]]*\]|"[^"]*"|\'[^\']*\'', '', ' '.join(preludes))
    corpus = markup + js + build_source + built
    tokens = set(re.findall(r'[\w-]+', corpus))
    dead = sorted({t for t in re.findall(r'[.#](-?[A-Za-z_][\w-]*)', selectors) if t not in tokens})
    section('CSS classes/ids that nothing writes (leads: some are built at runtime)', dead, limit=60)

    rules = re.findall(r'([^{}]+)\{([^{}]*)\}', plain_css)
    colours = ['%s → %s' % (sel.strip()[:60], ', '.join(c)) for sel, body in rules
               if ':root' not in sel for c in [re.findall(r'#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)', body)] if c]
    section('colour literals outside :root tokens', colours)
    section('!important', [sel.strip()[:80] for sel, body in rules if '!important' in body])
    bodies = collections.defaultdict(list)
    for sel, body in rules:
        decls = sorted(d.strip() for d in body.split(';') if d.strip())
        if len(decls) >= 3:
            bodies['; '.join(decls)].append(sel.strip()[:50])
    section('CSS rules with identical declarations', ['%s ⇐ %s' % (' | '.join(s), b[:90]) for b, s in bodies.items() if len(s) > 1])

    funcs = []
    for m in re.finditer(r'^\s*(?:async\s+)?function\s+([\w$]+)|^\s*(?:const|let)\s+([\w$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{', js, re.M):
        body = block(js, m.start())
        funcs.append((body.count('\n') + 1, len(body), m.group(1) or m.group(2), js_line + js[:m.start()].count('\n')))
    section('template JS longest functions (lines, chars)',
            ['%4d lines %6d chars  %s (line %d)' % f for f in sorted(funcs, key=lambda f: -f[1])[:10]])
    stmts, line = [], js_line
    for s in re.split(r'(?<=[;{}])\s*\n', js):
        if s.strip() and not s.strip().startswith('//'):
            stmts.append((line, re.sub(r'\s+', ' ', s.strip())))
        line += s.count('\n') + 1
    section('template JS repeated statements (3 in a row)', repeats(stmts, 3, 150))
    return css, js


def build_check():
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, 'prototype.html')
        rc, log = run(sys.executable, '-I', BUILD, '--out', out)
        if rc:
            fail('build', log.splitlines()[-20:])
            return ''
        leaks = [l for l in log.splitlines() if 'left in the page' in l]
        english = [(l, l.split(': ')[1]) for l in leaks if not l.startswith('translations:')]
        if any(rel not in UPSTREAM for _, rel in english):
            fail('raw Markdown in English pages', [l for l, rel in english if rel not in UPSTREAM])
        section('raw Markdown from typos in the Cairn repo (fix upstream)', ['%s: %s' % (rel, UPSTREAM[rel]) for _, rel in english if rel in UPSTREAM])
        section('raw Markdown in translations (report only: upstream text)', [l for l in leaks if l.startswith('translations:')])
        page = open(out, encoding='utf-8').read()
        data = json.JSONDecoder().raw_decode(page, page.index('const D = ') + len('const D = '))[0]
        blob = json.dumps(data, ensure_ascii=False)
        print('built %.0f KB; data %.0f KB' % (os.path.getsize(out) / 1024, len(blob) / 1024))
        return blob


def main():
    built = build_check()
    source = python_checks()
    css, js = template_checks(source, built)
    section('comment density', [
        comment_ratio('build_prototype.py', source.splitlines(), lambda l: l.startswith('#')),
        comment_ratio('template CSS', css.splitlines(), lambda l: l.startswith('/*') and l.endswith('*/')),
        comment_ratio('template JS', js.splitlines(), lambda l: l.startswith('//')),
    ])
    print('\n%s' % ('FAILED: ' + ', '.join(failed) if failed else 'passed'))
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
