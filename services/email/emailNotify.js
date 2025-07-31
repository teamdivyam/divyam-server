import nodemailer from "nodemailer";
import { config } from "../../src/config/_config.js"


const transporter = nodemailer.createTransport(
    {
        host: config.SMTP_HOST,
        port: 587 || 465,
        secure: false,
        auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS
        }
    }
);

const EMAIL_NOTIFY = async (to, subject, emailBodyHTML, emailBodyText) => {
    const info = await transporter.sendMail({
        from: 'divyampryj@gmail.com',
        to: to,
        subject: subject || "Message from dev team.",
        html: emailBodyHTML,
        text: emailBodyText
    });

    return info.messageId
}



// (async () => {

//     const to = "whomahtab@gmail.com";
//     const subject = "🔑 Divyam Account - Password Reset Instructions";
//     const emailBody = "<h1> Hello world </h1>";

//     await EMAIL_NOTIFY(to, subject, emailBody)

// })();

export default EMAIL_NOTIFY