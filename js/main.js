// Using events instead of 'Object.observe'.
// This way should be 'faster' and work 100% of the time.
const ee = new EventTarget();

function startedEvent() {
    //$('#start').text('STOP');
}

function stoppedEvent() {
    //$('#start').text('START');
}

function outputEvent() {
    setTimeout(function () {
        let outBin = dec2bin(OBUS, 8);

        let an0 = document.getElementById('an0');
        let an1 = document.getElementById('an1');

        an0.innerText = bin2hex([outBin[4], outBin[5], outBin[6], outBin[7]]);
        an1.innerText = bin2hex([outBin[0], outBin[1], outBin[2], outBin[3]]);
    }, 1)
}

function updateStateEvent() {
    document.getElementById('state').innerText = String(getNumBits(cu.state));
}

function updateADDRevent() {
    // Wait 1 ms to make sure WBUS is set.
    setTimeout(function () {
        let b = dec2bin(ramaddr, 4);

        document.getElementById('addr0').setAttribute('class', b[3] ? 'ledRed' : 'ledOff');
        document.getElementById('addr1').setAttribute('class', b[2] ? 'ledRed' : 'ledOff');
        document.getElementById('addr2').setAttribute('class', b[1] ? 'ledRed' : 'ledOff');
        document.getElementById('addr3').setAttribute('class', b[0] ? 'ledRed' : 'ledOff');
    }, 1);
}

function updateWBUSevent() {
    // Wait 1 ms to make sure WBUS is set.
    setTimeout(function () {
        let b = dec2bin(WBUS, 8);

        document.getElementById('data0').setAttribute('class', b[7] ? 'ledRed' : 'ledOff');
        document.getElementById('data1').setAttribute('class', b[6] ? 'ledRed' : 'ledOff');
        document.getElementById('data2').setAttribute('class', b[5] ? 'ledRed' : 'ledOff');
        document.getElementById('data3').setAttribute('class', b[4] ? 'ledRed' : 'ledOff');
        document.getElementById('data4').setAttribute('class', b[3] ? 'ledRed' : 'ledOff');
        document.getElementById('data5').setAttribute('class', b[2] ? 'ledRed' : 'ledOff');
        document.getElementById('data6').setAttribute('class', b[1] ? 'ledRed' : 'ledOff');
        document.getElementById('data7').setAttribute('class', b[0] ? 'ledRed' : 'ledOff');

    }, 1);
}

function updatePCevent() {
    document.getElementById('PC').innerText = String(pc.cnt).padStart(2, '0');
}

function updateOPCODEevent() {
    let txt;

    switch (opcode) {
        case 0:
            txt = '0 LDA';
            break;
        case 1:
            txt = '1 ADD';
            break;
        case 2:
            txt = '2 SUB';
            break;
        case 14:
            txt = 'E OUT';
            break;
        case 15:
            txt = 'F HLT';
            break;
        default:
            txt = opcode.toString(16) + ' ???';
    }

    document.getElementById('OPCODE').innerText = txt;
}

function updateREGAevent() {
    document.getElementById('rega').innerText = rega.toString(16).padStart(2, '0');
}

function updateREGBevent() {
    document.getElementById('regb').innerText = regb.toString(16).padStart(2, '0');
}

function updateRAMevent() {
    document.getElementById('RAM00').innerText = ram.memory[0].toString(16).padStart(2, '0');
    document.getElementById('RAM01').innerText = ram.memory[1].toString(16).padStart(2, '0');
    document.getElementById('RAM02').innerText = ram.memory[2].toString(16).padStart(2, '0');
    document.getElementById('RAM03').innerText = ram.memory[3].toString(16).padStart(2, '0');
    document.getElementById('RAM04').innerText = ram.memory[4].toString(16).padStart(2, '0');
    document.getElementById('RAM05').innerText = ram.memory[5].toString(16).padStart(2, '0');
    document.getElementById('RAM06').innerText = ram.memory[6].toString(16).padStart(2, '0');
    document.getElementById('RAM07').innerText = ram.memory[7].toString(16).padStart(2, '0');
    document.getElementById('RAM08').innerText = ram.memory[8].toString(16).padStart(2, '0');
    document.getElementById('RAM09').innerText = ram.memory[9].toString(16).padStart(2, '0');
    document.getElementById('RAM10').innerText = ram.memory[10].toString(16).padStart(2, '0');
    document.getElementById('RAM11').innerText = ram.memory[11].toString(16).padStart(2, '0');
    document.getElementById('RAM12').innerText = ram.memory[12].toString(16).padStart(2, '0');
    document.getElementById('RAM13').innerText = ram.memory[13].toString(16).padStart(2, '0');
    document.getElementById('RAM14').innerText = ram.memory[14].toString(16).padStart(2, '0');
    document.getElementById('RAM15').innerText = ram.memory[15].toString(16).padStart(2, '0');
}

(function () {
    [cu.CLKEvent, pc.CLKevent, mar.CLKevent, ir.CLKevent, accumulator.CLKevent, registerb.CLKevent, outputreg.CLKevent].forEach((fn) => ee.addEventListener('CLK', fn));
    [cu.CLRevent, pc.CLRevent, ir.CLRevent].forEach((fn) => ee.addEventListener('CLR', fn));
    ee.addEventListener('load', (e) => inputreg.loadEvent(...e.detail));
    ee.addEventListener('start', inputreg.startEvent);
    ee.addEventListener('started', startedEvent);
    ee.addEventListener('stopped', stoppedEvent);
    ee.addEventListener('nCE', ram.nCEevent);
    ee.addEventListener('ENmar', mar.ENmarEvent);
    ee.addEventListener('nWEram', ram.nWEramEvent);
    ee.addEventListener('ALU', alu.ALUevent);
    ee.addEventListener('run', cu.runEvent);
    ee.addEventListener('step', inputreg.stepEvent);
    ee.addEventListener('output', outputEvent);

    ee.addEventListener('updateState', updateStateEvent);
    ee.addEventListener('updateADDR', updateADDRevent);
    ee.addEventListener('updateWBUS', updateWBUSevent);
    ee.addEventListener('updatePC', updatePCevent);
    ee.addEventListener('updateOPCODE', updateOPCODEevent);
    ee.addEventListener('updateREGA', updateREGAevent);
    ee.addEventListener('updateREGB', updateREGBevent);
    ee.addEventListener('updateRAM', updateRAMevent);

    // Get this party started!
    ee.dispatchEvent(new Event('run'));
    ee.dispatchEvent(new Event('updateRAM'));

    document.getElementById('load').addEventListener('click', function () {
        let a3 = document.getElementById('A3').checked;
        let a2 = document.getElementById('A2').checked;
        let a1 = document.getElementById('A1').checked;
        let a0 = document.getElementById('A0').checked;

        let d7 = document.getElementById('D7').checked;
        let d6 = document.getElementById('D6').checked;
        let d5 = document.getElementById('D5').checked;
        let d4 = document.getElementById('D4').checked;
        let d3 = document.getElementById('D3').checked;
        let d2 = document.getElementById('D2').checked;
        let d1 = document.getElementById('D1').checked;
        let d0 = document.getElementById('D0').checked;

        ee.dispatchEvent(new CustomEvent('load', { detail: [bin2dec([a3, a2, a1, a0]), bin2dec([d7, d6, d5, d4, d3, d2, d1, d0])] }));
    });

    document.getElementById('step').addEventListener('click', function () {
        inputreg.stepEvent();
    });

    document.getElementById('clear').addEventListener('click', function () {
        inputreg.clearEvent();
        updateWBUSevent();
        updateADDRevent();
        updateStateEvent();
        updateOPCODEevent();
        updatePCevent();
        updateRAMevent();
        updateREGAevent();
        updateREGBevent();
    });

    document.getElementById('run').addEventListener('change', function (e) {
        run = e.target.checked;
        ee.dispatchEvent(new Event('run'));
    });

    document.getElementById('auto').addEventListener('change', function (e) {
        inputreg.auto = e.target.checked;
    });

    document.getElementById('start').addEventListener('click', function () {
        ee.dispatchEvent(new Event('start'));
    });
})();