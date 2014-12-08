
define(function(require) {

    var $ = require('zepto');
    var pressedKeys = {};

    
    function setKey(event, status) {
        var code;
        if("number" == typeof event) code = event;
        else code = event.keyCode;
        var key;

        switch(code) {
        case 32:
            key = 'SPACE'; break;
        case 37:
            key = 'LEFT'; break;
        case 38:
            key = 'UP'; break;
        case 39:
            key = 'RIGHT'; break;
        case 40:
            key = 'DOWN'; break;
        case 1000:
            key = 'TOUCH_LEFT'; break;
        case 1001:
            key = 'TOUCH_RIGHT'; break;
        default:
            // Convert ASCII codes to letters
            key = String.fromCharCode(code);
        }

        pressedKeys[key] = status;
    }

    document.addEventListener('keydown', function(e) {
        setKey(e, true);
    });

    document.addEventListener('keyup', function(e) {
        setKey(e, false);
    });

    window.addEventListener('blur', function() {
        pressedKeys = {};
    });
    
    $('.controls .turnright').bind('touchstart mousedown',function(){
        setKey(1001, true);
    });
    
    $('.controls .turnright').bind('touchend mouseup mouseout',function(){
        setKey(1001, false);
    });
    
    $('.controls .turnleft').bind('touchstart mousedown',function(){
        setKey(1000, true);
    });
    
    $('.controls .turnleft').bind('touchend mouseup mouseout',function(){
        setKey(1000, false);
    });

    return {
        isDown: function(key) {
            return pressedKeys[key];
        }
    };
});