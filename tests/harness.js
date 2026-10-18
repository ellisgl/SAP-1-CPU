// Loads the browser scripts into an isolated VM context so they can be tested under Node.
// Run all tests with: npm test
const fs   = require('node:fs');
const path = require('node:path');
const vm   = require('node:vm');

const JS_DIR = path.join(__dirname, '..', 'js');

/**
 * Fake clock - timers only fire when advance() is called, in due-time order.
 */
function createClock() {
    let now    = 0;
    let seq    = 0;
    let timers = [];

    function schedule(fn, ms, interval) {
        const id = ++seq;
        timers.push({ id, fn, due: now + (ms || 0), interval: interval ? (ms || 0) : null });
        return id;
    }

    function clear(id) {
        timers = timers.filter((t) => t.id !== id);
    }

    function advance(ms) {
        const end = now + ms;

        for (;;) {
            const due = timers.filter((t) => t.due <= end).sort((a, b) => a.due - b.due || a.id - b.id);

            if (!due.length) {
                break;
            }

            const timer = due[0];
            now = timer.due;

            if (timer.interval === null) {
                clear(timer.id);
            } else {
                timer.due = now + Math.max(timer.interval, 1);
            }

            timer.fn();
        }

        now = end;
    }

    return {
        setTimeout: (fn, ms) => schedule(fn, ms, false),
        setInterval: (fn, ms) => schedule(fn, ms, true),
        clearTimeout: clear,
        clearInterval: clear,
        advance,
    };
}

/**
 * Minimal stand-in for the DOM elements the scripts touch.
 */
function createDocument() {
    const elements = new Map();

    function makeElement(id) {
        const listeners = {};

        return {
            id,
            checked: false,
            innerText: '',
            attributes: {},
            setAttribute(name, value) {
                this.attributes[name] = value;
            },
            addEventListener(type, fn) {
                (listeners[type] = listeners[type] || []).push(fn);
            },
            dispatch(type) {
                (listeners[type] || []).forEach((fn) => fn({ type, target: this }));
            },
        };
    }

    return {
        getElementById(id) {
            if (!elements.has(id)) {
                elements.set(id, makeElement(id));
            }

            return elements.get(id);
        },
    };
}

/**
 * Run the given scripts (relative to js/) in a fresh context.
 *
 * @param   {string[]} files
 * @returns {{context: object, clock: object, document: object, get: function(string): *, run: function(string): *}}
 */
function load(files) {
    const clock    = createClock();
    const document = createDocument();
    const context  = vm.createContext({
        document,
        EventTarget,
        Event,
        CustomEvent,
        setTimeout: clock.setTimeout,
        setInterval: clock.setInterval,
        clearTimeout: clock.clearTimeout,
        clearInterval: clock.clearInterval,
    });

    for (const file of files) {
        const filename = path.join(JS_DIR, file);
        vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
    }

    // Top-level let/const bindings aren't properties of the context object, so evaluate them by name.
    const run = (code) => vm.runInContext(code, context);

    return { context, clock, document, run, get: run };
}

/**
 * Load the full simulator (helpers, CPU and the front panel wiring in main.js),
 * plus helpers that operate the panel like a user would.
 */
function loadSimulator() {
    const sim = load(['helpers.js', 'cpu.js', 'main.js']);
    const el  = (id) => sim.document.getElementById(id);

    sim.clock.advance(10);

    sim.setSwitch = (id, on) => {
        if (el(id).checked !== on) {
            el(id).checked = on;
            el(id).dispatch('change');
        }
    };

    sim.press = (id) => {
        el(id).dispatch('click');
        sim.clock.advance(20);
    };

    sim.loadProgram = (program) => {
        for (const [addr, data] of Object.entries(program)) {
            for (let b = 0; b < 4; b++) {
                el('A' + b).checked = Boolean((addr >> b) & 1);
            }

            for (let b = 0; b < 8; b++) {
                el('D' + b).checked = Boolean((data >> b) & 1);
            }

            sim.press('load');
        }
    };

    // Clear, enter the program in program mode, then switch to run mode.
    sim.enter = (program, { auto = false } = {}) => {
        sim.setSwitch('run', false);
        sim.press('clear');
        sim.loadProgram(program);
        sim.setSwitch('auto', auto);
        sim.setSwitch('run', true);
    };

    sim.step = (times = 1) => {
        for (let i = 0; i < times; i++) {
            sim.press('step');
        }
    };

    sim.display = () => el('an1').innerText + el('an0').innerText;
    sim.text    = (id) => el(id).innerText;

    return sim;
}

module.exports = { load, loadSimulator };
