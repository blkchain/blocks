
// -*- JavaScript -*-

import React from 'react';
import axios from 'axios';
import { Table, Well, Grid, Row, Col } from 'react-bootstrap';

import bitcoinjs from 'js/bitcoin.js';
const bitcoin = bitcoinjs.bitcoin;
const Buffer = bitcoinjs.buffer.Buffer;
const varuint = bitcoinjs.varuint;

import { reverseHex } from 'js/utils.jsx';

class TxInput extends React.Component {
    constructor(props) {
        super(props);
    }

    parseWitness(buffer) {

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

    extrapolateAddress() {

        // Extrapolating addresses from TX inputs is wrong - the only
        // certain way to determine the prevout address is by
        // examining the prevout itself. Figuring it out by looking at
        // the scriptSig is only a guess, but it saves us a trip to
        // the database to fetch said output, and it is also fun.


        let ss = Buffer.from(this.props.input.scriptsig.substr(2), 'hex')

        if (ss.length == 0) {
            // Native SegWit: P2WSH or P2WPKH

            let wbuff = Buffer.from(this.props.input.witness.substr(2), 'hex')

            let witness = this.parseWitness(wbuff);

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
            } else if (ops.length == 2) {
                // Most likely a P2PKH

                let sh = bitcoin.crypto.sha256(ops[1]);
                let h160 = bitcoin.crypto.ripemd160(sh);
                let addy = bitcoin.address.toBase58Check(h160, 0);

                return { address: addy, type: "P2PKH" };
            }
        }
        return { address: "UNKNOWN", type: ""};
    }

    asmScriptSig() {
        let b = Buffer.from(this.props.input.scriptsig.substr(2), 'hex');
        try {
            return bitcoin.script.toASM(b);
        } catch(err) {
            return ss; // return as is
        }
    }

    render() {
        let i = this.props.input;
        let addy = this.extrapolateAddress();
        return (
         <tbody>
            <tr><td colspan={2}></td></tr>
            <tr><th>Prevout:   </th> <td> {reverseHex(i.prevout_hash.substr(2))+':'+i.prevout_n}</td></tr>
            <tr><th>Address:   </th> <td> { addy.address } ({ addy.type })</td></tr>
            <tr><th>ScriptSig: </th> <td> <span style={{fontSize: 9}}>{this.asmScriptSig()}</span></td></tr>
            <tr><th>Sequence:  </th> <td> {i.sequence}</td></tr>
            <tr><th>Witness:   </th> <td> {i.witness ? i.witness.substr(2) : ''}</td></tr>
         </tbody>
        );
    }
}

class TxOutput extends React.Component {
    constructor(props) {
        super(props);
    }

    extrapolateAddress(scriptPubKey) {
        let spk = Buffer.from(scriptPubKey, 'hex');
        try {
            var addr = bitcoin.address.fromOutputScript(spk);
        } catch(err) {
            addr = ( <span style={{fontStyle: 'italic'}}>{err.message}</span> );
        }
        return addr;
    }

    render() {
        let o = this.props.output;
        return (
         <tbody>
            <tr><td colspan={2}></td></tr>
            <tr><th>Value:        </th> <td>{o.value}</td></tr>
            <tr><th>ScriptPubkey: </th> <td>{o.scriptpubkey.substr(2)}</td></tr>
            <tr><th>Spent:        </th> <td>{o.spent ? 'Yes' : 'No'}</td></tr>
            <tr><th>To Address:   </th> <td>{this.extrapolateAddress(o.scriptpubkey.substr(2))}</td></tr>
         </tbody>
        );
    }
}

class TxDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        axios
            .get("/tx/"+this.props.txid)
            .then((result) => {
                this.setState(result.data);
            });
    }

    render() {
        if (this.state.inputs && this.state.inputs.length > 0) {
            const inputs = this.state.inputs.map((input, i) => {
                return ( <TxInput input={input}/> );
            });
            const outputs = this.state.outputs.map((output, i) => {
                return ( <TxOutput output={output}/> );
            });
            return (
                <Well>
                 <p>{reverseHex(this.state.txid.substr(2))}</p>
                 <Grid fluid={true}>
                 <Row>
                  <Col md={6}>
                   <Table striped condensed>
                    <thead>
                    <tr><th style={{width: "20%"}}>Inputs</th><th style={{width: "80%"}}></th></tr>
                    </thead>
                    {inputs}
                   </Table>
                  </Col>
                  <Col md={6}>
                   <Table striped condensed>
                    <thead>
                    <tr><th style={{width: "20%"}}>Outputs</th><th style={{width: "80%"}}></th></tr>
                    </thead>
                    {outputs}
                   </Table>
                  </Col>
                 </Row>
                 </Grid>
                </Well>
            );
        } else {
            return ( <div/> );
        }
    }
}

export { TxDetail };
