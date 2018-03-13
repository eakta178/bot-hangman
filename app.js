var builder = require('botbuilder');
var restify = require('restify');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
}); 

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MY_APP_ID,
    appPassword: process.env.MY_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================
var kidsMovie = ['FROZEN', 'NEMO', 'SMURF','DORY', 'SECRET LIFE OF PETS','The Lion King', 'BOSS BABY'];
var teenMovie = ["Star Wars The Force Awakens", "The Truman Show", "Saving Private Ryan", "Rocky"];

var intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents.matches(/^kids/i, [
    function (session) {
        session.userData.lives = 5;
        session.userData.word = kidsMovie[Math.floor(Math.random()*kidsMovie.length)];
        session.userData.masked = session.userData.word.replace(/[A-Z]/ig,'?')
        session.send('Guess the kids movie title');
        session.beginDialog('/guess');
    }
]);

intents.matches(/^teens/i, [
    function (session) {
        session.userData.lives = 5;
        session.userData.word = teenMovie[Math.floor(Math.random()*teenMovie.length)]
        session.userData.masked = session.userData.word.replace(/[A-Z]/ig,'?')
        session.send('Guess the teen movie title');
        session.beginDialog('/guess');
    }
]);

intents.onDefault([
    function (session) {
        session.beginDialog('/welcome');
    }
]);

bot.dialog('/guess', [
    function (session) {
        session.send('You have ' + session.userData.lives + ' ' + (session.userData.lives == 1 ? 'life' : 'lives') + ' left');
        builder.Prompts.text(session, session.userData.masked);
    },
    function (session, results) {
        var nextDialog = GetNextDialog(session, results);
        session.beginDialog(nextDialog);        
    }
]);

bot.dialog('/win', [
    function (session) {
        session.send(session.userData.masked);
        session.send('Well done, you win!');
        session.endDialog();
    }
]);

bot.dialog('/welcome', [
    function (session) {
        session.send("Hi I'm Hangman Bot. Type 'kids'or 'teens' to start a new game.");
        session.endDialog();
    }
]);

bot.dialog('/gameover', [
    function (session) {
        session.send('Game Over! You lose!');
        session.send(session.userData.word);
        session.endDialog();
    }
]);

function GetNextDialog(session, results){
    var nextDialog = '';
    if(results.response.length > 1)
    {
        if(results.response.toUpperCase() === session.userData.word.toUpperCase())
        {
            session.userData.masked = session.userData.word;
            nextDialog = '/win';
        }
        else
        {
            session.userData.lives--;
            nextDialog = session.userData.lives === 0 ? '/gameover' : '/guess';
        }
    }
    else
    {
        session.userData.letter = results.response;
        session.userData.masked = RevealLettersInMaskedWord(session, results);

        if(session.userData.masked == session.userData.word)
        {
            nextDialog = '/win';
        }
        else
        {
            nextDialog = session.userData.lives === 0 ? '/gameover' : '/guess';
        }
    }
    return nextDialog;
}

function RevealLettersInMaskedWord(session, results)
{
    var wordLength = session.userData.word.length;
    var maskedWord = "";
    var found = false;

    for(var i = 0; i < wordLength; i++)
    {
        var letter = session.userData.word[i];
        if(letter.toUpperCase() === results.response.toUpperCase())
        {
            maskedWord += letter;
            found = true;
        }
        else
        {
            maskedWord += session.userData.masked[i];
        }
    }

    if(found === false)
    {
        session.userData.lives--;
    }

    return maskedWord;
}