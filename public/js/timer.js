
// Object references
const visibleCountdown = document.getElementById("countdown");
const timerBar = document.getElementById("timer");

// Time variables
let minutes = 5;
let secondsToRun = minutes * 60;
const SECOND = 1_000;
let msToRun = secondsToRun * 1_000;
const targetTime = Date.now() + msToRun;

// Assigns rate at which to call updateTimer and updateTimerBar and the IDs to stop calls
timerId = setInterval(updateTimer, SECOND);
timerBarId = setInterval(updateTimerBar, SECOND / 20);

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
    remainingTimeMs = targetTime - Date.now();
    remainingTimeS = remainingTimeMs / 1_000;

    // Calculates minutes and seconds
    const minutesWithDecimal = (remainingTimeS) / 60;
    minutes = Math.trunc(minutesWithDecimal)
    seconds = Math.round((minutesWithDecimal - minutes) * 60, 2);
   
    // Pads seconds with "0s" if necessary
    seconds = padTime(seconds);
    // Updates timer to display updated time left
    visibleCountdown.textContent = `${minutes}:${seconds}`

    // Stops timer when time runs out and makes text flash
    if (remainingTimeS <= 0) {
        clearInterval(timerId);
        clearInterval(timerBarId);

        // Plays alarm for 3 seconds before stopping
        let alarmOffId;
        alarmOffId = setInterval(flashTimer, SECOND / 4);
        setTimeout(function() {
            clearInterval(alarmOffId);
        }, 3_000);
    }
}

// Updates progress bar animation to be much smoother using ms
function updateTimerBar() {
    remainingTimeMs = targetTime - Date.now();
    timerBar.value = remainingTimeMs / msToRun;
}
