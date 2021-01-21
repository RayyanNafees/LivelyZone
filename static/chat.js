$(function() {

    let main = $('main');
    let _main = document.getElementsByTagName('main');

    let count = (char, str) => [...str].filter(i => i == char).length;

    socket.on('connect', () => socket.emit('join', {}));

    socket.on('status', function(data) {
        main.append('<center><p class="status">' + data.msg + '</p></center><br>');
        main.scrollTop(main[0].scrollHeight);
    });

    socket.on('message', function(data) {

        if (data.user != localStorage.user)
            main.append(`<br><p class = "received"><span class="usr">${data.user}</span></br>${data.msg}</p><br>`);

        else
            main.append('<br><p class = "sent">' + data.msg + '</p><br>');

        main.scrollTop(main[0].scrollHeight);

    });

    function send() {
        let txt = $('#text');
        let text = txt.val();

        if (text) {
            socket.emit('text', { msg: text });

            txt.val('');
            txt.attr('rows', '1');
        }
    }

    $('#send').click(send);

    $('#text').keydown(function(e) {

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


        })
        .keyup(function(e) {
            if (e.which == 8 || e.which == 46) { // Backspace | Delete
                let n = count('\n', this.value) + 1;
                if (n < this.rows)
                    this.rows = String(n);
            }
        });

    window.onbeforeunload = function leave_room() {
        socket.emit('left', {}, function() {
            socket.disconnect();
            window.location.href = "/"; // redirect('/')
        });
    };
});