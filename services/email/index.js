
import EMAIL_NOTIFY from "./emailNotify.js";


const SEND_EMAIL = async (EMAIL_TYPE, to, subject, emailBodyHTML, emailBodyText) => {
    if (!EMAIL_TYPE) return;

    switch (EMAIL_TYPE) {
        case "RESET_ADMIN_PASSWORD": {
            await EMAIL_NOTIFY(to, subject, emailBodyHTML, emailBodyText);
        }

        default: {
            return
        }
    }
}

export default SEND_EMAIL;