
// -*- JavaScript -*-

import React from 'react';
import axios from 'axios';
import { Table } from 'react-bootstrap';

import bitcoinjs from 'js/bitcoin.js';
const bitcoin = bitcoinjs.bitcoin;
const Buffer = bitcoinjs.buffer.Buffer;

import { reverseHex } from 'js/utils.jsx';

class TxInput extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        let i = this.props.input;
        return (
      <Table striped bordered condensed hover>
         <tbody>
            <tr><th>Prevout Hash:</th><td>{reverseHex(i.prevout_hash.substr(2))}</td></tr>
            <tr><th>Prevout N:</th><td>{i.prevout_n}</td></tr>
            <tr><th>ScriptSig:</th><td>{i.scriptsig.substr(2)}</td></tr>
            <tr><th>Sequence:</th><td>{i.sequence}</td></tr>
            <tr><th>Witness:</th><td>{i.wtiness ? i.witness.substr(2) : ''}</td></tr>
         </tbody>
      </Table>
        );
    }
}

class TxOutput extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        let o = this.props.output;
        let spk = Buffer.from(o.scriptpubkey.substr(2), 'hex');
        let addr = bitcoin.address.fromOutputScript(spk);
        return (
      <Table striped bordered condensed hover>
         <tbody>
            <tr><th>Value:</th><td>{o.value}</td></tr>
            <tr><th>ScriptPubkey:</th><td>{o.scriptpubkey.substr(2)}</td></tr>
            <tr><th>Spent:</th><td>{o.spent ? 'Yes' : 'No'}</td></tr>
            <tr><th>To Address:</th><td>{addr}</td></tr>
         </tbody>
      </Table>
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
                <div>
                    Inputs:<br/>
                    {inputs}
                    Outputs:<br/>
                    {outputs}
                </div>
            );
        } else {
            return ( <div/> );
        }
    }
}

export { TxDetail };
