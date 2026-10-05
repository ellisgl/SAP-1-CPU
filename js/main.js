// Using events instead of 'Object.observe'.
// This way should be 'faster' and work 100% of the time.
var ee = new EventEmitter();

function startedEvent() {
    //$('#start').text('STOP');
}

function stoppedEvent() {
    //$('#start').text('START');
}

function outputEvent() {
    setTimeout(function () {
        let outbin = dec2bin(OBUS, 8);

        let an0 = document.getElementById('an0');
        let an1 = document.getElementById('an1');

        an0.innerText = bin2hex([outbin[4], outbin[5], outbin[6], outbin[7]]);
        an1.innerText = bin2hex([outbin[0], outbin[1], outbin[2], outbin[3]]);
    }, 1)
}

function updateStateEvent() {
    document.getElementById('state').innerText = getNumBits(cu.state);
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
    document.getElementById('PC').innerText = padLeft(pc.cnt, 2);
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
    document.getElementById('rega').innerText = padLeft(rega.toString(16), 2);
}

function updateREGBevent() {
    document.getElementById('regb').innerText = padLeft(regb.toString(16), 2);
}

function updateRAMevent() {
    document.getElementById('RAM00').innerText = padLeft(ram.memory[0].toString(16), 2);
    document.getElementById('RAM01').innerText = padLeft(ram.memory[1].toString(16), 2);
    document.getElementById('RAM02').innerText = padLeft(ram.memory[2].toString(16), 2);
    document.getElementById('RAM03').innerText = padLeft(ram.memory[3].toString(16), 2);
    document.getElementById('RAM04').innerText = padLeft(ram.memory[4].toString(16), 2);
    document.getElementById('RAM05').innerText = padLeft(ram.memory[5].toString(16), 2);
    document.getElementById('RAM06').innerText = padLeft(ram.memory[6].toString(16), 2);
    document.getElementById('RAM07').innerText = padLeft(ram.memory[7].toString(16), 2);
    document.getElementById('RAM08').innerText = padLeft(ram.memory[8].toString(16), 2);
    document.getElementById('RAM09').innerText = padLeft(ram.memory[9].toString(16), 2);
    document.getElementById('RAM10').innerText = padLeft(ram.memory[10].toString(16), 2);
    document.getElementById('RAM11').innerText = padLeft(ram.memory[11].toString(16), 2);
    document.getElementById('RAM12').innerText = padLeft(ram.memory[12].toString(16), 2);
    document.getElementById('RAM13').innerText = padLeft(ram.memory[13].toString(16), 2);
    document.getElementById('RAM14').innerText = padLeft(ram.memory[14].toString(16), 2);
    document.getElementById('RAM15').innerText = padLeft(ram.memory[15].toString(16), 2);
}

(function () {
    ee.addListeners('CLK', [cu.CLKEvent, pc.CLKevent, mar.CLKevent, ir.CLKevent, accumulator.CLKevent, registerb.CLKevent, outputreg.CLKevent]);
    ee.addListeners('CLR', [cu.CLRevent, pc.CLRevent, ir.CLRevent]);
    ee.addListener('load', inputreg.loadEvent);
    ee.addListener('start', inputreg.startEvent);
    ee.addListener('started', startedEvent);
    ee.addListener('stopped', stoppedEvent);
    ee.addListener('nCE', ram.nCEevent);
    ee.addListener('ENmar', mar.ENmarEvent);
    ee.addListener('nWEram', ram.nWEramEvent);
    ee.addListener('ALU', alu.ALUevent);
    ee.addListener('run', cu.runEvent);
    ee.addListener('step', inputreg.stepEvent);
    ee.addListener('output', outputEvent);

    ee.addListener('updateState', updateStateEvent);
    ee.addListener('updateADDR', updateADDRevent);
    ee.addListener('updateWBUS', updateWBUSevent);
    ee.addListener('updatePC', updatePCevent);
    ee.addListener('updateOPCODE', updateOPCODEevent);
    ee.addListener('updateREGA', updateREGAevent);
    ee.addListener('updateREGB', updateREGBevent);
    ee.addListener('updateRAM', updateRAMevent);

    // Get this party started!
    ee.emitEvent('run');
    ee.emitEvent('updateRAM');

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

        ee.emitEvent('load', [bin2dec([a3, a2, a1, a0]), bin2dec([d7, d6, d5, d4, d3, d2, d1, d0])]);
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
        ee.emitEvent('run');
    });

    document.getElementById('auto').addEventListener('change', function (e) {
        inputreg.auto = e.target.checked;
    });

    document.getElementById('start').addEventListener('click', function () {
        ee.emitEvent('start');
    });
})();