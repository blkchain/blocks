
// -*- JavaScript -*-

import React from 'react';
import axios from 'axios';
import { Table, Well, Grid, Row, Col } from 'react-bootstrap';

import { reverseHex, addressFromScriptSig, addressFromScriptPubKey, asmScriptSig } from 'js/utils.jsx';

class TxInput extends React.Component {
    constructor(props) {
        super(props);
    }

    extrapolateAddress() {
        let ss = this.props.input.scriptsig.substr(2);
        let wit = this.props.input.witness ? this.props.input.witness.substr(2) : '';
        return addressFromScriptSig(ss, wit);
    }

    asmScriptSig() {
        let ss = this.props.input.scriptsig.substr(2);
        return asmScriptSig(ss);
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

    extrapolateAddress() {
        let spk = this.props.output.scriptpubkey.substr(2);
        return addressFromScriptPubKey(spk);
    }

    render() {
        let o = this.props.output;
        return (
         <tbody>
            <tr><td colspan={2}></td></tr>
            <tr><th>Value:        </th> <td>{o.value}</td></tr>
            <tr><th>ScriptPubkey: </th> <td>{o.scriptpubkey.substr(2)}</td></tr>
            <tr><th>Spent:        </th> <td>{o.spent ? 'Yes' : 'No'}</td></tr>
            <tr><th>To Address:   </th> <td>{this.extrapolateAddress()}</td></tr>
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
        if (!this.state.outputs) {
            return ( <div/> );
        }

        let inputs;
        if (this.state.inputs && this.state.inputs.length > 0) {
            inputs = this.state.inputs.map((input, i) => {
                return ( <TxInput input={input}/> );
            });
        } else {
            inputs = "COINBASE";
        }
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
    }
}

export { TxDetail };
