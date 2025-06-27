const copyBox = document.getElementById("copy-box")

copyBox?.addEventListener('copy', (event) => {
    event.clipboardData?.setData('text/plain', "Ha! I tricked you into copying and pasting this text instead!");
    event.preventDefault();
})