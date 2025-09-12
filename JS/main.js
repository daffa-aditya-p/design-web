  document.getElementById("pesanForm").addEventListener("submit", function(e) {
    e.preventDefault(); // biar gak reload

    let nama = document.getElementById("Nama-user").value;
    let pesan = document.getElementById("Isi-pesan").value;

    // bikin link mailto
    let subject = "Pesan dari " + nama;
    let body = pesan;

    window.location.href = `mailto:alif.atras3105@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  // Cursor

const cursor = document.querySelector('.custom-cursor');
document.addEventListener('mousemove', e => {
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
});
