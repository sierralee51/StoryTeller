// Below code is from Socket.Io's tutorial on their website
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static("."));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

//// Our code starts here

const rounds = 3; // how many rounds will be played

var currRound = 0; // round counter
var people = []; // people currently in the game
var peopleToVisit = []; // people who need to enter this round

// var visitedPeople = [];
// while (people.indexOf(visitedPeople[num])

var messages = []; // current story
var gameInProgress = false; // if the game is currently active
var currPlayer = ""; // the player who is currently entering

// When there is a connect 
io.on('connection', function(socket) {
  // Default name for a guest
  var user = "Guest";

  // Internal way to see if person has joined
  console.log('a user has connected');

  // Listening for players to request game status
  socket.on('getStatus', function() {
    // Sends out whether a game is in progress or not
    io.emit('gameStatus', gameInProgress);
  });

  // Listening for players joining the game
  socket.on('join', function(username) {
    // add player's username to the list of players
    people.push(username);
    // Sets the players user field to username
    user = people[people.length-1];
    // update the new players list to everyone
    io.emit('update players', people);
  });

  // Listening for players to start game
  socket.on('startGame', function() {
    // set game in progress to true
    gameInProgress = true;
    io.emit('startGame');
    // gets the starting prompt
    var msg = getPrompt();
    // adds the prompt to the start of the messages list
    messages.push(msg);
    // sends the starting message to everyone
    io.emit('chat message', "Your starting phrase is " + msg);
    // get currPlayer 
    currPlayer = getPerson();
    // sends the selected user one
    io.emit('selectedUser', currPlayer);
    io.emit('current round', currRound);
  });

  // listen for users to send a message
  socket.on('chat message', function(msg) {
    // add that message to the current story
    messages.push(msg);
    // send that message to all players
    io.emit('chat message', user + ": " + msg);
    
    //
    currPlayer = getPerson();
    // tell everyone the next player
    io.emit('selectedUser', currPlayer);
    // if the current round is greater than the game length 
    if (currRound > rounds) {
      // the current length of the story
      var msgLength = messages.length;
      // the story as one variable 
      var complete = messages[0];
      // add the rest of the story to the complete story
      for (var i = 1; i < msgLength; i++) {
        complete += " " + messages[i];
      }
      // clear the array
      messages.splice(0, msgLength);
      // send a message to players to clear chat
      io.emit('clear chat');
      // send the complete story to everyone
      io.emit('chat message', "Your story was: " + complete);
      // reset round back to 0
      currRound = 1;
      // get a new prompt
      var newPrompt = getPrompt();
      // add the new prompt to the story
      messages.push(newPrompt);
      // send new prompt to everyone
      io.emit('chat message', "Your new starting phrase is: " + newPrompt);
    } 
    io.emit('current round', currRound);
  });

  // listening for someone to disconnect
  socket.on('disconnect', function() {
    // get the index of the person in the list
    const index = people.indexOf(user);
    // if there are in the list
    if (index > -1) {
      // remove them
      people.splice(index, 1);
    }
    // update everyone's players
    io.emit('update players', people);
    // if there are no people left
    if (people.length === 0) {
      reset();
    } else {
      // if the disconnected player was the user
      if (currPlayer === user) {
        // get a new current player
        currPlayer = getPerson()
        io.emit('selectedUser', currPlayer);
        io.emit('current round', currRound);
      }
    }
    console.log('a user has disconnected');
  });
  
});

// Returns a random prompt from a given list
function getPrompt() {
  return "Someone once said, ";
}

// Resets the program to the starting state
function reset() {
  currRound = 0; 
  people = [];
  peopleToVisit = [];
  messages = [];
  gameInProgress = false;
  currPlayer = "";
  io.emit('gameStatus', gameInProgress);
  io.emit('update players', people);
  io.emit('clear chat');
}

function getPerson() {
  if (peopleToVisit.length === 0) {
    for (var i = 0; i < people.length; i++) {
      peopleToVisit.push(people[i]);
      console.log("Person " + i + " " + people[i]);
    }
    currRound++;
  } 
  var num = Math.floor(peopleToVisit.length * Math.random());
  var currPerson = peopleToVisit[num];
  while (people.indexOf(currPerson) === -1) {
    // removes a player from having a turn if they disconnect before their turn
    peopleToVisit.splice(peopleToVisit.indexOf(currPerson), 1);
    num = Math.floor(peopleToVisit.length * Math.random());
    currPerson = peopleToVisit[num];
  }
  peopleToVisit.splice(num, 1);
  for (var i = 0; i < peopleToVisit.length; i++) {
    console.log("Left " + i + " " + peopleToVisit[i]);
  }
  return currPerson;
  }

/*function timer(){
  var duration = 5; // convert minutes into seconds
        var counter = setInterval(function() {
          var currentDate = new Date().getTime();
          var finalDate = new Date(currentDate);
          finalDate.setMinutes(finalDate.getMinutes() + duration * 60);

          var hour = Math.floor((duration % (60 * 60 * 24)) / (60 * 60));
          var minute = Math.floor((duration % (60 * 60)) / 60);
          var second = Math.floor(duration % 60);

          duration--;

          document.getElementById("test").innerHTML =
            second + "s ";

          if (duration < 0) {
            clearInterval(counter);

            document.getElementById("test").innerHTML =
              "Time's Up!";
          }
        }, 1000);
} */

// The Server to Connect to
http.listen(3000, function() {
  console.log('listening on *:3000');
});