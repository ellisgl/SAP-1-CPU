/**
 * Get the Number of bit need for a decimal number.
 */
function getNumBits(dec) {
    return Math.floor((Math.log(dec) / Math.log(2)) + 1);
}

/**
 * Convert a binary (base-2) number to decimal (base-10)
 * @param   bin
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
 * @param dec
 * @param bits
 * @returns {Array}
 */
function dec2bin(dec, bits) {
    dec     = parseInt(dec);
    let bin = dec.toString(2).split('');

    for (let i = 0; i < bin.length; i++) {
        bin[i] = parseInt(bin[i]);
    }

    if (bits) {
        if (bin.length < bits) {
            let x = bits - bin.length;

            for (let j = 0; j < x; j++) {
                bin.unshift(0);
            }
        }
    }

    return bin
}

function bin2hex(bin) {
    let dec = bin2dec(bin);
    return dec.toString(16);
}

/**
 * Pad Left.
 * nr is what you want to have padded
 * n is the number of places
 * str is what you want to have it padded with.
 */
function padLeft(nr, n, str) {
    return Array(n - String(nr).length + 1).join(str || '0') + nr;
}
