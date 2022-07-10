/^author/d
/^source:/d
/^---/ { :a N; /\n---/! ba; d}