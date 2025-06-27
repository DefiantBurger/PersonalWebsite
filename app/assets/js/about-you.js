"use strict";
const copyBox = document.getElementById("copy-box");
copyBox === null || copyBox === void 0 ? void 0 : copyBox.addEventListener('copy', (event) => {
    var _a;
    (_a = event.clipboardData) === null || _a === void 0 ? void 0 : _a.setData('text/plain', "Ha! I tricked you into copying and pasting this text instead!");
    event.preventDefault();
});
