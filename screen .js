﻿// Players tracking
var players = new Array();
var playerCount = 0;
//

// Q&A tracking
var qa = [];
var currentQues = null;
var correctAnswer = 0;
var randomQ = 0;
var answers = new Array();
var playersAnswered = 0;
var correctGuess = 0;
//

//
var airconsole = new AirConsole();
//

//parse message
airconsole.onMessage = function (from, message) {
    if (message.player !== undefined) {
        submitPlayer(from, message.player)
    }
    if (message.newRound !== undefined) {
        newRound();
    }
    if (message.answer !== undefined) {
        submitAnswer(from, message.answer);
    }
    if (message.guesses !== undefined) {
        submitAllGuesses();
    }
    if (message.allGuesses !== undefined) {
        calcGuesses(from, message.allGuesses);
    }
};

function submitPlayer(from, info) {
    var message = new Object();
    var error = false;
    var firstPlayer = false;
    for (p in players) {
        if (info.Name == players[p].Name)
            error = true;
    }
    if (error == false) {
        // Update Player info
        var playerIndex = playerCount;
        var pN = playerCount + 1;
        players.push(info);
        players[playerIndex].Number = pN;
        players[playerIndex].answer = null;
        //

        playerCount += 1;

        // Show message on device screen
        var form = document.getElementById("form1");
        var div = document.createElement('DIV');
        div.innerHTML = "Player " + playerCount + ": " + info.Name;
        var input = document.createElement('input');
        input.type = "text"; 
        input.setAttribute("id", "player" + players[playerIndex].Id);
        input.disabled = true;
        input.value = info.Points;
        div.appendChild(input);
        form.appendChild(div);

        if (playerCount == 1) {
            firstPlayer = true;
        }
    }

    //prep message
    message.error = error;
    message.playerCount = playerCount;
    message.firstPlayer = firstPlayer;

    // We receive a message -> Send message back to the device
    airconsole.message(from, { playerInfo: message });
}

function newRound() {
    currentQues = null;
    correctAnswer = 0;
    randomQ = 0;
    answers = new Array();
    playersAnswered = 0;
    correctGuess = 0;

    var form = document.getElementById("form2");
    var child = form.firstElementChild;
    while (child) {
        form.removeChild(child);
        child = form.firstElementChild;
    }
    getQA();
}

function getQA() {
    var message = new Object();
    if (qa.length == 0) {
        qa = JSON.parse(window.data);
    }
    randomQ = Math.floor(Math.random() * qa.length); 
    currentQues = qa[randomQ].question;
    correctAnswer = qa[randomQ].answer;
    qa.splice(randomQ, 1);
    message.question = currentQues;
    airconsole.broadcast({ question: message });

    var ques = document.getElementById("userInfo");
    ques.innerHTML = currentQues;
}
function submitAnswer(from, answer) {
    var a = new Object();
    var ror = 0;
    answer = Number(answer);
    a.answer = answer;
    a.ror = ror;
    var player = findObjectByKey(players, 'Id', from);
    player.answer = answer;
    var answerIncluded = findObjectByKey(answers, 'answer', answer);
    if (answerIncluded == null)
        answers.push(a);
    playersAnswered += 1;
    if (players.length == playersAnswered) {
        gamble();
    }
}

function gamble() {
    answers.sort((a, b) => (a.answer > b.answer) ? 1 : -1)
    for (p in players) {
        var ror = 0;
        if (isOdd(answers.length) === 0) {
            ror = 3;
            for (x = 4; x <= answers.length; x += 2) {
                ror += 1;
            }
        }
        else {
            ror = 2;
            for (x = 3; x <= answers.length; x += 2) {
                ror += 1;
            }
        }
        var up = false;

        for (i in answers) {
            // Find Correct Guess
            if (answers[i].answer <= correctAnswer)
                correctGuess = answers[i].answer;

            // Set ror for answer
            answers[i].ror = ror;
            //

            // Set payout
            if (isOdd(answers.length) === 0) {
                if (ror > 3 && up == false) {
                    ror -= 1;
                }
                else if (ror === 3 && up == false) {
                    up = true;
                }
                else {
                    ror += 1;
                }
            }
            else {
                if (up == false) {
                    ror -= 1;
                    if (ror === 2)
                        up = true;
                }
                else {
                    ror += 1;
                }
            }
            //
        }
        

    }
    var form = document.getElementById("form2");
    var pdiv = document.createElement("div");
    var lowBtn = document.createElement("INPUT");
    lowBtn.setAttribute("type", "button");
    lowBtn.setAttribute("value", ror);
    lowBtn.setAttribute("ror", ror);
    pdiv.innerHTML = "Pays " + ror + " to 1:";
    pdiv.appendChild(lowBtn);
    form.appendChild(pdiv);

    for (i in answers) {
        var btn = document.createElement("INPUT");
        btn.setAttribute("type", "button");
        btn.setAttribute("value", answers[i].answer);
        btn.setAttribute("ror", answers[i].ror);
        pdiv.innerHTML = "Pays " + answers[i].ror + " to 1:";
        pdiv.appendChild(btn);
        form.appendChild(pdiv);
    }
    airconsole.broadcast({ answers: answers });
}

function submitAllGuesses() {
    airconsole.broadcast({ guesses: true });
}

function calcGuesses(from, allGuesses) {
    var p = Number(allGuesses.Points);
    var guessesTotal = allGuesses.guessesTotal;
    for (var g = 0; g < guessesTotal.length; g++) {
        var gV = Number(guessesTotal[g].Value);
        var gC = Number(guessesTotal[g].Count);
        if (correctGuess == gV) {
            var ror = Number(guessesTotal[g].Ror);
            var aV = gC * ror;
            p += aV;
        }
    }

    //Update Player Points
    var player = findObjectByKey(players, 'Id', from);
    var plText = document.getElementById('player' + player.Id);

    player.Points = p;
    if (player.Points < 2) {
        player.Points = 2;
    }
    plText.value = player.Points;

    var ans = document.getElementById("userInfo");
    var ques = ans.innerHTML;
    if (!ques.includes(correctAnswer)) {
        ques += (" " + correctAnswer);
        ans.innerHTML = ques;
    }

    //send back points
    airconsole.broadcast({ points: players});
}

function isOdd(num) { return num % 2; }

function findObjectByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
}