
// Object references
const visibleCountdown = document.getElementById("countdown");
const timerBar = document.getElementById("timer");
const playBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const resetBtn = document.getElementById("reset-btn");
const moreOptionsBtn = document.getElementById("more-options-btn")
const dropdownContent = document.getElementsByClassName("dropdown-content")[0];
const switchTimerBtn = document.getElementById("switch-timer-btn");
const nextTimerBtn = document.getElementById("next-timer-btn");
const prevTimerBtn = document.getElementById("prev-timer-btn");
const managerTimersBtn = document.getElementById("manage-timers-btn")

const SECOND = 1_000;

let targetTime;
let timerId;
let timerBarId;
let msToRun;
let timerIndex = 0;
let useUpperboundTimer = false;
let runningTimers = [];
let timerRunning = false;

// Retrieves time parsed from recipe card
function getCurrentTimeBlock(timerIndex) {
    const estimatedTimeBoldedText2 = document.getElementById("time-in-bold").textContent;
    timerValueAndUnits = (estimatedTimeBoldedText2.split("+"))[timerIndex];
    return timerValueAndUnits
}

// Converts the time parsed from recipe card to minutes 
function getEstimatedTimeInMinutes(timerIndex, upperBoundTimerIndex=false) {
    timerValueAndUnits = getCurrentTimeBlock(timerIndex);
    if (timerValueAndUnits.includes("-")) {
        timerValueAndUnits = timerValueAndUnits.split("-")
        if (!upperBoundTimerIndex) {
            lowerBoundTimeValue = timerValueAndUnits[0]
            lowerBoundTimeUnit = timerValueAndUnits[0].at(-1).at(-1)
            hasUnitSpecified = lowerBoundTimeUnit.includes("minute") || lowerBoundTimeUnit.includes("hour")
            if (!hasUnitSpecified) {
                lowerBoundTimeUnit = timerValueAndUnits.at(-1)
            }
            digitsStr = lowerBoundTimeValue.replace(/\D/g, '')
            if (lowerBoundTimeUnit.includes("minute")) {
                return parseInt(digitsStr);
            }
            else {
                return parseInt(digitsStr) * 60;
            }
        }
        else {
            upperBoundTimeValue = timerValueAndUnits.at(-1)
            upperBoundTimeUnit = timerValueAndUnits[0].at(-1).at(-1)
            hasUnitSpecified = upperBoundTimeUnit.includes("minute") || upperBoundTimeUnit.includes("hour")
            if (!hasUnitSpecified) {
                upperBoundTimeUnit = timerValueAndUnits.at(-1)
            }
            digitsStr = upperBoundTimeValue.replace(/\D/, '')
            if (upperBoundTimeUnit.includes("minute")) {
                return parseInt(digitsStr);
            }
            else {
                return parseInt(digitsStr) * 60;
            }
        }
    }
    if (timerValueAndUnits.includes("minute")) {
        return parseInt(timerValueAndUnits);
    }
    else {
        return parseInt(timerValueAndUnits) * 60;
    }
}


// Returns the hours, minutes, and seconds left on timer
function getTimeOnTimer() {
    timerText = visibleCountdown.textContent;
    timerText = timerText.split(":").map(text => Number(text));
    console.log(timerText)
    const [ seconds=0, minutes=0, hours=0 ] = timerText.reverse();
    return { hours, minutes, seconds }
}


// Initializes time variables
function initializeTimer() {
    // Assigns rate at which to call updateTimer and updateTimerBar and the IDs to stop calls
    if (timerId | timerBarId) {
        clearInterval(timerId)
        clearInterval(timerBarId)
    }
    timerId = setInterval(updateTimer, SECOND);
    timerBarId = setInterval(updateTimerBar, SECOND / 20);
}


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


// Converts seconds to proper time format (e.g. 30:00)
function calculate_padded_time(secondsLeft) {
    // Calculates minutes and seconds
    if (secondsLeft >= 3600) {
        const hoursWithDecimal = secondsLeft / 3600;
        hours = Math.trunc(hoursWithDecimal) % 60;
        const minutesWithDecimal =  (hoursWithDecimal - hours) * 60;
        minutes = Math.trunc(minutesWithDecimal) % 60;

        seconds = Math.round((minutesWithDecimal - minutes) * 60, 2) % 60;

        // Pads minutes and seconds with "0s" if necessary
        minutes = padTime(minutes);
        seconds = padTime(seconds);

        return `${hours}:${minutes}:${seconds}`;
    }
    else {
        const minutesWithDecimal = secondsLeft / 60;
        minutes = Math.trunc(minutesWithDecimal)
        seconds = Math.round((minutesWithDecimal - minutes) * 60, 2);
    
        // Pads seconds with "0s" if necessary
        seconds = padTime(seconds);

        return `${minutes}:${seconds}`;
    }
}


// Updates the time of the timer every second until time runs out
function updateTimer() {
    remainingTimeMs = targetTime - Date.now();
    remainingTimeS = remainingTimeMs / 1_000;

    // Updates timer to display updated time left
    if (remainingTimeS >= 0) {
        visibleCountdown.textContent = calculate_padded_time(remainingTimeS)
    }
    else {
        visibleCountdown.textContent = "0:00";
    }

    // Stops timer when time runs out and makes text flash
    if (remainingTimeS <= 0) {
        clearInterval(timerId);
        clearInterval(timerBarId);

        playAlarm();
    }
}


// Updates progress bar animation to be much smoother using ms
function updateTimerBar() {
    remainingTimeMs = targetTime - Date.now();
    timerBar.value = remainingTimeMs / msToRun;
}


// Plays alarm for 3 seconds before stopping
async function playAlarm() {
    const audio = new Audio("audio/Beep_alarm_clock.ogg")
    let alarmOffId;
    await audio.play()
    alarmOffId = setInterval(flashTimer, SECOND / 4);
    setTimeout(function() {
        clearInterval(alarmOffId);
        audio.pause()
    }, 3_000);
}

// Simulates the timer running on screen
playBtn.addEventListener(
    "click", () => {
        let {hours, minutes, seconds} = getTimeOnTimer();
        timerRunning = true;
        secondsToRun = (hours * 60 * 60) + (minutes * 60) + seconds
        visibleCountdown.textContent = calculate_padded_time(secondsToRun)
        msToRun = secondsToRun * 1_000;
        targetTime = Date.now() + msToRun;
        initializeTimer();
        playBtn.style.display = "none";
        stopBtn.style.display = "block";
    }
);

// Pauses the on-screen timer
stopBtn.addEventListener(
    "click", () => {
        timerRunning = false;
        clearInterval(timerId);
        clearInterval(timerBarId);
        playBtn.style.display = "block";
        stopBtn.style.display = "none";
    }
);

// Resets the on-screen alarm to initial starting time
resetBtn.addEventListener(
    "click", () => {
        let minutes = getEstimatedTimeInMinutes(timerIndex);
        let secondsToRun = minutes * 60;
        visibleCountdown.textContent = calculate_padded_time(secondsToRun);
        timerBar.value = 1;
        clearInterval(timerId);
        clearInterval(timerBarId);
        playBtn.style.display = "block";
        stopBtn.style.display = "none";
    }
);

// Pulls up dropdown for timer
moreOptionsBtn.addEventListener(
    "click", () => {
        dropdownContentVisible = dropdownContent.style.display;
        if (dropdownContentVisible == "block") {
            dropdownContent.style.display = "none";
        }
        else {
            dropdownContent.style.display = "block";
        }
    }
)

// Switches timer to upper/lower bound if present on recipe card
switchTimerBtn.addEventListener(
    "click", () => {
        getNextTimer = null;

        if (!getCurrentTimeBlock(timerIndex).includes("-")) {
            switchTimerBtn.style.cursor = "not-allowed"
            switchTimerBtn.style.color = "gray";
            return;
        }
        else {
            switchTimerBtn.style.cursor = "pointer"
            switchTimerBtn.style.color = "black";
        }

        // Toggles for switching bounds
        useUpperboundTimer = !useUpperboundTimer

        let minutes = getEstimatedTimeInMinutes(timerIndex, upperBoundTimerIndex=useUpperboundTimer);
        let secondsToRun = minutes * 60;
        visibleCountdown.textContent = calculate_padded_time(secondsToRun);
        timerBar.value = 1;
        clearInterval(timerId);
        clearInterval(timerBarId);
        playBtn.style.display = "block";
        stopBtn.style.display = "none";
    }
);

// Gets next timer listed on recipe card
nextTimerBtn.addEventListener(
    "click", () => {
        getNextTimer = null;
        // Catches error message when next timer for current instruction doesn't exist
        try {
            getNextTimer = getEstimatedTimeInMinutes(timerIndex + 1);
        }
        catch {
            nextTimerBtn.style.cursor = "not-allowed"
            nextTimerBtn.style.color = "gray";
            return;
        }

        timerIndex += 1;

        if (!getCurrentTimeBlock(timerIndex).includes("-")) {
            switchTimerBtn.style.cursor = "not-allowed"
            switchTimerBtn.style.color = "gray";
        }
        else {
            switchTimerBtn.style.cursor = "pointer"
            switchTimerBtn.style.color = "black";
        }

        if (!getCurrentTimeBlock(timerIndex + 1)) {
            nextTimerBtn.style.cursor = "not-allowed"
            nextTimerBtn.style.color = "gray";
        }

        prevTimerBtn.style.cursor = "pointer";
        prevTimerBtn.style.color = "black"

        let minutes = getEstimatedTimeInMinutes(timerIndex);
        let secondsToRun = minutes * 60;
        visibleCountdown.textContent = calculate_padded_time(secondsToRun);
        timerBar.value = 1;
        clearInterval(timerId);
        clearInterval(timerBarId);
        playBtn.style.display = "block";
        stopBtn.style.display = "none";
        // }
    }
);

// Gets previous timer listed on recipe card
prevTimerBtn.addEventListener(
    "click", () => {
        getPrevTimer = null;
        useUpperboundTimer = false;

        // Catches error message when next timer for current instruction doesn't exist
        try {
            getPrevTimer = getEstimatedTimeInMinutes(timerIndex - 1);
        }
        catch {
            prevTimerBtn.style.cursor = "not-allowed"
            prevTimerBtn.style.color = "gray";
            return;
        }

        timerIndex -= 1;

        if (!getCurrentTimeBlock(timerIndex).includes("-")) {
            switchTimerBtn.style.cursor = "not-allowed"
            switchTimerBtn.style.color = "gray";
        }
        else {
            switchTimerBtn.style.cursor = "pointer"
            switchTimerBtn.style.color = "black";
        }

        if (!getCurrentTimeBlock(timerIndex - 1)) {
            prevTimerBtn.style.cursor = "not-allowed"
            prevTimerBtn.style.color = "gray";
        }

        nextTimerBtn.style.cursor = "pointer";
        nextTimerBtn.style.color = "black"


        let minutes = getEstimatedTimeInMinutes(timerIndex);
        let secondsToRun = minutes * 60;
        visibleCountdown.textContent = calculate_padded_time(secondsToRun);
        timerBar.value = 1;
        clearInterval(timerId);
        clearInterval(timerBarId);
        playBtn.style.display = "block";
        stopBtn.style.display = "none";
    }
);
