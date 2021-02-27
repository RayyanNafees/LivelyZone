$(function() { /* Modal */
    $('body').append(`
        <!-- The Modal -->
    
        <div id="myModal" class="modal" hidden>

            <!-- Modal content -->
            <div class="modal-box">
                <span class="close">&times;</span>
                <div></div>
            </div>
        </div>
        `);

    var modal = $("#myModal"); // Get the modal
    var content = $('.modal-box div'); // Get the modal box

    function alter(val, alt = null) {
        try {
            return eval(val);
        } catch (e) {
            return !alt ? val : alt;
        }
    }

    // When the user clicks the button, open the modal 
    $('[modal]').click(function() {
        content.children().remove(); // empty the content
        content.text(alter($(this).attr('mod-text'))); // add text if 'mod-text'
        content.html(alter($(this).attr('mod-html'))); // add html if 'mod-html'
        modal.fadeIn(150); // make it appear with a fading effect
    });

    // When the user clicks on <span> (x), close the modal
    $('.close').click(() => {
        modal.fadeOut(100);
        content.children().remove();
    });

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = e => e.target == document.getElementById('myModal') ?
        modal.fadeOut(100) : null;
});