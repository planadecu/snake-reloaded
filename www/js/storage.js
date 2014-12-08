define(function(require) {
    var storageEnabled = typeof(Storage)!=="undefined";
    var localRanking = {
        plays:0,
        gameplays: {},
        maxlevel:1
        
    };
    return {
        getRanking: function(key) {
            if(storageEnabled){
                var ranking = localStorage.ranking;
                if(ranking == null){
                    return localRanking;
                }else{
                    try{
                        return JSON.parse(ranking);
                    }catch(e){
                        console.log(e);
                        return localRanking;
                    }
                }
            }else{
                return localRanking;
            }
        },
        savePoints: function(points,level,track,player,id,name) {
            var ranking = this.getRanking();
            ranking.gameplays[ranking.plays++] = {
                points: points,
                track: track,
                player: player,
                id:id,
                date: new Date(),
                name:name,
                level:level
            }
            if(storageEnabled){
                localStorage.ranking = JSON.stringify(ranking);
            }
        },
        saveUser: function(user){
            if(storageEnabled){
                localStorage.user = JSON.stringify(user);
            }
        },
        getUser: function(){
            if(storageEnabled){
                var user = localStorage.user;
                if(user == null){
                    return new Parse.User();
                }else{
                    try{
                        user = new Parse.User();
                        parsedUser = JSON.parse(user);
                        user.set('displayName',parsedUser.displayName);
                        user.set('password',parsedUser.password);
                        user.set('username',parsedUser.username);
                    }catch(e){
                        console.log(e);
                        return new Parse.User();
                    }
                }
            }else{
                return new Parse.User();
            }
        }
    };
});