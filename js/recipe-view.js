const navigateWalkthroughContainer = document.getElementById("navigate-walkthrough");
const stepFractionPresentation = document.getElementById("completion-fraction");
const progressBar = document.getElementById("completion-progress");
const stepCounter = document.getElementById("step-counter");

let [ getPreviousStep, getNextStep ] = navigateWalkthroughContainer.getElementsByTagName("button");
let { currentStep, lastStep } = getSteps();

progressBar.value = currentStep / lastStep;
getPreviousStep.style.cursor = "not-allowed";
getPreviousStep.disabled = true;

function getSteps() {
    let [ currentStep, lastStep ] = stepFractionPresentation.textContent.split(" / ");
    currentStep = parseInt(currentStep);
    return { currentStep, lastStep};
}

getPreviousStep.addEventListener("click", () => {
    let { currentStep, lastStep } = getSteps();

    if (currentStep != 1) {
        currentStep -= 1;
        stepFractionPresentation.textContent = `${currentStep} / ${lastStep}`;
        stepCounter.textContent = currentStep;
        progressBar.value = currentStep / lastStep;

        if (currentStep == 1) {
            getPreviousStep.style.cursor = "not-allowed";
            getPreviousStep.disabled = true;
        }
        getNextStep.disabled = false;
        getNextStep.style.cursor = "pointer";
    }
})

getNextStep.addEventListener("click", () => {
    let { currentStep, lastStep } = getSteps();

    if (currentStep != lastStep) {
        currentStep += 1;
        stepFractionPresentation.textContent = `${currentStep} / ${lastStep}`;
        stepCounter.textContent = currentStep;
        progressBar.value = currentStep / lastStep;

        if (currentStep == lastStep) {
            getNextStep.style.cursor = "not-allowed";
            getNextStep.disabled = true;
        }
        getPreviousStep.disabled = false;
        getPreviousStep.style.cursor = "pointer";
    }
})