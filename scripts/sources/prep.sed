/^---/ { :a N; /\n---/! ba; d}
s/_\([^_]*\)_/\\textit{\1}/g
s/*//g
s/&/and/g
s/blast/\\emph{Blast}/I
s/Critical Damage/\\textbf{Critical Damage}/I
s/^- /\\item /g
11 i \\begin{samepage}
11 i \\begin{itemize}
11 i \\setlength\\itemsep{-0.5em}
$ a \\end{itemize}
$ a \\end{samepage}
s/^\\(impaired\\)/Impaired/I
s/^\\(enhanced\\)/Enhanced/I
s/\\. \\(impaired\\)/. Impaired/I
s/\\. \\(enhanced\\)/. Enhanced/I