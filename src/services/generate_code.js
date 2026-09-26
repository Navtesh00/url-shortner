import shortid from "shortid";

const CODE_LENGTH = 6;
const CODE_PATTERN = /^[A-Za-z0-9]+$/;

function generateShortCode(length = CODE_LENGTH) {
    let code = shortid.generate().slice(0, length);

    //shortid can emit - and _, which the URL schema and isValidCode reject
    while (!CODE_PATTERN.test(code)) {
        code = shortid.generate().slice(0, length);
    }

    return code;
}

export default generateShortCode;
