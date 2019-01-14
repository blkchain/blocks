// -*- Javascript -*-

import React from 'react';
import bitcoinjs from 'js/bitcoin.js';
const bitcoin = bitcoinjs.bitcoin;
const Buffer = bitcoinjs.buffer.Buffer;
const varuint = bitcoinjs.varuint;

window.bitcoin = bitcoin; // ZZZ

// To make emoji work, see
// http://stackoverflow.com/questions/35142493/how-can-i-write-emoji-characters-to-a-textarea
function findSurrogatePair(point) {
    var offset = point - 0x10000,
    lead = 0xd800 + (offset >> 10),
    trail = 0xdc00 + (offset & 0x3ff);
    return String.fromCharCode(lead) + String.fromCharCode(trail);
}

// reverse a string of hex encodings
// "deadbeef" -> "efbeadde"
function reverseHex(hex) {
    let str = '';
    for (var i = -2; i >= -hex.length; i -= 2) {
        str += hex.substr(i, 2);
    }
    return str;
}

function parseWitness(buffer) {

    let offset = 0;

    function readSlice (n) {
        offset += n;
        return buffer.slice(offset - n, offset);
    }

    function readVarInt () {
        const vi = varuint.decode(buffer, offset);
        offset += varuint.decode.bytes;
        return vi;
    }

    function readVarSlice () {
        return readSlice(readVarInt());
    }

    function readVector () {
        const count = readVarInt();
        const vector = [];
        for (var i = 0; i < count; i++) vector.push(readVarSlice());
        return vector;
    }

    return readVector();
}

function addressFromScriptSig(ssStr, witStr) {

    // Extrapolating addresses from TX inputs is wrong - the only
    // certain way to determine the prevout address is by
    // examining the prevout itself. Figuring it out by looking at
    // the scriptSig is only a guess, but it saves us a trip to
    // the database to fetch said output, and it is also fun.

    let ss = Buffer.from(ssStr, 'hex')

    if (ss.length == 0) {
        // Native SegWit: P2WSH or P2WPKH

        let wbuff = Buffer.from(witStr, 'hex')

        let witness = parseWitness(wbuff);

        let pub = witness[witness.length-1];
        let sha = bitcoin.crypto.sha256(pub);

        if (witness.length == 2 && witness[1].length == 33) {
            // Most likely a P2WPKH

            let h160 = bitcoin.crypto.ripemd160(sha);
            let addy = bitcoin.address.toBech32(h160, 0, 'bc');
            return { address: addy, type: "P2WPKH" }

        } else {
            // Most likely a P2WSH

            let addy = bitcoin.address.toBech32(sha, 0, 'bc');
            return { address: addy, type: "P2WSH"};
        }

    } else {

        let ops = bitcoin.script.decompile(ss);
        if (ops == null) {
            console.log("Could not decompile scriptSig");
            return { address: "UNKNOWN", type: "" };
        }

        if (ops.length == 1 && ops[0].length > 0) {
            // Most likely a P2SH (or P2SH-P2W*)

            let sh = bitcoin.crypto.sha256(ops[0]);
            let h160 = bitcoin.crypto.ripemd160(sh);
            let addy = bitcoin.address.toBase58Check(h160, 5);

            return { address: addy, type: "P2SH" };
        } else if (ops.length >= 2) {
            // Most likely a P2PKH or bare multisig.

            let sh = bitcoin.crypto.sha256(ops[ops.length-1]);
            let h160 = bitcoin.crypto.ripemd160(sh);

            if (ops.length == 2) { // P2PKH
                let addy = bitcoin.address.toBase58Check(h160, 0);
                return { address: addy, type: "P2PKH" };
            } else {  // BIP 11 bare multisig (rare)
                let addy = bitcoin.address.toBase58Check(h160, 5);
                return { address: addy, type: "MSIG" };
            }

        }
    }
    return { address: "UNKNOWN", type: ""};
}

function addressFromScriptPubKey(spkStr) {
    let spk = Buffer.from(spkStr, 'hex');
    try {
        var addr = bitcoin.address.fromOutputScript(spk);
    } catch(err) {
        addr = ( <span style={{fontStyle: 'italic'}}>{err.message}</span> );
    }
    return addr;
}

function asmScriptSig(ssStr) {
    let b = Buffer.from(ssStr, 'hex');
    try {
        return bitcoin.script.toASM(b);
    } catch(err) {
        return ssStr; // return as is
    }
}

function decodeAddress(address) {
    try {
        return bitcoin.address.fromBase58Check(address);
    } catch (e) {}

    try {
        return bitcoin.address.fromBech32(address);
    } catch (e) {}

    throw new Error('Invalid address ' + address);
}

window.decodeAddress = decodeAddress; // ZZZ

export { findSurrogatePair, reverseHex, addressFromScriptSig, addressFromScriptPubKey, asmScriptSig, decodeAddress }
