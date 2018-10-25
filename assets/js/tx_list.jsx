
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
        this.state = {
            startN: 0,
            batchSize: 50,
            txs: []
        };

        this.nextClick = this.nextClick.bind(this);
        this.prevClick = this.prevClick.bind(this);
    }

    componentDidMount() {
        this.getData();
    }

    getData() {
        axios
            .get("/block/"+this.props.blockhash+"/txs/"+this.state.startN+"/"+this.state.batchSize)
            .then((result) => {
                    this.setState({ txs: result.data });
                });
    }

    prevClick(lastN) {
        this.state.startN = lastN-(this.state.batchSize*2)+1;
        this.getData();
    }

    nextClick(lastN) {
        this.state.startN = lastN+1;
        this.getData();
    }

    render() {
        if (this.state.txs && this.state.txs.length > 0) {
            let lastN = 0;
            const txs = this.state.txs.map((tx, i) => {
                tx.txid = reverseHex(tx.txid.substr(2));
                lastN = tx.n;
                return tx
            });
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
                    <Button onClick={() => this.prevClick(lastN)} disabled={(lastN<this.state.batchSize)}>Prev</Button>
                    <Button onClick={() => this.nextClick(lastN)} disabled={(txs.length < this.state.batchSize)}>Next</Button>
                    <BootstrapTable keyField='n' data={ txs } columns={ cols } expandRow={ expandRow } />
                </div>
            );
        } else {
            return ( <div/> );
        }
    }
}

export {TxList};
