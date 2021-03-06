'use strict';

var _ = require('lodash');
var merge = require('lodash/merge');
var Twit = require('twit');

var credentials = {
    consumer_key: process.env.API_KEY,
    consumer_secret: process.env.API_SECRET_KEY,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
}

var error_over_limit = 'Error: User is over daily status update limit.';

/**
 * EatShitBot constructor description
 *
 * @class EatShitBot
 * @classdesc EatShitBot class description
 *
 * @param {object} options - Instance instantiation object
 * @param {string} options.example - Example options property
 */
function EatShitBot(options) {
    this.twitBot;
    this.twitterBot;
    this.stream;
    this.options = merge({}, EatShitBot.DEFAULTS, options);
    this.createTwitterConnection();
}

EatShitBot.DEFAULTS = {};

module.exports = EatShitBot;

EatShitBot.prototype.createTwitterConnection = function () {
    this.twitBot = new Twit({
        consumer_key: credentials.consumer_key,
        consumer_secret: credentials.consumer_secret,
        access_token: credentials.access_token,
        access_token_secret: credentials.access_token_secret
    });
};

EatShitBot.prototype.getStream = function (string) {
    this.stream = this.twitBot.stream('statuses/filter', {
        track: string
    });
    this.stream.on('tweet', function (tweet) {
        //this.logTweet(tweet["text"], tweet["user"]["screen_name"]);
        console.log('stream');
    }.bind(this));
};

EatShitBot.prototype.getTweets = function (string, count) {
    var statuses, i;
    this.twitBot.get('search/tweets', {
        q: '' + string + '',
        count: count
    }, function (error, data, response) {
        if (data) {
            statuses = data.statuses;
            i = statuses.length;
            while (i--) {
                //this.logTweet(statuses[i]["text"], statuses[i]["user"]["screen_name"]);
            }
        } else {
            console.log('error getTweets(): ' + error);
        }
    }.bind(this));
};

EatShitBot.prototype.streamAndRetweet = function (string, retort_phrase_v1, retort_phrase_v2, enable_retort) {
    this.stream = this.twitBot.stream('statuses/filter', {
        track: string
    });
    this.stream.on('tweet', function (tweet) {
        if (tweet["text"].toLowerCase().indexOf(string.toLowerCase()) !== -1) {
            if (this.checkRetort(tweet["text"],retort_phrase_v1,retort_phrase_v2)) {
                if (enable_retort) {
                    this.reply(tweet["user"]["screen_name"], tweet.id_str)
                }
            } else {
                this.retweet(tweet.id_str);
            }
        }
    }.bind(this));
    this.stream.on('disconnect', function (disconnectMessage) {
        console.log('disconnected:', disconnectMessage);
        this.streamAndRetweet(string);
    }.bind(this));
    this.stream.on('warning', function (warning) {
        console.log('warning:', warning);
    }.bind(this));
    this.stream.on('reconnect', function (request, response, connectInterval) {
        console.log('attemping to reconnect, status message:', response.statusMessage);
        request.on('error', function (error) {
            console.log('error streamAndRetweet(): ', error);
        });
    }.bind(this));
};

EatShitBot.prototype.retweet = function (tweetId) {
    this.twitBot.post('statuses/retweet/' + tweetId, function (error, tweet, response) {
        if (!error) {
            this.logTweet(tweet["text"], tweet["user"]["screen_name"]);
        } else {
            console.log(error);
            if (error === error_over_limit) {
                console.log("Over daily limit: going to sleep for 24 hours");
                setTimeout(function () {
                    console.log("...time to wake up");
                }, 86400000);
            }

        };
    }.bind(this));
};

EatShitBot.prototype.reply = function (tweet_user, status_id) {
    var retort = this.getRetort();
    this.twitBot.post('statuses/update', {
        status: '@' + tweet_user + ' ' + retort,
        in_reply_to_status_id: status_id
    }, function (error) {
        console.log(error);
        if (error === error_over_limit) {
            console.log("Over daily limit: going to sleep for 24 hours");
            setTimeout(function () {
                console.log("...time to wake up");
            }, 86400000);
        }
    })
}

EatShitBot.prototype.checkRetort = function (tweet_text, retort_phrase_v1, retort_phrase_v2) {
    if (tweet_text.toLowerCase().indexOf(retort_phrase_v1.toLowerCase()) !== -1 ||
        tweet_text.toLowerCase().indexOf(retort_phrase_v2.toLowerCase()) !== -1) {
        return true;
    }
}

EatShitBot.prototype.getRetort = function () {
    var retort = [];
    retort.push("Today is as good any other day!");
    retort.push("Why wait, tomorrow is so far away.");
    retort.push("Lucky for you I'm booked up today.");
    retort.push("How about your Birthday?");
    retort.push("When is a good day for you?");
    retort.push("That's fine I'm getting stoned right now.");
    retort.push("Today doesn't work for me either.");
    retort.push("I'm having a salad right now, maybe tomorrow.");
    retort.push("I'm torturing sinners right now be back later.");
    retort.push("Thanks for the mention, I'll get back with you later.")
    retort.push("That's ok I'll be here all day.");
    retort.push("I'm eating ice cream so hot down here.");
    var result = retort[Math.floor(Math.random() * retort.length)];
    return result;
}

EatShitBot.prototype.logTweet = function (tweet, screenName) {
    //console.log(`${tweet}\n${screenName}\n\n`)
};