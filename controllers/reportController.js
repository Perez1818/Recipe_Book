const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SERVER_EMAIL,
        pass: process.env.SERVER_EMAIL_APP_PASSWORD
    }
});

exports.reportStepComment = async (req, res) => { //sends email to email from same email
    const { username, recipeId, stepNum, content } = req.body;
    await transporter.sendMail({
        from: `"Recipe Book" <${process.env.SERVER_EMAIL}>`,
        to: process.env.SERVER_EMAIL,
        subject: "Reported Step Comment",
        html: `<p><b>User:</b> ${username}<br>
               <b>Recipe ID:</b> ${recipeId}<br>
               <b>Step Number:</b> ${stepNum}<br>
               <b>Content:</b> ${content}</p>`
    });
    res.json({ message: "Reported" });
};