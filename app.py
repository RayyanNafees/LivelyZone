from flask import Flask, render_template, request, redirect, url_for, session
from flask_socketio import SocketIO, join_room, leave_room, emit
app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'secret'
app.config['SESSION_TYPE'] = 'filesystem'

socket = SocketIO(app, manage_session=False)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/join/<user>/<room>')
def link(user, room):
    session['username'] = user
    session['room'] = room
    return redirect('/chat')
    


@app.route('/chat', methods=['GET', 'POST'])
def chat():
    if request.method=='POST':  
        #Store the data in session
        session['username'] = request.form['username']
        session['room'] = request.form['room']
        
        return render_template('chat.html', session = session,
                               protcl  = 'http' if __name__=='__main__' else 'https',)
    
    elif request.method=='GET':
        
        if 'username' not in session: return redirect('/')

        else: return render_template('chat.html',
                                    session = session,
                                    protcl  = 'http' if __name__=='__main__' else 'https',
                                    )
    

@socket.on('join', namespace='/chat')
def join(message):
    room = session.get('room')
    join_room(room)
    emit('status', {'msg':  session.get('username') + ' has entered the room.'}, room=room)


@socket.on('text', namespace='/chat')
def text(message):
    room = session.get('room')
    text = message['msg'].replace('\n','<br>')
    emit('message', {'msg': text, 'user':session.get('username')}, room=room)


@socket.on('left', namespace='/chat')
def left(message):
    room = session.get('room')
    username = session.get('username')
    leave_room(room)
    session.clear()
    emit('status', {'msg': username + ' has left the room.'}, room=room)


if __name__ == '__main__':
    socket.run(app, debug=True, port=9999) 

    import webbrowser
    webbrowser.open('https://127.0.0.1:9999/')