const { describe, it }  = require('node:test');
const assert             = require('node:assert/strict');
const { loadSimulator }  = require('./harness');

// Opcodes (upper nibble) - the lower nibble is the RAM address
const LDA = 0x00;
const ADD = 0x10;
const SUB = 0x20;
const OUT = 0xE0;
const HLT = 0xF0;

// Each instruction takes 6 T-states, one per step.
const T_STATES = 6;

/**
 * Build a program that computes `a <op> b` and outputs it.
 */
function arithmetic(op, a, b) {
    return { 0: LDA | 10, 1: op | 11, 2: OUT, 3: HLT, 10: a, 11: b };
}

describe('program mode', () => {
    it('LOAD writes the data switches to the addressed RAM location', () => {
        const sim = loadSimulator();

        sim.loadProgram({ 5: 0xA7, 15: 0x01 });

        assert.equal(sim.get('ram.memory[5]'), 0xA7);
        assert.equal(sim.get('ram.memory[15]'), 0x01);
        assert.equal(sim.text('RAM05'), 'a7');
    });

    it('CLR resets RAM, registers and the program counter', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(ADD, 1, 2));
        sim.step(T_STATES * 2);
        sim.setSwitch('run', false);
        sim.press('clear');

        assert.deepEqual(Array.from(sim.get('ram.memory')), new Array(16).fill(0));
        assert.equal(sim.get('pc.cnt'), 0);
        assert.equal(sim.get('rega'), 0);
        assert.equal(sim.get('regb'), 0);
        assert.equal(sim.get('cu.state'), sim.get('cu.T1'));
    });

    it('STEP does nothing while not in run mode', () => {
        const sim = loadSimulator();

        sim.loadProgram(arithmetic(ADD, 1, 2));
        sim.step(T_STATES);

        assert.equal(sim.get('pc.cnt'), 0);
        assert.equal(sim.get('cu.state'), sim.get('cu.T1'));
    });
});

describe('run mode, manual stepping', () => {
    it('steps through the ring counter one T-state at a time', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(ADD, 1, 2));

        for (const expected of ['T2', 'T3', 'T4', 'T5', 'T6', 'T1']) {
            sim.step();
            assert.equal(sim.get('cu.state'), sim.get('cu.' + expected), `expected ${expected}`);
        }
    });

    it('increments the program counter once per instruction fetch', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(ADD, 1, 2));
        sim.step(T_STATES);
        assert.equal(sim.get('pc.cnt'), 1);

        sim.step(T_STATES);
        assert.equal(sim.get('pc.cnt'), 2);
        assert.equal(sim.text('PC'), '02');
    });

    it('LDA loads RAM into the accumulator', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(ADD, 0x42, 0));
        sim.step(T_STATES);

        assert.equal(sim.get('rega'), 0x42);
        assert.equal(sim.text('rega'), '42');
    });

    it('runs the sample program: 1 + 2 = 3', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(ADD, 1, 2));
        sim.step(T_STATES * 4);

        assert.equal(sim.display(), '03');
        assert.equal(sim.get('rega'), 3);
        assert.equal(sim.get('regb'), 2);
        assert.equal(sim.get('nHLT'), 0);
        assert.equal(sim.text('OPCODE'), 'F HLT');
    });

    it('subtracts: 5 - 3 = 2', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(SUB, 5, 3));
        sim.step(T_STATES * 4);

        assert.equal(sim.display(), '02');
    });

    it('wraps addition past 255: 200 + 100 = 44', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(ADD, 200, 100));
        sim.step(T_STATES * 4);

        assert.equal(sim.display(), '2c');
    });

    it('wraps subtraction below 0: 1 - 2 = 255', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(SUB, 1, 2));
        sim.step(T_STATES * 4);

        assert.equal(sim.display(), 'ff');
    });

    it('chains instructions: 10 + 20 - 5 = 25', () => {
        const sim = loadSimulator();

        sim.enter({ 0: LDA | 12, 1: ADD | 13, 2: SUB | 14, 3: OUT, 4: HLT, 12: 10, 13: 20, 14: 5 });
        sim.step(T_STATES * 5);

        assert.equal(sim.display(), '19');
    });

    it('stops executing after HLT', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(ADD, 1, 2));
        sim.step(T_STATES * 4);

        const pc    = sim.get('pc.cnt');
        const state = sim.get('cu.state');

        sim.step(T_STATES * 2);

        assert.equal(sim.get('pc.cnt'), pc);
        assert.equal(sim.get('cu.state'), state);
    });
});

describe('run mode, auto clock', () => {
    it('GO runs the program to completion', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(ADD, 1, 2), { auto: true });
        sim.press('start');
        sim.clock.advance(60000);

        assert.equal(sim.display(), '03');
        assert.equal(sim.get('nHLT'), 0);
    });

    it('pressing GO again stops the clock', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(ADD, 1, 2), { auto: true });
        sim.press('start');
        sim.clock.advance(3000);
        sim.press('start');

        const pc    = sim.get('pc.cnt');
        const state = sim.get('cu.state');

        sim.clock.advance(10000);

        assert.equal(sim.get('pc.cnt'), pc);
        assert.equal(sim.get('cu.state'), state);
        assert.equal(sim.get('nHLT'), 1);
    });

    it('STEP is ignored while in auto mode', () => {
        const sim = loadSimulator();

        sim.enter(arithmetic(ADD, 1, 2), { auto: true });
        sim.step(T_STATES);

        assert.equal(sim.get('pc.cnt'), 0);
    });
});
