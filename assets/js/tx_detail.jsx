
// -*- JavaScript -*-

import React from 'react';
import axios from 'axios';
import { Table, Well, Grid, Row, Col } from 'react-bootstrap';
import { Link } from "react-router-dom";

import { reverseHex, addressFromScriptSig, addressFromScriptPubKey, asmScriptSig, parseWitness } from 'js/utils.jsx';

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

    parsedWitness() {
        let i = this.props.input;
        return i.witness ? parseWitness(i.witness.substr(2)).map(w => w.toString('hex')).join(' ') : '';
    }

    render() {
        let i = this.props.input;
        let addy = this.extrapolateAddress();
        let prev = reverseHex(i.prevout_hash.substr(2));
        return (
         <tbody>
            <tr><td colspan={2}></td></tr>
            <tr><th>Prevout:   </th> <td> <Link to={"/tx/"+prev}>{prev}</Link>{':'+i.prevout_n}</td></tr>
            <tr><th>Address:   </th> <td> <Link to={"/addr/"+addy.address}>{ addy.address }</Link> ({ addy.type })</td></tr>
            <tr><th>ScriptSig: </th> <td> <span style={{fontSize: 10, display:'table-cell', wordBreak:'break-all'}}>{this.asmScriptSig()}</span></td></tr>
            <tr><th>Sequence:  </th> <td> {i.sequence}</td></tr>
            <tr><th>Witness:   </th> <td> <span style={{fontSize: 10, display:'table-cell', wordBreak:'break-all'}}>{this.parsedWitness()}</span></td></tr>
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
        let addr = this.extrapolateAddress();
        return (
         <tbody>
            <tr><td colspan={2}></td></tr>
            <tr><th>Value:        </th> <td>{o.value/100000000}</td></tr>
            <tr><th>To Address:   </th> <td><Link to={"/addr/"+addr}>{addr}</Link></td></tr>
            <tr><th>ScriptPubkey: </th> <td><span style={{fontSize: 10, display:'table-cell', wordBreak:'break-all'}}>{o.scriptpubkey.substr(2)}</span></td></tr>
            <tr><th>Spent:        </th> <td>{o.spent ? 'Yes' : 'No'}</td></tr>
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
        if (this.props.tx && this.props.tx.inputs) {
            // we should already have the data
            this.setState(this.props.tx);
        } else {
            // need to fetch the data
            if (this.props.txid) {
                this.getData(this.props.txid);
            } else {
                this.getData(this.props.tx.txid);
            }
        }
    }

    getData(txid) {
        axios
            .get("/tx/"+txid)
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
        let block = '';
        if (this.state.blocks) {
            // This only happens if data comes from /tx/:txid
            block = reverseHex(this.state.blocks[0].substr(2));
        }
        return (
                <Well>
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
                 {block ? (<div> In block: <Link to={"/block/"+block}>{block}</Link> </div>) : ''}
                 </Grid>
                </Well>
        );
    }
}

export { TxDetail };
