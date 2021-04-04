<script>
var xa = document.getElementById('expAll');
xa.addEventListener('click', function(e) {

  e.target.classList.toggle('exp');
  e.target.classList.toggle('col');

  var details = document.querySelectorAll('details');

  Array.from(details).forEach(function(obj, idx) {
    if (e.target.classList.contains('exp')) {
      obj.open = false;
    } else {
      obj.open = true;
    }
  });
}, false);
</script>
