var airconsole = new AirConsole();

var info = new Object();

function send() {
    // Update Player info
    var pI = document.getElementById('playerInfo');
    if (pI.value != "") {
        info.Id = airconsole.device_id;
        info.Name = pI.value;
        info.Points = 2;
        info.Count = 0;
        airconsole.message(AirConsole.SCREEN, { player: info });
    }
    else {
        alert("You must enter a Name");
    }
};

// Listen for messages
airconsole.onMessage = function (from, data) {
    if (data.playerInfo !== undefined) {
        playerAdded(data.playerInfo);
    }
    if (data.question !== undefined) {
        setQuestion(data.question);
    }
    if (data.answers !== undefined) {
        startGamble(data.answers);
    }
    if (data.guesses !== undefined) {
        submitAll();
    }
    if (data.points !== undefined) {
        updatePoints(data.points);
    }
};

function playerAdded(data) {
    var form = document.getElementById("form2");
    if (data.error == false) {
        // Show message on device screen
        var div = document.createElement('DIV');
        var plInfo = document.createElement('P');
        plInfo.innerHTML = "You are player " + data.playerCount;
        div.appendChild(plInfo);
        form.appendChild(div);

        //Hide-Show Previous controls
        var prevCon = document.getElementById("form1");
        prevCon.style.display = "none"; 

        if (data.firstPlayer == true) {
            info.firstPlayer = true;
            var btn = document.getElementById("newRound");
            btn.style.display = "inline-block";
        }
    }
    else {
        alert("That name is taken");
    }
}

function newRound() {
    var btn = document.getElementById("newRound");
    btn.style.display = "none";
    var newRound = true;
    airconsole.message(AirConsole.SCREEN, { newRound: newRound });
}

function setQuestion(data) {
    //Show form
    var form3 = document.getElementById("form3");
    form3.style.display = "block";

    //Hide Previous controls
    var prevCon = document.getElementById("firstPlayer");
    if (prevCon != undefined) {
        prevCon.style.display = "none";
    }

    //Remove previous answers
    var form = document.getElementById("form4");
    var child = form.firstElementChild;
    while (child) {
        form.removeChild(child);
        child = form.firstElementChild;
    }

    //Show Question and set TextBox and Btn
    var info = document.getElementById('question');
    info.innerHTML = data.question;
    var input = document.getElementById('answer');
    input.style.display = "inline-block";
    input.disabled = false;
    var btn = document.getElementById('answerBtn');
    btn.style.display = "inline-block";
}

function submitAnswer() {
    var answer = document.getElementById("answer");
    var answerVal = answer.value;
    airconsole.message(AirConsole.SCREEN, { answer: answerVal });

    //Hide Answer Btn and disable TextBox
    answer.disabled = true;
    var answerBtn = document.getElementById("answerBtn");
    answerBtn.style.display = "none";
}

function startGamble(answers) {
    var form = document.getElementById("form4");
    form.style.display = "block";

    for (i in answers) {
        var pdiv = document.createElement("div");
        var p = document.createElement("P");
        var subBtn = document.createElement("BUTTON");
        var btn = document.createElement("BUTTON");
        var count = document.createElement("INPUT");

        subBtn.setAttribute("type", "button");
        subBtn.setAttribute("g", answers[i].answer);
        subBtn.setAttribute("value", "-");
        subBtn.onclick = function () { subGuess(this) };
        subBtn.innerHTML = "-";

        count.setAttribute("type", "number");
        count.setAttribute("value", 0);
        count.setAttribute("name", "guesses");
        count.setAttribute("id", answers[i].answer);
        count.setAttribute("ror", answers[i].ror);

        btn.setAttribute("type", "button");
        btn.setAttribute("g", answers[i].answer);
        btn.setAttribute("value", "+");
        btn.onclick = function () { addGuess(this) };
        btn.innerHTML = "+";

        count.disabled = true;
        p.innerHTML = "Pays " + answers[i].ror + " to 1: " + answers[i].answer + ":";
        pdiv.appendChild(p);
        pdiv.appendChild(subBtn);
        pdiv.appendChild(count);
        pdiv.appendChild(btn);
        form.appendChild(pdiv);
    }
    //Hide and clear TextBox
    var answer = document.getElementById("answer");
    answer.value = "";
    var answerForm = document.getElementById("form3");
    answerForm.style.display = "none";
    

    if (info.firstPlayer == true) {
        var div = document.createElement('DIV');
        var input = document.createElement('input');
        input.setAttribute("id", "submitGuesses");
        input.type = "button";
        input.value = "All Players Ready!";
        input.onclick = function () { submitGuesses() };
        div.appendChild(input);
        form.appendChild(div);
    }
}

function addGuess(guess) {
    if (info.Points > 0) {
        var guessCount = 0;
        var addGuess = true;
        var addBox = document.getElementById(guess.getAttribute("g"));
        var bV = Number(addBox.value);
        var guesses = document.getElementsByName("guesses");
        for (let g = 0; g < guesses.length; g++) {
            var gV = Number(guesses[g].value);
            if (gV !== 0)
                guessCount += 1;
            if (guessCount >= 2) {
                if (bV == 0)
                    addGuess = false;
            }
        }
        if (addGuess) {
            addBox.value = bV += 1;
            info.Points -= 1;
        }
        else {
            alert("You can only bet on 2 Guesses");
        }
    }
    else {
        alert("You have no more to bet!");
    }
}

function subGuess(guess) {
    var subBox = document.getElementById(guess.getAttribute("g"));
    var bV = Number(subBox.value);
    if (bV !== 0) {
        subBox.value = bV -= 1;
        info.Points += 1;
    }
    else {
        alert("You have add points to that guess");
    }
}

function submitGuesses() {
    airconsole.message(AirConsole.SCREEN, { guesses: true });
}

function submitAll() {
    //Hide-Show Previous controls
    var prevCon = document.getElementById("form4");
    prevCon.style.display = "none"; 

    var guessesTotal = new Array();
    var guesses = document.getElementsByName("guesses");
    for (let g = 0; g < guesses.length; g++) {
        var gC = Number(guesses[g].value);
        if (gC !== 0) {
            var guess = new Object();
            guess.Count = gC;
            var val = guesses[g].getAttribute("id");
            var ror = guesses[g].getAttribute("ror");
            guess.Value = val;
            guess.Ror = ror;
            guessesTotal.push(guess);
        }
    }
    var allGuesses = new Object();
    allGuesses.guessesTotal = guessesTotal;
    allGuesses.Points = info.Points;
    airconsole.message(AirConsole.SCREEN, { allGuesses: allGuesses });
}

function updatePoints(players) {
    for (var p = 0; p < players.length; p++) {
        if (players[p].Id == airconsole.device_id) {
            info.Points = players[p].Points;
        }
    }
    if (info.firstPlayer == true) {
        var btn = document.getElementById("newRound");
        btn.style.display = "inline-block";
    }
}