const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SERVER_EMAIL,
        pass: process.env.SERVER_EMAIL_APP_PASSWORD
    }
});

exports.sendVerificationEmail = async (email) => {
    const token = jwt.sign(
        { email: email },
        process.env.JSON_WEB_TOKEN_SECRET
    );

    const verificationLink = `${process.env.APP_URL}/verify?token=${token}`;
    await transporter.sendMail({
        from: `"Recipe Book" <${process.env.SERVER_EMAIL}>`,
        to: email,
        subject: "Verify your Recipe Book account",
        html: `<p>Click below to verify your account:</p><a href="${verificationLink}">${verificationLink}</a>`
    });
};
