//


$('#img').click(() => {

    let _img = $('<input type="file" accept="image/*" />'); //  multiple="true"
    let filter = 'none'; // change after photo editor

    _img.click();
    if (_img[0].files) {
        let file = _img[0].files[0];
        let reader = new FileReader().readAsDataURL(file);
        reader.onload = () => socket.emit('imgsent', {
            base64: _img[0].files[0],
            filter: filter
        });
    }
});

$('#vid').click(() => {

    let _vid = $('<input type="file" accept="video/*" />'); //  multiple="true"
    let filter = 'none'; // change after photo editor

    _vid.click();
    if (_vid[0].files) {
        let file = _vid[0].files[0];
        let reader = new FileReader().readAsDataURL(file);
        reader.onload = () => socket.emit('imgsent', {
            base64: reader.result,
            filter: filter
        });
    }
});

$('#mic').click(() => {

    let _aud = $('<input type="file" accept="audio/*" />'); // multiple="true"

    _aud.click();
    if (_aud[0].files) {
        let file = _aud[0].files[0];
        let reader = new FileReader().readAsDataURL(file);
        reader.onload = () => socket.emit('imgsent', {
            base64: reader.result,
            // add a size/duration thingy
        });
    }
});

$('#filer').click(() => {

    let _inp = $('<input type="file" accept="file/*" />'); //  multiple="true" 
    let filter = 'none'; // change after photo editor

    _inp.click();
    if (_inp[0].files) {
        let file = _inp[0].files[0];
        let reader = new FileReader().readAsDataURL(file);
        reader.onload = () => socket.emit('imgsent', {
            base64: reader.result,
            name: _inp.val()
        });
    }
});


socket.on('imgrec', file => Mmsg(file, `<img src="${file.base64}" style="filter:${file.filter}" />`));
socket.on('vidrec', file => Mmsg(file, `<video controls style="filter:${file.filter}">
<source src="${file.base64}" /> Can't play video </video>`));

socket.on('audrec', file => Mmsg(file, `<audio controls src="${file.base64}">Can't play audio</audio>`));
socket.on('filerec', file => Mmsg(file, `<a id="file" href="${file.base64}" download="${file.name}">${file.name}</a>`));


function Mmsg(data, child) {
    if (data.user != localStorage.user) {

        msgbox = $(`<p class="received">${child}</p>`);

        if (document.hidden)
            new Notification(data.user, { body: data.child });

    } else
        msgbox = $(`<p class="sent">${child}</p>`);


    base.before(msgbox); // add it to child element
    msgwin.scrollTop(msgwin[0].scrollHeight);
}