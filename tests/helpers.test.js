const { describe, it } = require('node:test');
const assert            = require('node:assert/strict');
const { load }          = require('./harness');

const { getNumBits, bin2dec, bin2hex, ...helpers } = load(['helpers.js']).context;

// Arrays from the VM context have a different Array prototype, which strict deepEqual rejects.
const dec2bin = (dec, bits) => Array.from(helpers.dec2bin(dec, bits));

describe('getNumBits', () => {
    it('returns the bit position of the ring counter states', () => {
        assert.deepEqual([1, 2, 4, 8, 16, 32].map(getNumBits), [1, 2, 3, 4, 5, 6]);
    });

    it('returns the number of bits needed for a value', () => {
        assert.equal(getNumBits(255), 8);
        assert.equal(getNumBits(256), 9);
    });
});

describe('bin2dec', () => {
    it('converts an array of bits, most significant first', () => {
        assert.equal(bin2dec([1, 0, 1, 0]), 10);
        assert.equal(bin2dec([1, 1, 1, 1, 1, 1, 1, 1]), 255);
        assert.equal(bin2dec([0, 0, 0, 0]), 0);
    });

    it('accepts checkbox booleans', () => {
        assert.equal(bin2dec([true, false, true, true]), 11);
    });

    it('accepts string digits', () => {
        assert.equal(bin2dec(['0', '1', '1']), 3);
    });

    it('returns 0 for an empty array', () => {
        assert.equal(bin2dec([]), 0);
    });
});

describe('dec2bin', () => {
    it('converts to an array of numeric bits', () => {
        assert.deepEqual(dec2bin(10), [1, 0, 1, 0]);
        assert.deepEqual(dec2bin(0), [0]);
    });

    it('pads with leading zeros to the requested width', () => {
        assert.deepEqual(dec2bin(3, 8), [0, 0, 0, 0, 0, 0, 1, 1]);
        assert.deepEqual(dec2bin(0, 4), [0, 0, 0, 0]);
    });

    it('does not truncate values wider than the requested width', () => {
        assert.deepEqual(dec2bin(31, 4), [1, 1, 1, 1, 1]);
    });

    it('drops any fractional part', () => {
        assert.deepEqual(dec2bin(5.9, 4), [0, 1, 0, 1]);
    });

    it('round-trips with bin2dec for every byte value', () => {
        for (let n = 0; n < 256; n++) {
            assert.equal(bin2dec(dec2bin(n, 8)), n);
        }
    });
});

describe('bin2hex', () => {
    it('converts a bit array to lowercase hex', () => {
        assert.equal(bin2hex([1, 1, 1, 0]), 'e');
        assert.equal(bin2hex([1, 1, 1, 1, 1, 1, 1, 1]), 'ff');
        assert.equal(bin2hex([0, 0, 0, 0]), '0');
    });
});
