
// -*- JavaScript -*-

import React from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { Route } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';

import { reverseHex } from 'js/utils.jsx';
import { TxDetail } from 'js/tx_detail.jsx';

class TxList extends React.Component {
    constructor(props) {
        super(props);
        this.state = { startN: 0, pageSize: 50, txs: [] };

        this.nextClick = this.nextClick.bind(this);
        this.prevClick = this.prevClick.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.blockhash !== nextProps.blockhash) {
            this.state = { startN: 0, pageSize: 50, txs: [] }; // reset state
            this.getData(nextProps.blockhash);
        }
    }

    componentDidMount() {
        this.getData(this.props.blockhash);
    }

    getData(blockhash) {
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
        this.state.startN = lastN-(this.state.pageSize*2)+1;
        this.getData();
    }

    nextClick(lastN) {
        this.state.startN = lastN+1;
        this.getData();
    }

    render() {
        if (this.state.txs && this.state.txs.length > 0) {
            let txs = this.state.txs;
            let lastN = txs[txs.length-1].n;
            const cols = [
                {dataField: 'n', text: 'N', headerStyle: () => { return {width: '10%'}}},
                {dataField: 'txid', text: 'Tx hash', headerStyle: () => { return {width: '90%'}}}
            ];
            const expandRow = {
                renderer: row => (
                    <TxDetail txid={row.txid} />
                )
            };
            return (
                <div>
                    <Button onClick={() => this.prevClick(lastN)} disabled={(lastN<this.state.pageSize)}>Prev</Button>
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
