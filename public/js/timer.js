
// Object references
const visibleCountdown = document.getElementById("countdown");
const timerBar = document.getElementById("timer");

// Time variables
let minutes = 5;
secondsElapsed = 0;
let secondsToRun = minutes * 60;
const SECOND = 1_000;

// Assigns ID to be used to stop calling updateTimer every second
timerId = setInterval(updateTimer, SECOND);

// Returns unit of time with extra "0" if it consists of one digit
function padTime(timeUnit) {
    return String(timeUnit).padStart(2, "0");
}


// Makes timer text "flash" by switching between black and red
function flashTimer() {
    if (visibleCountdown.style.color === "") {
        visibleCountdown.style.color = "red";
    }
    else {
        visibleCountdown.style.color = "";
    }
}


// Updates the time of the timer every second until time runs out
function updateTimer() {
    secondsElapsed++;
    // Updates progress bar for elapsed time
    timerBar.value = secondsElapsed / secondsToRun;
   
    // Calculates minutes and seconds
    const minutesWithDecimal = (secondsToRun - secondsElapsed) / 60;
    minutes = Math.trunc(minutesWithDecimal)
    seconds = Math.round((minutesWithDecimal - minutes) * 60, 2);
   
    // Pads seconds with "0s" if necessary
    seconds = padTime(seconds);
    // Updates timer to display updated time left
    visibleCountdown.textContent = `${minutes}:${seconds}`

    // Stops timer when time runs out and makes text flash
    if (secondsElapsed === secondsToRun) {
        clearInterval(timerId);
        alarmOffId = setInterval(flashTimer, SECOND / 4)
    }
}
