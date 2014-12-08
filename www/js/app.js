// This uses require.js to structure javascript:
// http://requirejs.org/docs/api.html#define
// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
var requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
    };
})();

define(function (require) {
    //var brick = require('brick');
    app.initialize();
    var $ = require('zepto');
    require('ICanHaz');
    require('parse-1.2.12.min');
    var storage = require('./storage');
        
    Parse.initialize("peGqQDSwWg42S6l5S2UjqwiJO3IP5s3jk9DdodcR", "Nf3T4JPMaIxNEdOjHkMPB7oI3AUDBthkylJg04li");
    Parse.Analytics.track('usage', {action: "load"});

    //load fb
    var _user;
    window.fbAsyncInit = function () {
        console.log("fb loaded");
        // init the FB JS SDK
        Parse.FacebookUtils.init({
            appId: '629913910363335', // App ID from the app dashboard
            channelUrl: 'http://www.rourevell.com/channel.php', // Channel file for x-domain comms
            status: true, // Check Facebook Login status
            xfbml: true, // Look for social plugins on the page
            cookie: true
        });

        var currentUser;
            Parse.FacebookUtils.logIn("email" /*,publish_stream,read_friendlists*/ , {
                success: function (user) {
                    currentUser = user;
                    if (!user.existed()) {
                        console.log("User signed up and logged in through Facebook!");
                        // We make a graph request
                        FB.api('/me', function (response) {
                            if (!response.error) {
                                // We save the data on the Parse user
                                user.set("displayName", response.name);
                                user.set("email", response.email);
                                storage.saveUser(user);
                                user.save(null, {
                                    success: function (user) {
                                        // And finally save the new score

                                    },
                                    error: function (user, error) {
                                        console.log("Oops, something went wrong saving your name.");
                                    }
                                });
                            } else {
                                console.log("Oops something went wrong with facebook.");
                            }
                        });
                    } else {
                        console.log("User logged in through Facebook!");
                    }
                },
                error: function (user, error) {
                    console.log("User cancelled the Facebook login or did not fully authorize.");
                    currentUser = storage.getUser();
                    if(currentUser.get('displayName')==null){
                        var name = window.prompt("Enter your name: ","");
                        while(name==null || name.length<=3) {
                            name = window.prompt("Enter your name (the name has to be at least 4 characters long): ",name);
                        }
                        currentUser.set('displayName',name);
                        currentUser.set('username',name);
                        currentUser.set('password',name);
                        currentUser.save(null, {
                                    success: function (user) {

                                    },
                                    error: function (user, error) {
                                        console.log("Oops, something went wrong saving your name.");
                                    }
                        });
                        storage.saveUser(currentUser);
                    }
                }
            });

    };

    // Load the SDK asynchronously
    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/all.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
    var input = require('./input');

    //require('receiptverifier');
    //require('./install-button');

    //load templates
    ich.grabTemplates();

    var toggle = function () {
        $('#flipbox').get(0).toggle();
        reset();
        game.started = !game.started;
    };

    $('#single').click(function(){
        toggle();
        Parse.Analytics.track('usage', {action: "stats",code:"singleplayer"});
    });
    $('#multi').click(function(){
        Parse.Analytics.track('usage', {action: "stats",code:"multiplayer"});
    });
    $('#back').click(toggle);
    $('#restart').click(function () {
        reset();
        game.started = true;
        Parse.Analytics.track('usage', {action: "stats",code:"restart"});
    });



    // Create the canvas
    var zcanvas = $("#canvas");
    var canvas = zcanvas.get(0);
    var ctx = canvas.getContext("2d");

    var DEBUG = false;

    var TOTAL_WIDTH;
    var TOTAL_HEIGHT;
    var START_SPEED = 0.08;
    var START_ANGULAR_SPEED = 0.0042;
    var SIZE = 12;
    var FRUIT_FADE = 1000;
    var NEXT_OBJECT_DELAY = 5000;

    var resFunct = function () {
        canvas.width = zcanvas.parent().width();
        canvas.height = zcanvas.parent().height();
        TOTAL_HEIGHT = canvas.height;
        TOTAL_WIDTH = canvas.height;
    };
    resFunct();
    $(window).resize(resFunct);


    var game = {};
    var Player = function (sx, sy, sdir) {
        this.sx = sx | 0;
        this.sy = sy | 0;
        this.cx = 0;
        this.cy = 0;
        this.sdir = sdir | 0;
        this.p = [{
            dir: 0
        }];
        this.s = [];
        this.n = 1;
        this.changeDir();
        this.speed = START_SPEED;
        this.angularSpeed = START_ANGULAR_SPEED;
        this.size = SIZE;
        this.points = 0;
        this.colorA = "";
        this.colorB = "";
    }

    Player.prototype.reset = function () {

        this.p = [{
            dir: 0
        }, {
            dir: 0
        }, {
            dir: 0
        }, {
            dir: 0
        }];
        this.n = 4;
        this.cx = 0;
        this.cy = 0;
        this.s = [];
        this.changeDir();
        this.speed = START_SPEED;
        this.angularSpeed = START_ANGULAR_SPEED;
        this.size = SIZE;
        this.points = 0;
    }
    Player.prototype.changeDir = function () {
        this.s.push({
            x: this.cx,
            y: this.cy
        });
    }
    Player.prototype.x = function () {
        return this.cx + this.sx;
    }
    Player.prototype.y = function () {
        return this.cy + this.sy;
    }
    Player.prototype.addBall = function (n) {
        if (n > 0)
            for (var i = 0; i < n; i++) {
                this.p.push({
                    dir: this.p[this.p.length - 1].dir
                });
                this.n++;
            }
        if (n < 0 && this.n + n >= 3)
            for (var i = 0; i < -n; i++) {
                this.p.pop();
                this.n--;
            }
    }
    Player.prototype.speedUp = function () {
        this.speed += START_SPEED * 0.20;
        this.speed = Math.min(this.speed, START_SPEED * 5);
    }
    Player.prototype.speedDown = function () {
        this.speed *= 0.8;
        this.speed = Math.max(this.speed, START_SPEED * 0.2);
    }
    Player.prototype.angularSpeedUp = function () {
        this.angularSpeed += START_ANGULAR_SPEED * 0.2;
        this.angularSpeed = Math.min(this.angularSpeed, START_ANGULAR_SPEED * 5);
    }
    Player.prototype.angularSpeedDown = function () {
        this.angularSpeed *= 0.8;
        this.angularSpeed = Math.max(this.angularSpeed, START_ANGULAR_SPEED * 0.2);
    }
    var toShowPoints = 0;
    var toShowTime = 0;
    Player.prototype.addPoints = function (points, showPoints) {
        this.points += points;
        if (this.points < 0) this.points = 0;
        if (showPoints > 0) {
            toShowPoints = showPoints;
            toShowTime = 1000;
        }
    }

    // The player's state
    game.players = [];
    var player = new Player(60, 60, 20);
    game.players.push(player);
    game.player = 0;
    game.level = 0;

    game.fruits = {};
    game.fruits.SPEEDUP = {
        action: function (player) {
            player.speedUp();
        },
        logo: "img/fruits/strawberry.png",
        prob: 20,
        size: 28,
        points: 200,
        message: "+1 speed",
        messageColor: "good"
    }
    game.fruits.SPEEDDOWN = {
        action: function (player) {
            player.speedDown();
        },
        logo: "img/fruits/lemon.png",
        prob: 10,
        size: 28,
        points: 400,
        message: "-1 speed",
        messageColor: "bad"
    }
    game.fruits.ANGULARSPEEDUP = {
        action: function (player) {
            player.angularSpeedUp();
        },
        logo: "img/fruits/grapes.png",
        prob: 20,
        size: 28,
        points: 100,
        message: "+1 turn",
        messageColor: "good"
    }
    game.fruits.ANGULARSPEEDDOWN = {
        action: function (player) {
            player.angularSpeedDown();
        },
        logo: "img/fruits/kiwi.png",
        prob: 10,
        size: 28,
        points: 200,
        message: "-1 turn",
        messageColor: "bad"
    }
    game.fruits.MAKEBIG = {
        action: function (player) {
            player.addBall(1);
        },
        logo: "img/fruits/cherries.png",
        prob: 50,
        size: 28,
        points: 600,
        message: "+1 size",
        messageColor: "good"
    }
    game.fruits.MAKESMALL = {
        action: function (player) {
            player.addBall(-1);
        },
        logo: "img/fruits/lime.png",
        prob: 10,
        size: 28,
        points: 200,
        message: "-1 size",
        messageColor: "bad"
    }

    var maps = [{
        edges: [
            [0, 0, true, ""],
            [450, 0, true],
            [450, 150, false],
            [300, 150, true],
            [150, 150, true],
            [150, 300, true],
            [300, 300, true],
            [300, 150, false],
            [450, 150, true],
            [450, 450, true],
            [0, 450, true]
        ],
        borders: {
            a: {
                x: 0,
                y: 0
            },
            b: {
                x: 450,
                y: 450
            }
        },
        borderColor: 'rgb(1,30,1)',
        borderLineWidth: 1,
        constant: [], //needed for precalculations
        multiple: [], //needed for precalculations
        fruits: [], // store initial fruits
        backgroundImage: "",
        parallaxImage: "",
        boardImage: ""
    }];
    game.maps = maps;

    function precalc_collisions(fullmap) {
        var map = fullmap.edges;
        fullmap.constant = [];
        var constant = fullmap.constant;
        fullmap.multiple = [];
        var multiple = fullmap.multiple;
        var polySides = map.length;
        var i, j = polySides - 1;

        for (i = 0; i < polySides; i++) {
            if (map[j][1] == map[i][1]) {
                constant[i] = map[i][0];
                multiple[i] = 0;
            } else {
                constant[i] = map[i][0] - (map[i][1] * map[j][0]) / (map[j][1] - map[i][1]) + (map[i][1] * map[i][0]) / (map[j][1] - map[i][1]);
                multiple[i] = (map[j][0] - map[i][0]) / (map[j][1] - map[i][1]);
            }
            j = i;
        }
    }

    for (var i = 0; i < maps.length; i++) {
        precalc_collisions(maps[i])
    }

    function pointInPolygon(fullmap, x, y) {
        var map = fullmap.edges;
        var constant = fullmap.constant;
        var multiple = fullmap.multiple;
        var polySides = map.length;
        var i, j = polySides - 1;
        var oddNodes = 0;

        for (i = 0; i < polySides; i++) {
            if ((map[i][1] < y && map[j][1] >= y || map[j][1] < y && map[i][1] >= y)) {
                oddNodes ^= (y * multiple[i] + constant[i] < x);
            }
            j = i;
        }

        return oddNodes;
    }

    // Reset game to original state

    function reset() {
        console.log("RESET");
        player.reset();
        game.maps[game.level].fruits = [];
    };

    // Pause and unpause

    function pause() {
        console.log("PAUSE");
        running = false;
    }

    function unpause() {
        console.log("UNPAUSE");
        running = true;
        then = Date.now();
        main();
    }

    // Update game objects
    sumDt = 0;
    nextObjectDt = NEXT_OBJECT_DELAY;

    var collision;
    game.loaded = false;
    game.started = false;

    var turnright = false;
    var turnleft = false;

    function update(dt) {
        if (game.started && game.loaded) {

            if (input.isDown('E')) {
                DEBUG = !DEBUG;
            }

            var dirChange = false;
            var player = game.players[game.player];

            player.addPoints(dt * player.speed * 2 / START_SPEED * Math.sqrt(player.size) / 1000, 0);

            if (input.isDown('LEFT') || input.isDown('A') || input.isDown('Z') || input.isDown('TOUCH_LEFT')) {
                if (!turnleft) {
                    $('.controls .turnleft').animate({
                        opacity: 1
                    }, 100);
                    turnleft = true;
                }
                player.p[0].dir -= dt * player.angularSpeed;
                dirChange = true;
            } else {
                if (turnleft) {
                    $('.controls .turnleft').animate({
                        opacity: 0.75
                    }, 100);
                    turnleft = false;
                }
            }

            if (input.isDown('RIGHT') || input.isDown('D') || input.isDown('M') || input.isDown('X') || input.isDown('TOUCH_RIGHT')) {
                if (!turnright) {
                    $('.controls .turnright').animate({
                        opacity: 1
                    }, 100);
                    turnright = true;
                }
                player.p[0].dir += dt * player.angularSpeed;
                dirChange = true;
            } else {
                if (turnright) {
                    $('.controls .turnright').animate({
                        opacity: 0.75
                    }, 100);
                    turnright = false;
                }
            }

            //player
            var dx = dt * player.speed * Math.cos(player.p[0].dir);
            var dy = dt * player.speed * Math.sin(player.p[0].dir)

            player.cx += dx;
            player.cy += dy;
            player.p[0].x = player.cx;
            player.p[0].y = player.cy;

            if (dirChange) player.changeDir();

            var j = player.s.length - 1;
            for (var i = 1; i < player.p.length; i++) {
                var left = SIZE * 1.5;
                var cx = player.p[i - 1].x;
                var cy = player.p[i - 1].y;
                var d = -1;
                for (j; j >= 0 && left > 0; j--) {
                    var dcx = cx - player.s[j].x;
                    var dcy = cy - player.s[j].y;
                    d = Math.sqrt(dcx * dcx + dcy * dcy);
                    left -= d;
                    cx = player.s[j].x;
                    cy = player.s[j].y;
                }
                j++;
                if (d > 0) {
                    player.p[i].dir = Math.acos(dcx / d);
                    var a = Math.PI - player.p[i].dir;
                    player.p[i].x = cx + left * Math.cos(a);
                    player.p[i].y = cy + (dcy > 0 ? -1 : 1) * left * Math.sin(a);
                }
            }

            //objects
            sumDt += dt;
            if (nextObjectDt <= sumDt) {
                sumDt -= nextObjectDt;
                nextObjectDt = NEXT_OBJECT_DELAY / 2 + Math.random() * NEXT_OBJECT_DELAY;
                if (game.maps[game.level].fruits.length < 10) {
                    var prob = 0,
                        fruit;
                    for (var f in game.fruits) {
                        prob += game.fruits[f].prob;
                    }
                    var rand = prob * Math.random();
                    prob = 0;
                    for (var f in game.fruits) {
                        prob += game.fruits[f].prob;
                        if (prob >= rand) {
                            fruit = game.fruits[f];
                            break;
                        }
                    }
                    var fx = game.maps[game.level].borders.a.x + game.maps[game.level].borders.b.x * Math.random();
                    var fy = game.maps[game.level].borders.a.y + game.maps[game.level].borders.b.y * Math.random();
                    while (!insideMap(fx, fy) || !insideMap(fx + fruit.size, fy + fruit.size)) {
                        fx = game.maps[game.level].borders.a.x + game.maps[game.level].borders.b.x * Math.random();
                        fy = game.maps[game.level].borders.a.y + game.maps[game.level].borders.b.y * Math.random();
                    }
                    game.maps[game.level].fruits.push([fx, fy, fruit]);
                }
            }

            //collision
            collision = insideMap(player.x(), player.y());
            if (!collision) gameover();

            //fruit collision
            for (var i = 0; i < game.maps[game.level].fruits.length; i++) {
                for (var j = 0; j < game.players.length; j++) {
                    fruit = game.maps[game.level].fruits[i];
                    if ((Math.abs(fruit[0] - (game.players[j].x() - game.players[j].size)) * 2 < (fruit[2].size + game.players[j].size * 2)) && (Math.abs(fruit[1] - (game.players[j].y() - game.players[j].size)) * 2 < (fruit[2].size + game.players[j].size * 2))) {
                        if (!fruit.eaten) {
                            fruit.scale = 0;
                            fruit.eaten = true;
                            fruit[2].action(player);
                        }
                    }
                    if (fruit.eaten) {
                        player.addPoints(fruit[2].points * dt / FRUIT_FADE, fruit[2].points);
                        fruit.scale += dt;
                        if (fruit.scale >= FRUIT_FADE) {
                            game.maps[game.level].fruits.splice(i, 1);
                        }
                    }
                }
            }

            if (toShowTime > 0) toShowTime -= dt;


        }
    };

    function gameover() {
        var id = Math.round(Math.random() * (Math.pow(2, 32) - 1));
        storage.savePoints(player.points, game.level + 1, player.s, player, id);
        game.started = false;
        var ranking = storage.getRanking();
        var rankCalcTmp = [];
        var rankCalcTmpId;
        for (var i in ranking.gameplays) {
            ranking.gameplays[i].points = parseFloat(ranking.gameplays[i].points);
            rankCalcTmp.push(ranking.gameplays[i]);
            if (ranking.gameplays[i].id == id) rankCalcTmpId = ranking.gameplays[i];
        }
        rankCalcTmp.sort(function compare(a, b) {
            if (a.points < b.points)
                return 1;
            if (a.points > b.points)
                return -1;
            return 0;
        });

        var rankCalc = [];
        var mine = false;
        var showDate = function (date) {
            if (typeof date != 'object') return date;
            var d = date.getDate();
            var m = date.getMonth() + 1;
            var y = date.getFullYear();
            var hh = date.getHours();
            var mm = date.getMinutes();
            return '' + (hh <= 9 ? '0' + hh : hh) + ':' + (mm <= 9 ? '0' + mm : mm) + ' ' + (d <= 9 ? '0' + d : d) + '/' + (m <= 9 ? '0' + m : m) + '/' + y;
        }
        var ttt = function (rank) {
            return {
                player: ((typeof rank.name == 'undefined') ? 'player' : rank.name),
                level: ((typeof rank.level == 'undefined') ? 1 : rank.level),
                points: ((typeof rank.points == 'undefined') ? 0 : Math.round(rank.points)),
                date: ((typeof rank.date == 'undefined') ? showDate(new Date()) : showDate(new Date(rank.date))),
                id: ((typeof rank.id == 'undefined') ? 0 : rank.id),
                mine: ((rank.id == id) ? "mine" : "")
            }
        };
        for (var i = 0; i < Math.min(rankCalcTmp.length, 5); i++) {
            rankCalc.push(ttt(rankCalcTmp[i]));
            if (rankCalcTmp[i].id == id) mine = true;
        }
        if (mine) {
            if (i < rankCalcTmp.length) rankCalc.push(ttt(rankCalcTmp[i]));
        } else {
            rankCalc.push(ttt(rankCalcTmpId));
        }

        $('#canvas').animate({
            opacity: 0.5
        }, 200);
        $('.controls').animate({
            opacity: 0.5
        }, 200);
        $('.stats').css({
            opacity: 0
        }).show().animate({
            opacity: 1
        }, 200).show();
        $('.stats .stats_rows').html("");
        for (var i = 0; i < Math.min(rankCalc.length, 6); i++) {
            $('.stats .stats_rows').append(ich.stats_row(rankCalc[i]));
        }
        $('#replay').click(function () {
            reset();
            $('#canvas').animate({
                opacity: 1
            }, 600);
            $('.controls').animate({
                opacity: 1
            }, 600);
            $('.stats').animate({
                opacity: 0
            }, 600, "swing", function () {
                game.started = true;
                $(this).hide();
            });
            Parse.Analytics.track('usage', {action: "stats",code:"replay"});
        });
    }

    function insideMap(x, y) {
        return pointInPolygon(game.maps[game.level], x, y) % 2 != 0;
    }

    var loadedLeft = 0;

    createPattern('img/background2.jpg', 'bckgrdPattern');
    createPattern('img/background3.jpg', 'bckgrdPattern2');
    createPattern('img/cloud.png', 'bckgrdPattern3');
    for (var fruit in game.fruits) {
        createImage(game.fruits[fruit].logo, 'img', game.fruits[fruit]);
    }

    function createPattern(url, varname) {
        loadImage(url, function (img, that) {
            that[varname] = ctx.createPattern(img, 'repeat');
        }, this);
    }

    function createImage(url, varname, that) {
        loadImage(url, function (img, that) {
            that[varname] = img;
        }, that);
    }

    function loadImage(url, callback, that) {
        loadedLeft++;
        var img = new Image();
        img.onload = function () {
            loadedLeft--;
            if (loadedLeft == 0) game.loaded = true;
            callback(img, that);
        }.bind(this);
        img.src = url;
        return img;
    }

    // Draw everything

    function render() {
        if (game.started) {
            //clear area
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (game.loaded) {
                var tx = game.players[game.player].x();
                var ty = game.players[game.player].y();

                //draw background
                ctx.beginPath();
                ctx.fillStyle = bckgrdPattern2;
                ctx.rect(0, 0, canvas.width, canvas.height);
                ctx.fill();

                //draw parallax
                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = "red";
                ctx.fillStyle = bckgrdPattern3;
                ctx.translate(-tx / 2, -ty / 2);
                ctx.rect(-canvas.width * 5, -canvas.height * 5, canvas.width * 10, canvas.height * 10);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.translate(canvas.width * 0.5 - tx, canvas.height * 0.5 - ty);

                // draw board
                var map = game.maps[game.level];
                ctx.beginPath();
                ctx.moveTo(map.edges[0][0], map.edges[0][1]);
                for (var i = 1; i < map.edges.length; i++) {
                    ctx.lineTo(map.edges[i][0], map.edges[i][1]);
                }
                ctx.closePath();
                ctx.fillStyle = bckgrdPattern;
                ctx.fill();

                ctx.lineWidth = map.borderLineWidth;
                ctx.strokeStyle = map.borderColor;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(map.edges[0][0], map.edges[0][1]);
                for (var i = 1; i < map.edges.length; i++) {
                    if (map.edges[i - 1][2]) {
                        ctx.lineTo(map.edges[i][0], map.edges[i][1]);
                        ctx.stroke();
                    }
                    ctx.beginPath();
                    ctx.moveTo(map.edges[i][0], map.edges[i][1]);
                }

                if (map.edges[i - 1][2]) {
                    ctx.lineTo(map.edges[0][0], map.edges[0][1]);
                    ctx.stroke();
                }


                // draw snakes
                ctx.save();
                for (var pi = 0; pi < game.players.length; pi++) {
                    player = game.players[pi];

                    for (var i = player.p.length - 1; i >= 0; i--) {
                        var rx = player.p[i].x + player.sx;
                        var ry = player.p[i].y + player.sy;

                        ctx.save();
                        ctx.translate(rx, ry);
                        ctx.rotate(player.p[i].dir);
                        var radgrad = ctx.createRadialGradient(7, 0, player.size * .3, 0, 0, player.size);
                        radgrad.addColorStop(0, '#A7D30C');
                        radgrad.addColorStop(0.9, '#019F62');
                        radgrad.addColorStop(1, 'rgba(1,159,98,0)');
                        ctx.fillStyle = radgrad;
                        ctx.fillRect(-player.size, -player.size, player.size * 2, player.size * 2);
                        //player bounding box
                        if (DEBUG) {
                            ctx.save();
                            ctx.beginPath();
                            ctx.strokeStyle = "red";
                            ctx.rect(-player.size, -player.size, player.size * 2, player.size * 2);
                            ctx.stroke();
                            ctx.restore();
                        }


                        ctx.restore();

                    }
                }

                // draw fruits
                for (var i = 0; i < map.fruits.length; i++) {
                    var fruit = map.fruits[i];
                    if (fruit.eaten) {
                        ctx.save();
                        ctx.translate(fruit[0] + fruit[2].size / 2, fruit[1] + fruit[2].size / 2);
                        ctx.font = '15pt CommandoCommando';
                        ctx.lineWidth = 3;
                        if (fruit[2].messageColor == 'good') {
                            ctx.strokeStyle = 'rgb(25,94,17)';
                            ctx.fillStyle = 'rgb(20,200,0)';
                        } else if (fruit[2].messageColor == 'bad') {
                            ctx.strokeStyle = 'rgb(139,21,21)';
                            ctx.fillStyle = 'rgb(256,0,0)';
                        }
                        ctx.strokeText(fruit[2].message, -fruit[2].message.length * 5.5, -14);
                        ctx.fillText(fruit[2].message, -fruit[2].message.length * 5.5, -14);
                        var scale = 1 + 4 * fruit.scale / FRUIT_FADE;
                        ctx.globalAlpha = 1 - fruit.scale / FRUIT_FADE;
                        ctx.scale(scale, scale);
                        ctx.drawImage(fruit[2].img, -fruit[2].size / 2, -fruit[2].size / 2);
                        ctx.restore();
                    } else {
                        ctx.drawImage(fruit[2].img, fruit[0], fruit[1]);
                    }
                    if (DEBUG) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.strokeStyle = "blue";
                        ctx.rect(fruit[0], fruit[1], fruit[2].size, fruit[2].size);
                        ctx.stroke();
                        ctx.restore();
                    }
                }

                // snake trace
                if (DEBUG) {
                    ctx.save();
                    ctx.strokeStyle = 'white';
                    ctx.fillStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(player.s[0].x + player.sx, player.s[0].y + player.sy);
                    for (var i = 1; i < player.s.length; i++) {
                        ctx.lineTo(player.s[i].x + player.sx, player.s[i].y + player.sy);
                    }
                    ctx.lineTo(player.p[0].x + player.sx, player.p[0].y + player.sy);
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.restore();
                ctx.restore();
                overlays(ctx, canvas);


            } else {
                ctx.font = '22pt CommandoCommando';
                ctx.lineWidth = 4;
                // stroke color
                ctx.strokeStyle = 'yellow';
                ctx.fillStyle = 'red';
                ctx.strokeText('Loading resources ...', canvas.width / 2 - 125, canvas.height / 2 + 11);
                ctx.fillText('Loading resources ...', canvas.width / 2 - 125, canvas.height / 2 + 11);
            }
        }
    };

    function overlays(ctx, canvas) {
        var speed = player.speed * 100;
        var size = player.p.length;
        var points = player.points;

        ctx.font = '20pt CommandoCommando';
        ctx.lineWidth = 3;
        // stroke color
        ctx.strokeStyle = 'rgb(134,134,24)';
        ctx.fillStyle = 'rgb(220,220,62)';
        var text = 'Points: ' + Math.round(points);
        if (toShowTime > 0) text += "  +" + toShowPoints
        ctx.strokeText(text, 10, 34);
        ctx.fillText(text, 10, 34);
    }

    // The main game loop

    function main() {
        if (!running) {
            return;
        }

        var now = Date.now();
        var dt = now - then;

        update(dt);


        render();

        then = now;
        requestAnimFrame(main);
    };

    // Don't run the game when the tab isn't visible
    window.addEventListener('focus', function () {
        unpause();
    });

    window.addEventListener('blur', function () {
        pause();
    });

    // Let's play this game!
    reset();
    var then = Date.now();
    var running = true;
    main();
});


var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};