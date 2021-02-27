// var count = (char, str) => [...str].filter(i => i == char).length;
// var mob = ('orientation' in window);
// var getcss = (query, style) => getComputedStyle(document.querySelector(query)).getPropertyValue(style);

// var msgwin = $('#messages'); // get msg window
// var base = $('#base');


$('#img').click(() => {

    _img = $('<input type="file" accept="image/*" multiple="true" />');
    _img.click();

    if (_img[0].files)
        socket.emit('imgsent', _img[0].files[0]);
});

socket.on('imgrec', img => base.before(`<img src=${URL.createObjectURL(img)} >`));