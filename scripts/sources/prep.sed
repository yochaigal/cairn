/^---/ { :a N; /\n---/! ba; d}
s/_//g
s/*//g
s/&/and/g
s/enhanced/\\emph{Enhanced}/I
s/impaired/\\emph{Impaired}/I
s/blast/\\emph{Blast}/I
s/Critical Damage/\\textbf{Critical Damage}/I
s/^- /\\item /g
11 i \\\begin{samepage}
11 i \\\begin{itemize}
11 i \\\setlength\\\itemsep{\-.5em}
$ a \\\end{itemize}
$ a \\\end{samepage}
