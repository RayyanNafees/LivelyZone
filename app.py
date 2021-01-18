from flask import Flask, render_template, request, redirect, url_for, session
from flask_socketio import SocketIO, join_room, leave_room, emit
 
app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'secret'
app.config['SESSION_TYPE'] = 'filesystem'

socketio = SocketIO(app, manage_session=False)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/hi')
def hi(): return "<h1 style='font-family:comic sans, comic sans ms'>Twalle oo baba!</h1>"

@app.route('/chat', methods=['GET', 'POST'])
def chat():
    if request.method=='POST':
        username = request.form['username']
        room = request.form['room']
        
        #Store the data in session
        session['username'] = username
        session['room'] = room
        
        return render_template('chat.html', session = session)
    
    else:
        if session.get('username') is not None:
            return render_template('chat.html', session = session)
        else:
            return redirect('/')


@socketio.on('join', namespace='/chat')
def join(message):
    room = session.get('room')
    join_room(room)
    emit('status', {'msg':  session.get('username') + ' has entered the room.'}, room=room)


@socketio.on('text', namespace='/chat')
def text(message):
    room = session.get('room')
    emit('message', {'msg': message['msg'], 'user':session.get('username')}, room=room)


@socketio.on('left', namespace='/chat')
def left(message):
    room = session.get('room')
    username = session.get('username')
    leave_room(room)
    session.clear()
    emit('status', {'msg': username + ' has left the room.'}, room=room)


if __name__ == '__main__':
    socketio.run(app, port=9999) 

    import webbrowser
    webbrowser.open('https://127.0.0.1:9999/')