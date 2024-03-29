from flask import Flask, render_template, request, redirect, session, escape
from flask_socketio import SocketIO, join_room, leave_room, emit

app = Flask(__name__)

app.secret_key = 'secret'

socket = SocketIO(app, manage_session=False)

local = (__name__ == '__main__')
dbserver = 'heroku'  # afolabiD, livelyzone, lively

if local:
    app.config['dbconfig'] = dict(host='127.0.0.1',
                                  port='5000',
                                  database='livelyzone',
                                  password='Manofaction.1',
                                  user="livelyzone")
elif dbserver == 'heroku':
    host = 'ec2-54-89-49-242.compute-1.amazonaws.com'
    database = 'dlt0i4hb9qsd3'
    user = 'igsjyhwpkbtug'
    port = '543'
    password = 'a44d44dd90bb4b93b13704dc8a70c5448d2e877e2b532835c50fb445262ee0dd'
    URI = f'postgres://{user}:{password}@{host}:{port}/{database}'

    app.config['dbconfig'] = dict(user=user,
                                  password=password,
                                  port=port,
                                  database=database,
                                  host=host,
                                  # URI = URI
                                  )
else:
    app.config['dbconfig'] = dict(user=dbserver,
                                  host=dbserver+'.mysql.pythonanywhere-services.com',
                                  password='Manofaction.1',
                                  database=dbserver+'$default')


@app.route('/')
def index(): return render_template('index.html')


@app.route('/logo')
def logo(): return render_template('etc/edit.html')


@app.route('/mirror')
def mirror(): return render_template('etc/mirror.html')


@app.route('/repeat')
def repeater(): return render_template('etc/repeat.html')


@app.route('/draw')
def canvas(): return render_template('etc/canvas.html')


@app.route('/emojis')
def bar():
    lis = open('static/emojis.txt').readlines()
    return render_template('setting.html', session=session, emojis_names=lis)


@app.route('/enter/<room>')
def enter(room):
    return render_template('enter.html', room=room)


@app.route('/add')  # add?user=Rayyan&room=Room
def add():
    room = request.args.get('room', 'Lively Zone')
    user = request.args.get('user', 'Someone')
    return redirect(f'/join/{user}/{room}')


@app.route('/join/<user>/<room>')
def link(user, room):
    session['username'] = user or 'Someone'
    session['room'] = room or 'Lively Zone'
    return redirect('/chat')


@app.route('/chat', methods=['GET', 'POST'])
def chat():

    if request.method == 'POST':
        # Store the data in session
        session['username'] = request.form['username']
        session['room'] = request.form['room']

    elif request.method == 'GET':
        if 'username' not in session:
            return redirect('/')

    protcl = 'http' if local else 'https'

    return render_template('chat.html', session=session,
                           protcl=protcl, )


@socket.on('join', namespace='/chat')
def join(message):
    room = session.get('room', 'Lively Zone')
    user = session.get('username', 'Someone')
    join_room(room)
    emit('status', {'msg': user + ' joined the room.'}, room=room)


@socket.on('text', namespace='/chat')
def text(message):
    room = session.get('room')
    text = escape(message['msg'])
    emit('message', {'msg': text, 'user': session.get('username')}, room=room)


@socket.on('attach', namespace='/chat')
def inform(data):
    room = session.get('room')
    emit('message', {'msg': str(data),
         'user': session.get('username')}, room=room)


@socket.on('imgsent', namespace='/chat')
def imgsend(data): emit('imgrec', {'user': session.get(
    'username'), **data}, room=session.get('room'))


@socket.on('audsent', namespace='/chat')
def audsend(data): emit('audrec', {'user': session.get(
    'username'), **data}, room=session.get('room'))


@socket.on('vidsent', namespace='/chat')
def vidsend(data): emit('vidrec', {'user': session.get(
    'username'), **data}, room=session.get('room'))


@socket.on('filesent', namespace='/chat')
def filesend(data): emit('filerec', {'user': session.get(
    'username'), **data}, room=session.get('room'))


@socket.on('left', namespace='/chat')
def left(message):
    room = session.get('room')
    username = session.get('username')

    leave_room(room)
    session.clear()
    emit('status', {'msg': username + ' left.'}, room=room)


@app.route('/try')
def testDB():
    try:
        if local:
            from mysql.connector import connect
        else:
            from psycopg2 import connect
        conn = connect(**app.config['dbconfig'])
        cursor = conn.cursor()
        return str(dir(cursor))
    except Exception as err:
        return str(err)


if __name__ == '__main__':
    socket.run(app, debug=True, port=9999)

    import webbrowser
    webbrowser.open('https://127.0.0.1:9999/')
