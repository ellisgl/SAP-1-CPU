// Wonder if if I should put this in it's own object - ie cpu = {};
// Init our signals and buses
var CLK    = 0;
var nCLK   = 1;
var CLR    = 0;
var nCLR   = 1;
var run    = 0;
var Cp     = 0;
var Ep     = 0;
var nLm    = 1;
var ENmar  = 0;
var nWEram = 1;
var nCE    = 1;
var nLi    = 1;
var nEi    = 1;
var nLa    = 1;
var Ea     = 0;
var Su     = 0;
var Eu     = 0;
var nLb    = 1;
var nLo    = 1;
var enio   = 1;
var nHLT   = 1;

// Data path to RAM from MAR
var ramaddr = 0;

// Data path to ALU from register
var rega = 0;
var regb = 0;

// Data path from IR to CU
var opcode = 0;

// Buses
var WBUS = 0;
var ABUS = 0;
var OBUS = 0;

/**
 * Invert our clcoks
 */
function CLOCK()
{
    CLK  = !CLK;
    nCLK = !nCLK;
    ee.emitEvent('CLK')
}

/**
 * Takes the external input (web interface) and send it over the CPU
 */
var inputreg = {
    auto      : 0,
    start     : 0,
    clkint    : 0,
    addr      : 0,
    data      : 0,
    loadEvent : function (a, d)
    {
        if(enio)
        {
            // Load up the ABUS and WBUS
            ABUS = a;
            WBUS = d;

            // Load to RAM (Write Enable)
            nWEram = 0;
            ee.emitEvent('ENmar');  // Have to trigger MAR.
            ee.emitEvent('nWEram'); // Emitting event to trigger ram 'class' to do it's thing.

            // Turn off Write Enable after a couple milliseconds.
            // Simulates depressing the button.
            setTimeout(function ()
            {
                nWEram = 1;
            }, 10);
        }
    },
    stepEvent : function ()
    {
        if(run && !inputreg.auto && nHLT)
        {
            // Invert clock and emit the event
            CLOCK();

            // Trigger it again to comeback to opposite state.
            // Simulates depressing the button.
            setTimeout(function ()
            {
                CLOCK();
            }, 10);
        }
    },
    clearEvent: function ()
    {
        CLR  = 1;
        nCLR = 0;

        ee.emitEvent('CLR');

        setTimeout(function ()
        {
            CLR  = 0;
            nCLR = 1;

            ee.emitEvent('CLR');
        }, 10);

    },
    startEvent: function ()
    {
        if(run && inputreg.auto && nHLT)
        {
            inputreg.start = (inputreg.start) ? 0 : 1;

            if(inputreg.start)
            {
                // 1Hz clcok
                inputreg.clkint = setInterval(function ()
                {
                    CLOCK();
                }, 500);
                ee.emitEvent('started');
            }
            else
            {
                // No more auto clocking
                clearInterval(inputreg.clkint);

                CLK  = 0;
                nCLK = 1;

                ee.emitEvent('stopped');
            }
        }
    },
    CLKevent  : function ()
    {
        // Stop the clock on halt.
        if(!nHLT)
        {
            if(inputreg.clkint)
            {
                clearInterval(inputreg.clkint);
            }

            CLK  = 0;
            nCLK = 1;
        }
    }

};

/**
 * Control Unit - AKA the Boss of the CPU
 */
var cu = {
    T1      : 1,
    T2      : 2,
    T3      : 4,
    T4      : 8,
    T5      : 16,
    T6      : 32,
    state   : 1,
    runEvent: function ()
    {
        if(!run)
        {
            Cp       = 0;
            Ep       = 0;
            nLm      = 1;
            nLb      = 1;
            nCE      = 1;
            nLi      = 1;
            nEi      = 1;
            Ea       = 0;
            nLa      = 1;
            Su       = 0;
            Eu       = 0;
            nLo      = 1;
            nHLT     = 1;
            enio     = 1;
            ENmar    = 1;
            cu.state = cu.T1;

        }
        else
        {
            nWEram = 1;
        }
    },
    CLRevent: function ()
    {
        if(!nCLR)
        {
            CLK      = 0;
            Cp       = 0;
            Ep       = 0;
            nLm      = 1;
            nLb      = 1;
            nCE      = 1;
            nLi      = 1;
            nEi      = 1;
            Ea       = 0;
            nLa      = 1;
            Su       = 0;
            Eu       = 0;
            nLo      = 1;
            nHLT     = 1;
            cu.state = cu.T1;
        }
    },
    CLKEvent: function ()
    {
        if(CLK)
        {
            if(run && nHLT)
            {
                ee.emitEvent('updateState');

                // We are in running mode.
                // Combining T-State handler with the ring counter
                // Let's do do stuff at each T-State
                // T1 - T3 = Fetch Cycle
                // T4 - T6 = Execute Cycle
                switch (cu.state)
                {
                    case cu.T1:
                        // Clear out previous T6 signals / Program Mode signals
                        nLa = 1;
                        nCE = 1; // Event driven.
                        Eu  = 0;

                        // Load PC into MAR
                        Ep  = 1;
                        nLm = 0;

                        // Update the ring counter to the next T-State
                        cu.state = cu.T2;
                        ee.emitEvent('updateWBUS');
                        break;
                    case cu.T2:
                        // Clear out previous T1 signals
                        nLm = 1;
                        Ep  = 0;

                        // Increment the PC
                        Cp = 1;

                        // Update the ring counter to the next T-State
                        cu.state = cu.T3;
                        ee.emitEvent('updateWBUS');
                        break;
                    case cu.T3:
                        // Clear out previous T2 signals
                        Cp = 0;

                        // Load Address to MAR, send to RAM output data to IR
                        nCE = 0;
                        nLi = 0;

                        // Have to emit event, since RAM is not clock driven
                        ee.emitEvent('nCE');

                        // Update the ring counter to the next T-State
                        cu.state = cu.T4;
                        ee.emitEvent('updateWBUS');
                        break;
                    case cu.T4:
                        // Clear previous T3 signals
                        nCE = 1;
                        nLi = 1;

                        // Add delay to make sure things are set.
                        setTimeout(function ()
                        {
                            // Start executing what IR decoded.
                            // OPCODES: 0000 - 0010(0-2)
                            // Load Instruction Register from WBUS
                            // Load address from WBUS or ABUS
                            // Simple: Load memory from address outputted from the IR.
                            switch (opcode)
                            {
                                case 0:
                                    // LDA (Load in to Accumulator)
                                    nEi = 0;
                                    nLm = 0;
                                    break;
                                case 1:
                                    // ADD (Load data into Register B and preform addition)
                                    nEi = 0;
                                    nLm = 0;
                                    break;
                                case 2:
                                    // SUB (Load data into Register B and preform subtraction)
                                    nEi = 0;
                                    nLm = 0;
                                    break;
                                case 14:
                                    // OUT (Output to display)
                                    // Ouput Accumulator to WBUS
                                    // Load WBUS into Output Register
                                    Ea  = 1;
                                    nLo = 0;
                                    break;
                                case 15:
                                    // HLT (HALT! Stop everything!)
                                    nHLT = 0;
                                    break;

                            }

                            // Update the ring counter to the next T-State
                            cu.state = cu.T5;
                            ee.emitEvent('updateWBUS');
                        }, 1);
                        break;
                    case cu.T5:
                        // Clear previous T4 signals
                        nEi = 1;
                        nLm = 1;
                        Ea  = 0;
                        nLo = 1;

                        switch (opcode)
                        {
                            case 0:
                                // LDA
                                // Output data from RAM to WBUS
                                // Load data from WBUS to Accumulatorc
                                nCE = 0;
                                nLa = 0;

                                ee.emitEvent('nCE');
                                break;
                            case 1:
                                // ADD
                                // Output data from RAM to WBUS
                                // Load data from WBUS to Register B
                                nCE = 0;
                                nLb = 0;

                                ee.emitEvent('nCE');
                                break;
                            case 2:
                                // SUB
                                // Output data from RAM to WBUS
                                // Load data from WBUS to Register B
                                nCE = 0;
                                nLb = 0;

                                ee.emitEvent('nCE');
                                break;
                            case 14:
                                // OUT
                                break;
                            case 15:
                                // HLT
                                break;

                        }

                        // Update the ring counter to the next T-State
                        cu.state = cu.T6;
                        ee.emitEvent('updateWBUS');
                        break;
                    case cu.T6:
                        // Clear previous T5 signals
                        nLa = 1;
                        nCE = 1;
                        nLb = 1;

                        switch (opcode)
                        {
                            case 0:
                                // LDA
                                break;
                            case 1:
                                // ADD
                                // Set ALU to Addition
                                // Enable ALU output to WBUS
                                // Load data from WBUS to Accumulator
                                Su  = 0;
                                Eu  = 1;
                                nLa = 0;

                                // Have to emit event, since ALU is not clock driven
                                ee.emitEvent('ALU');
                                break;
                            case 2:
                                // SUB
                                // Set ALU to Subtraction
                                // Enable ALU output to WBUS
                                // Load data from WBUS to Accumulator
                                Su  = 1;
                                Eu  = 1;
                                nLa = 0;

                                // Have to emit event, since ALU is not clock driven
                                ee.emitEvent('ALU');
                                break;
                            case 14:
                                // OUT
                                break;
                            case 15:
                                // HLT
                                break;
                        }

                        // Update the ring counter to the next T-State
                        cu.state = cu.T1;
                        ee.emitEvent('updateWBUS');
                        break;
                }
            }
        }
    }
};

/**
 * Instruction Register - decodes addresses and OPCodes from WBUS and feeds them to the CU. Think of it as assistant to the boss,
 * who create a report so the boss can act on it.
 */
var ir = {
    OPCODEreg: 0,
    ADDRreg  : 0,
    WBUSreg  : [0, 0, 0, 0, 0, 0, 0, 0],
    CLRevent : function ()
    {
        ir.opcodereg = 0;
    },
    CLKevent : function ()
    {
        if(!nEi)
        {
            // nEi is not bound to CLK or !CLK, so output the address on request.
            var ADDRbin = dec2bin(ir.ADDRreg, 4);
            var WBUStmp = bin2dec([ir.WBUSreg[0], ir.WBUSreg[1], ir.WBUSreg[2], ir.WBUSreg[3], ADDRbin[0], ADDRbin[1], ADDRbin[2], ADDRbin[3]]);
            WBUS        = bin2dec(WBUStmp);
        }

        if(CLK)
        {
            // Setup the OPCDOE with previous conversion
            opcode = ir.OPCODEreg;
            ee.emit('updateOPCODE');

            // Wait 1 ms to make sure WBBUS is set from other areas
            setTimeout(function ()
            {
                // Convert WBUS into binary
                ir.WBUSreg = dec2bin(WBUS, 8);

                if(!nLi)
                {
                    // Loading IR from WBUS and splitting the data into OPCODE and ADDR
                    ir.OPCODEreg = bin2dec([ir.WBUSreg[0], ir.WBUSreg[1], ir.WBUSreg[2], ir.WBUSreg[3]]);
                    ir.ADDRreg   = bin2dec([ir.WBUSreg[4], ir.WBUSreg[5], ir.WBUSreg[6], ir.WBUSreg[7]]);
                }
            }, 1);
        }
    }

};

/**
 * Program Counter - Just a counter that counts up and puts that count on the WBUS so the proper data from RAM can be output.
 */
var pc = {
    WBUSreg : [0, 0, 0, 0, 0, 0, 0, 0],
    cnt     : 0,
    CLRevent: function ()
    {
        pc.cnt = 0;
    },
    CLKevent: function ()
    {
        if(!nCLK)
        {
            if(Cp)
            {
                // Increment the PC
                pc.cnt = (pc.cnt < 15) ? pc.cnt + 1 : 0;
                ee.emitEvent('updatePC');
            }
            else if(Ep)
            {
                // Output the PC
                // Convert WBUS into binary
                ir.WBUSreg = dec2bin(WBUS, 8);
                var ADDRbin = dec2bin(pc.cnt, 4);
                WBUS        = bin2dec([ir.WBUSreg[0], ir.WBUSreg[1], ir.WBUSreg[2], ir.WBUSreg[3], ADDRbin[0], ADDRbin[1], ADDRbin[2], ADDRbin[3]]);
            }
        }
    }
};

/**
 * Memory Address Register - Get the address from WBUS or ABUS and feeds it to RAM
 */
var mar = {
    ENmarEvent: function ()
    {
        if(ENmar)
        {
            ramaddr = ABUS;
            ee.emitEvent('updateADDR');
        }
    },
    CLKevent  : function ()
    {
        // Wait 1 ms to make sure WBUS and nLm is set
        setTimeout(function ()
        {
            // Load from lower 4 bits of WBUS
            if(CLK && !nLm)
            {
                var WBUStmp     = dec2bin(WBUS, 8);
                ramaddr         = bin2dec([WBUStmp[4], WBUStmp[5], WBUStmp[6], WBUStmp[7]]);
                ee.emitEvent('updateADDR');
            }
        }, 1);
    }
};

/**
 * RAM / Program Memory.
 * Loaded with 1 + 2
 */
var ram = {
    //memory     : [10, 27, 224, 240, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
    memory     : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    nCEevent   : function ()
    {
        // Output RAM to WBUS
        WBUS = ram.memory[ramaddr];
    },
    nWEramEvent: function ()
    {
        // Wait 1 ms to make sure WBUS and ADDR is set from other areas
        setTimeout(function ()
        {
            // Load RAM at address with WBUS
            ram.memory[ramaddr] = WBUS;
            ee.emitEvent('updateRAM');
            ee.emitEvent('updateWBUS');
            ee.emitEvent('updateADDR');
        }, 1);
    }
};

/**
 * Accumulator / Register A
 */
var accumulator = {
    CLKevent: function ()
    {
        // Wait 1 ms to make sure WBUS is set from other areas
        setTimeout(function ()
        {
            // Output register to WBUS
            WBUS = (Ea) ? rega : WBUS;

            if(!nLa)
            {
                rega = WBUS;
                ee.emitEvent('updateREGA');
            }
        }, 1);
    }
};

/**
 * Register B
 */
var registerb = {
    CLKevent: function ()
    {
        if(!nLb)
        {
            // Wait 1 ms to make sure WBBUS is set from other areas
            setTimeout(function ()
            {
                regb = WBUS;
                ee.emitEvent('updateREGB');
            }, 1);
        }

    }
};

/**
 * ALU - Arithmetic & Logic Unit. Well this only does basic Arithmetic (Add and Subtract)
 */
var alu = {
    alureg  : 0,
    ALUevent: function ()
    {
        // Wait 1 ms to make sure rega and regb are set
        setTimeout(function ()
        {
            if(Su)
            {
                alu.alureg = rega - regb;
            }
            else
            {
                alu.alureg = rega + regb;
            }

            // Make sure we swing back around
            if(alu.alureg > 255)
            {
                alu.alureg = alu.alureg - 256;
            }
            else if(alu.alureg < 0)
            {
                alu.alureg = 255 - (alu.alureg + 1);
            }
            // Wait 1 ms to make sure alureg is set
            if(Eu)
            {
                setTimeout(function ()
                {
                    // Output to WBUS
                    WBUS = alu.alureg;
                }, 1);
            }
        }, 1);
    }
};

/**
 * Output Register - Sends date to the display
 */
var outputreg = {
    CLKevent: function ()
    {
        // Wait 1 ms to make sure WBBUS is set from other areas
        setTimeout(function ()
        {
            if(!nLo)
            {
                OBUS = WBUS;
                ee.emitEvent('output');
            }
        }, 1);
    }
};