
// -*- JavaScript -*-

import React from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { Route } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';

import { reverseHex, decodeAddress } from 'js/utils.jsx';
import { TxDetail } from 'js/tx_detail.jsx';

class TxList extends React.Component {
    // This list is used in two places: to list transactions in a
    // block and to list transactions referencing an address, and the
    // behavior needs to vary slightly depending on this context.
    constructor(props) {
        super(props);
        if (props.match && props.match.params.addr) {
            this.initState("addr");
        } else {
            this.initState("block");
        }

        this.nextClick = this.nextClick.bind(this);
        this.prevClick = this.prevClick.bind(this);
    }

    initState(context) {
        if (context == "addr") {
            this.state = { context: "addr", startN: 0xffffffffffff, maxN: 0, pageSize: 10, txs: [] };
        } else {
            this.state = { context: "block", startN: 0, pageSize: 50, txs: [] };
        }

    }

    componentWillReceiveProps(nextProps) {
        if (this.state.context == "addr" && this.props.location.pathname != nextProps.location.pathname) {
            this.initState("addr");
            this.getDataByAddr(nextProps.match.params.addr, this.state.startN, this.state.pageSize);
        } else if (this.state.context == "block" && this.props.blockhash !== nextProps.blockhash) {
            this.initState("block");
            this.getData(nextProps.blockhash);
        }
    }

    componentDidMount() {
        if (this.state.context == "addr") {
            this.getDataByAddr(this.props.match.params.addr, this.state.startN, this.state.pageSize);
        } else {
            this.getDataByBlock(this.props.blockhash);
        }
    }

    getDataByAddr(addr, start, limit) {
        let decoded = decodeAddress(addr);
        // bech32 addresses have .data, while base58 have .hash
        let hex = (decoded.hash ? decoded.hash : decoded.data).toString("hex");
        axios
            .get("/addr/"+hex+"?start="+start+"&limit="+limit)
            .then((result) => {
                const txs = result.data.map((tx, i) => {
                    tx.txid = reverseHex(tx.txid.substr(2));
                    tx.n = tx.id;
                    return tx
                });
                this.setState({ txs: txs });
                });
    }

    getDataByBlock(blockhash) {
        axios
            .get("/block/"+blockhash+"/txs/"+this.state.startN+"/"+this.state.pageSize)
            .then((result) => {
                const txs = result.data.map((tx, i) => {
                    tx.txid = reverseHex(tx.txid.substr(2));
                    return tx
                });
                this.setState({ txs: txs });
                });
    }

    prevClick(lastN) {
        if (this.state.context = "addr") {
            this.getDataByAddr(this.props.match.params.addr, this.state.startN, -this.state.pageSize);
            this.state.startN = lastN;
        } else {
            this.state.startN = this.state.startN-this.state.pageSize;
            this.getDataByBlock(this.props.blockhash);
        }
    }

    nextClick(lastN) {
        if (this.state.context == "addr") {
            this.getDataByAddr(this.props.match.params.addr, lastN, this.state.pageSize);
        } else {
            this.state.startN = lastN+1;
            this.getDataByBlock(this.props.blockhash);
        }
    }

    render() {
        if (this.state.txs && this.state.txs.length > 0) {
            let txs = this.state.txs;
            let lastN = txs[txs.length-1].n;
            this.state.startN = txs[0].n;
            if (txs[0].n > this.state.maxN) {
                this.state.maxN = txs[0].n;
            }
            var cols;
            if (this.state.context == "addr") {
                cols = [
                    {dataField: 'txid', text: 'Tx hash', headerStyle: () => { return {width: '90%'}}}
                ];
            } else {
                cols = [
                    {dataField: 'n', text: 'N', headerStyle: () => { return {width: '10%'}}},
                    {dataField: 'txid', text: 'Tx hash', headerStyle: () => { return {width: '90%'}}}
                ];
            }
            const expandRow = {
                renderer: row => {
                    return (
                        <TxDetail tx={row} />
                    );
                },
                // expand rows if we already have tx data
                expanded: txs[0].inputs ? txs.map(tx => tx.id) : []
            };
            return (
                <div>
                    <Button onClick={() => this.prevClick(lastN)} disabled={(lastN<this.state.pageSize || this.state.startN == this.state.maxN)}>Prev</Button>
                    <Button onClick={() => this.nextClick(lastN)} disabled={(txs.length < this.state.pageSize)}>Next</Button>
                    <BootstrapTable keyField='n' data={ txs } columns={ cols } expandRow={ expandRow } />
                </div>
            );
        } else {
            return ( <div/> );
        }
    }
}

export {TxList};
