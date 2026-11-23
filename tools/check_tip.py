"""Megnézi, elfogadná-e a játék a tippet. Használat: python3 tools/check_tip.py KÉRDÉS-ID "tipp" """
import json, glob, re, sys, unicodedata
def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'^(a|az|the)\s+', '', s); return re.sub(r'[^a-z0-9]', '', s)
def lev(a, b):
    p = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        c = [i]
        for j, cb in enumerate(b, 1): c.append(min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (ca != cb)))
        p = c
    return p[-1]
qid, tip = sys.argv[1], sys.argv[2]
for f in glob.glob('q/*.json'):
    for q in json.load(open(f)):
        if q['id'] != qid: continue
        k = norm(tip); mx = 2 if len(k) >= 12 else 1
        allk = {norm(a): n for n, _ in q['a'] for a in n.split('|')}
        for suf in ['ok', 'ek', 'ak', 'k', 'ot', 'et', 'at', 't']:
            if k.endswith(suf) and len(k) - len(suf) >= 3 and k[:-len(suf)] in allk:
                print('ELFOGADVA (ragozott):', allk[k[:-len(suf)]].split('|')[0]); sys.exit(0)
        for n, t in q['a']:
            for a in n.split('|'):
                ka = norm(a)
                if ka == k or (len(k) >= 5 and len(ka) >= 4 and lev(k, ka) <= mx):
                    print('ELFOGADVA:', n.split('|')[0], 'tier', t); sys.exit(0)
        print('NINCS A LISTÁN', '|', q['q']); sys.exit(1)
print('ISMERETLEN KÉRDÉS-ID'); sys.exit(2)
