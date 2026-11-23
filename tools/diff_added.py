"""Kiírja, mi került hozzá a /home/claude/base állapothoz képest. Használat: python3 tools/diff_added.py geo his ..."""
import json, sys, os
out = []
for f in sys.argv[1:]:
    base = {q['id']: q for q in json.load(open(f'/home/claude/base/{f}.json'))}
    for q in json.load(open(f'q/{f}.json')):
        b = base.get(q['id'], {'a': []})
        bkeys = {a.lower() for n, _ in b['a'] for a in n.split('|')}
        bmain = {n.split('|')[0]: n for n, _ in b['a']}
        new, newal = [], []
        for n, t in q['a']:
            al = n.split('|')
            if not any(a.lower() in bkeys for a in al): new.append(f'{n} ({t})')
            else:
                extra = [a for a in al if a.lower() not in bkeys]
                if extra: newal.append(f"{al[0]} += {'|'.join(extra)}")
        out.append(f"## {q['id']} – {q['q']}" + (f" [hint: {q['hint']}]" if q.get('hint') else '') + f"\nÚJ VÁLASZOK ({len(new)}): " + '; '.join(new) + (f"\nÚJ ALIASOK: " + '; '.join(newal) if newal else '') + '\n')
print('\n'.join(out))
