/^---/ { :a N; /\n---/! ba; d}
s/_\([^_]\+\)_/\\emph{\1}/g
s/\*\*\([^*]\+\)\*\*/\\textbf{\1}/g
s/&/and/g
s/^- /\\item /g
11 i \\\begin{samepage}
11 i \\\begin{itemize}
11 i \\\setlength\\\itemsep{\-.5em}
$ a \\\end{itemize}
$ a \\\end{samepage}
