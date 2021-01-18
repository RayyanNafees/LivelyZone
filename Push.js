(function(window) {
    var DOUBLE_CLICK_DELAY = 550;
    var OnlineNotifier = (function() {
        var LOG_LEVEL = 01;
        var POLL_TIMEOUT = 1E3;
        var MIN_TIMEOUT = 60E3;
        var MIN_TIMEOUT_TYPING = 5E3
        var DEBUG_CHECK_ALL = false;
        var DEBUG_CHECK_ONLINE = false;
        var DEBUG_CHECK_TYPING = false;
        var DEBUG_CHECK_COUNT = 27 * 3
        var DEBUG_TIMEOUT = 1E3
        var DEBUG_CHANCE = .33
        var NOTIFY_SUBSCRIBE = true;


        var debug = DEBUG_CHECK_ALL || DEBUG_CHECK_ONLINE || DEBUG_CHECK_TYPING

        if (debug) {
            POLL_TIMEOUT = DEBUG_TIMEOUT
        }

        var chats = Store.Chat.models.slice();

        var msg = {
            online: "Online",
            offline: "Offline",
            typing: "Typing...",
            unsubscribing: "...unsubscribing %s.",
            subscribing: "... subscribing %s.",
            check: "checking state: %s [%s].",
            handle: "... check sucessfull. calling handler.",
            look: "looking for people online... found %d.",
            timeout: "scheduling next check in %dms.",
            reset: "reseted",
            started: "started",
            state: "Last seen: %0",
            subscribed: "enabled notifications",
            unsubscribed: "disabled notifications",
            ppurl: "https://dyn.web.whatsapp.com/pp?t=s&u=%user%&i=%tag%"
        }

        var debug_last = "offline";
        var debug_time = 0
        var debug_state = 0;
        var checks = {
            online: function(contact, name) {
                if (DEBUG_CHECK_ONLINE) {
                    return debug_state === OnlineNotifier.observe.online;
                }
                return contact.presence._values.isOnline;
            },
            typing: function(contact, name) {
                if (DEBUG_CHECK_TYPING) {
                    return debug_state === OnlineNotifier.observe.typing;
                }

                return contact._values.typing || DEBUG_CHECK_TYPING;
            },
            offline: function(contact, name) {
                return !checks.online.call(this, contact, name) && !checks.typing.call(this, contact, name);
            }
        }

        var util = {
            extract: function(keys, src, trg) {
                if (!Array.isArray(keys)) keys = Object.keys(keys);
                trg = trg || {};
                return keys.reduce(function(trg, key) {
                    trg[key] = src[key];
                    return trg;
                }, trg);
            }
        }
        var handler = {
            online: function(contact, name) {
                log(10, "Handler", "online");
                var state = this.getState(name);
                if (state.changed || +new Date - MIN_TIMEOUT > contact._lastnotification) {
                    log(10, "Handler", "changed", state.changed);
                    notify(contact, "online");
                }
            },
            typing: function(contact, name) {
                var state = this.getState(name);
                if (state.changed || +new Date - MIN_TIMEOUT_TYPING > contact._lastnotification) {
                    notify(contact, "typing");
                }
            },
            offline: function(contact, name) {
                log(10, "Handler", "offline");
                var state = this.getState(name);
                if (state.state === "online" || state.changed)
                    notify(contact, "offline");

            }
        }
        var OnlineNotifier = function(startMonitor) {
            this.watch = OnlineNotifier.observe.online + OnlineNotifier.observe.typing;
            this.subscribed = [];
            this.unsubscribed = chats.slice();
            this._timeout = 0;
            this._lastnotification = +new Date - MIN_TIMEOUT;
            this._states = {};

            this.load();
            this.monitor(startMonitor);
            notify(0, "started");
        };
        OnlineNotifier._notifications = {};
        OnlineNotifier.storageKey = "mon";
        OnlineNotifier.LOG_LEVEL = LOG_LEVEL;
        OnlineNotifier.prototype.timeout = POLL_TIMEOUT;
        OnlineNotifier.observe = {
            offline: 0,
            online: 1,
            typing: 2,

        };

        OnlineNotifier.contacts = {
            byName: function() {
                return chats.reduce(function(a, b) {
                    var values = b._values;
                    var name = values.name;
                    a[name] = b;
                    return a;
                }, {});
            },
            byId: function() {
                return chats.reduce(function(a, b) {
                    var values = b._values;
                    var name = values.id;
                    a[name] = b;
                    return a;
                }, {});
            },
            filter: {
                name: filter.bind(0, "name"),
                id: filter.bind(0, "id")
            },
            gen: {
                ppurl: function(contact, cb) {
                    var id = contact._values.id;
                    log(9, "Generating Profile Picture Url")
                    Store.Wap.profilePicFind("ProfilePicThumb", id).then(function(data) {
                        var tag = data.tag;
                        var url = msg.ppurl.replace("%user%", id).replace("%tag%", tag);
                        cb(url, tag)
                    })
                }
            }

        }

        function notify(contact, status) {
            if (!contact && status) {
                return new Notification("OnlineNotifier", { tag: "system", body: msg[status] });
            }
            if (!contact._lastnotification) contact._lastnotification = 0;
            //if (+new Date - MIN_TIMEOUT > contact._lastnotification) {
            var n = OnlineNotifier.contacts.filter.name(contact);
            m = msg[status]
            for (var i = 2; i < arguments.length; i++) {
                m = m.replace("%" + (i - 2), arguments[i])
            }
            log(9, "Preparing Notification for ", n)
            OnlineNotifier.contacts.gen.ppurl(contact, function(url, tag) {
                    //tag = status + "-" + tag;
                    contact._lastnotification = +new Date
                    log(10, "Displaying notification", tag);
                    OnlineNotifier._notifications[n] = new Notification(n, {
                        body: m,
                        icon: url,
                        tag: tag
                    });
                })
                //}

        }



        function log(lvl) {
            if (OnlineNotifier.LOG_LEVEL >= lvl) {
                console.log.apply(console, [].slice.call(arguments, 1));
            }
        }

        function filter(attr, contacts) {
            if (!Array.isArray(contacts)) { contacts = [contacts] }
            return contacts.map(function(a) {
                return a._values[attr];
            })
        }


        OnlineNotifier.prototype.getOnline = function() {
            if (DEBUG_CHECK_ONLINE || (this.watched & OnlineNotifier.observe.offline) == OnlineNotifier.observe.offline) {
                return this.subscribed;
            }
            return this.subscribed.filter(checks.online);
        }


        OnlineNotifier.prototype.monitor = function mon(subscribeTo) {
            this.save();
            var that = this;
            if (subscribeTo) {
                this.subscribe(subscribeTo)
            }
            var online = this.getOnline();
            var state = "";
            var oldstate = "";
            var newstate;
            log(4, msg.look, online.length);
            for (var key in OnlineNotifier.observe) {
                var val = OnlineNotifier.observe[key];
                var now = +new Date;
                if ((this.watch & val) === val)
                    for (var i = 0; i < online.length; i++) {
                        var contact = online[i];
                        var name = OnlineNotifier.contacts.filter.name(contact)[0]
                        log(6, msg.check, key, name);
                        if (checks[key].call(this, contact, name) || DEBUG_CHECK_ALL) {
                            log(7, msg.handle, key, handler[key])
                            state = OnlineNotifier.observe[key];
                            oldstate = this.getState(name).state;
                            newstate = { state: state, t: now, changed: state !== oldstate, id: contact._values.id };
                            newstate[state] = now

                            util.extract(newstate, newstate, this.getState(name))
                            handler[key] && handler[key].call(this, contact, name);
                            log(10, "new state", state, oldstate, this.getState(name));
                        }
                    }
            }

            log(9, "check debug", debug_state, debug_time)
            if ((debug_time % DEBUG_CHECK_COUNT) === 0) {
                debug_state = (debug_state + 1) % 3
            }
            debug_time++;

            if (this._timeout == -1) {
                this._timeout = 0;
                this.save()
            } else {
                this._timeout = setTimeout(function() {
                    mon.call(that);
                }, this.timeout)
                this.save()
                log(7, msg["timeout"], this.timeout, this._timeout)
            }

        }

        OnlineNotifier.prototype.showStates = function() {
            for (var key in this._states) {
                var state = this.getState(key);
                notify(this.getChatById(state.id), "state", state[1])
            }
        }
        OnlineNotifier.prototype.subscribe = function(contacts, reverse) {
            var byName;
            var srcTrg = [this.unsubscribed, this.subscribed];
            var srcInd = 0 + ~~reverse;
            var msgPre = reverse ? "un" : ""
            var wasRunning = this.isRunning();
            if (wasRunning) {
                log(4, "pausing");
                this.cancel();
            }
            if (!Array.isArray(contacts)) {
                return this.subscribe(typeof contacts === "string" ? [contacts] : [], reverse)
            } else if (typeof contacts[0] == "string") {
                byName = OnlineNotifier.contacts.byName();
                byId = OnlineNotifier.contacts.byId();
                contacts = contacts.map(function(a) {
                    if (byId.hasOwnProperty(a)) {
                        return byId[a]
                    } else if (byName.hasOwnProperty(a)) {
                        return byName[a];
                    }

                });
            }

            for (var i = 0; i < contacts.length; i++) {
                var contact = contacts[i]
                var ind = srcTrg[srcInd].indexOf(contact);
                srcTrg[(srcInd + 1) % 2].push(srcTrg[srcInd].splice(ind, 1)[0])
                log(5, msg[msgPre + "subscribing"], contact._values.name)
                if (NOTIFY_SUBSCRIBE) {
                    notify(contact, msgPre + "subscribed")
                }
            }
            if (wasRunning) {
                log(4, "resuming")
                this.monitor();
            }
            log(3, msg[msgPre + "subscribed"], OnlineNotifier.contacts.filter.name(contacts))

        }

        OnlineNotifier.prototype.unsubscribe = function(contacts) {
            //var s="subscribed";
            //var u="un"+s;


            //swap (this, s, u);
            this.subscribe(contacts, true);

        }
        OnlineNotifier.prototype.isRunning = function() {
            return this._timeout > 0
        }
        OnlineNotifier.prototype.cancel = function() {

            clearTimeout(this._timeout);
            this._timeout = -1
        }

        OnlineNotifier.prototype.getOptions = function() {
            var opt = util.extract(["timeout", "_timeout"], this);
            opt._subscribed = this.subscribed.map(function(a) {
                return a._values.name;
            });
            return opt;
        }
        OnlineNotifier.prototype.subscribeAll = function() {
            return this.subscribe(this.unsubscribed);
        }

        OnlineNotifier.prototype.getState = function(name) {
            if (!this._states[name])
                this._states[name] = { state: -1, t: +new Date, changed: true }
            return this._states[name]
        }


        OnlineNotifier.prototype.save = function() {
            var opt = this.getOptions();
            localStorage[OnlineNotifier.storageKey] = JSON.stringify(opt);
        }
        OnlineNotifier.prototype.load = function() {
            var options;
            try {
                options = JSON.parse(localStorage[OnlineNotifier.storageKey]);
            } catch (e) {
                options = {}
            }
            util.extract(options, options, this);
            this.subscribe(options._subscribed);
        }
        OnlineNotifier.e = util.extract;

        OnlineNotifier.prototype.onBookmarkTriggered = function(open, dblclick) {
            delete window.monTriggerTimeout
            var active = Store.Chat.active();
            var chat;


            if (open) {
                return;
            }
            if (dblclick) {
                notify(0, "dbc")
                return;
            }
            if (typeof active == "undefined") {
                this.reset();
            } else {
                chat = this.getChatById(active);
                if (!~active.indexOf(this.subscribed)) {
                    this.unsubscribe(active);

                } else {
                    this.subscribe(active);
                }
            }
            setTimeout(this.monitor.bind(this), 0);
        }
        OnlineNotifier.prototype.getChatById = function(id) {
            return OnlineNotifier.contacts.byId()[id]
        }
        OnlineNotifier.prototype.reset = function() {
            notify(0, "reset")
            delete localStorage[OnlineNotifier.storageKey];
        }
        return OnlineNotifier


    })()

    if (!window.mon) {
        window.mon = new OnlineNotifier();
        //window.mon.onBookmarkTriggered (true,false);
    } else if (window.monTriggerTimeout) {
        clearTimeout(window.monTriggerTimeout);
        window.mon.onBookmarkTriggered(false, true);
    } else if (!window.monTriggerTimeout) {
        window.monTriggerTimeout = window.setTimeout(window.mon.onBookmarkTriggered.bind(window.mon, false, false), DOUBLE_CLICK_DELAY);
    }
})(window);