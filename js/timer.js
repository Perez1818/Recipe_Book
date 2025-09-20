const visibleCountdown = document.getElementById("countdown");
const timerBar = document.getElementById("timer");

let minutes = 5;
secondsElapsed = 0;
let secondsToRun = minutes * 60;
const SECOND = 1_000;

timerId = setInterval(updateClock, SECOND);

function padTime(timeUnit) {
    return String(timeUnit).padStart(2, "0");
}


function flashTimer() {
    if (visibleCountdown.style.color === "") {
        visibleCountdown.style.color = "red";
    }
    else {
        visibleCountdown.style.color = "";
    }
}


function updateClock() {
    secondsElapsed++;
    timerBar.value = secondsElapsed / secondsToRun;
   
    const minutesWithDecimal = (secondsToRun - secondsElapsed) / 60;
    minutes = Math.trunc(minutesWithDecimal)
    seconds = Math.round((minutesWithDecimal - minutes) * 60, 2);
   
    seconds = padTime(seconds);

    visibleCountdown.textContent = `${minutes}:${seconds}`

    if (secondsElapsed === secondsToRun) {
        clearInterval(timerId);
        alarmOffId = setInterval(flashTimer, SECOND / 4)
    }
}
