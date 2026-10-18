/**
 * Get the Number of bit need for a decimal number.
 * @param {number} dec
 * @returns {number}
 */
function getNumBits(dec) {
    return Math.floor((Math.log(dec) / Math.log(2)) + 1);
}

/**
 * Convert a binary (base-2) number to decimal (base-10)
 * @param   {Array<number|boolean|string>} bin
 * @returns {number}
 */
function bin2dec(bin) {
    let p   = 1; // Places
    let len = bin.length;
    let dec = 0; // Return value

    for (let i = 0; i < len; i++) {
        dec = dec + bin.pop() * p;
        p   = p * 2;
    }

    return dec;
}

/**
 * Convert a decimal (base-10) to binary (base-2) (Array format)
 * @param   {number} dec
 * @param   {number} [bits] - Minimum number of bits; pads with leading zeros
 * @returns {number[]}
 */
function dec2bin(dec, bits) {
    return Math.trunc(dec).toString(2).padStart(bits || 0, '0').split('').map(Number);
}

/**
 * Convert a binary number to hexadecimal
 * @param bin
 * @returns {string} 
 */
function bin2hex(bin) {
    let dec = bin2dec(bin);
    return dec.toString(16);
}
