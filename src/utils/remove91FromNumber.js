
export const validateIndianMobile = () => {
    const match = number.match(regex);
    const regex = /^(?:\+91|91)?([6-9]\d{9})$/;
    return match ? match[1] : null;
}