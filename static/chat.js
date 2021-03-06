//

socket.on('connect', () => socket.emit('join', {}));

socket.on('status', function(data) {
    base.before('<p class="status">' + data.msg + '</p>');
    msgwin.scrollTop(msgwin[0].scrollHeight);
});


socket.on('message', function(data) {

    let msg = data.msg.replace(/\n/g, '<br>');

    if (data.user != localStorage.user) {

        msgbox = $(`<p class="received">${msg}</p>`);

        if (document.hidden)
            new Notification(data.user, { body: data.msg });

    } else
        msgbox = $(`<p class="sent">${msg}</p>`);


    base.before(msgbox); // add it to msg element
    msgwin.scrollTop(msgwin[0].scrollHeight);
});


function leave_room() {
    socket.emit('left', {}, function() {
        socket.disconnect();
        location.href = "/"; // redirect('/')
    });
}

window.onbeforeunload = leave_room;
$('header h3')[0].onclick = leave_room;


// document.onvisibilitychange = function() {};

/*______________ jQuery methods ________*/

$(function() {

    function send() {
        let txt = $('#text');
        let text = txt.val().trim();

        if (text) {
            socket.emit('text', { msg: text });

            txt.val('');
            txt.attr('rows', '1');
        }
    }

    $('#send').click(send);

    $('#text')
        .keydown(function(e) {

            if (e.which == 13) {

                if (this.rows < 4)
                    this.rows = String(++this.rows);

                if (e.shiftKey) { // Shift + Enter
                    e.preventDefault();
                    send();
                }

            }
            if (e.which == 9) { // Tab
                e.preventDefault();
                this.value += '    ';
            }

            if (e.which == 8 || e.which == 46) { // Backspace | Delete
                let n = count('\n', this.value) + 1;
                if (n < this.rows)
                    this.rows = String(n);
            }

            if ([32, 9, 10, 13, 11, 12].includes(e.which)) { // on whitespace type
                if (!$('#text').val()) // on empty textarea
                    e.preventDefault();
            }

        })
        .keyup(function(e) {});

    $('#messages').height(window.innerHeight - $('footer').height());

    if (mob) { $('body').css({ margin: 0, padding: 0 }); }

    $('#plus').click(function() {

        let txt = 'https://preming.herokuapp.com/enter/' + localStorage.room;

        let copyText = $('<div hidden>' + txt + '</div>');

        copyText.select();
        copyText.setSelectionRange(0, 99999); /* For mobile devices */

        /* Copy the text inside the text field */
        document.execCommand("copy");

        /* Alert the copied text */
        alert("link Copied: " + copyText);
    });

    $('#arrows').click(function() {
        let img = $('#img-att');
        img.click();
        if (img.val()) {
            let form = new FormData();
            form.append('attch', img[0].files[0]);
            socket.emit('attach', { 'file': form }, () => alert('sent successfuly'));
        }
    });
});


/* Text Copy function */

// function myFunction() {
//     /* Get the text field */
//     var copyText = document.getElementById("myInput");

//     /* Select the text field */
//     copyText.select();
//     copyText.setSelectionRange(0, 99999); /* For mobile devices */

//     /* Copy the text inside the text field */
//     document.execCommand("copy");

//     /* Alert the copied text */
//     alert("Copied the text: " + copyText.value);
// }