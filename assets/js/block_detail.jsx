
// -*- JavaScript -*-

import React from 'react';
import axios from 'axios';
import { Table } from 'react-bootstrap';

import { reverseHex } from 'js/utils.jsx';
import { TxList } from 'js/tx_list.jsx';

class BlockDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentWillReceiveProps(nextProps) {
        // See: https://stackoverflow.com/questions/43087007/react-link-vs-a-tag-and-arrow-function/43986829#43986829
        if (this.props.match.params.hash !== nextProps.match.params.hash) {
            this.fetchState(nextProps.match.params.hash);
        }
    }

    componentDidMount() {
        const { hash } = this.props.match.params;
        this.fetchState(hash);
    }

    fetchState(hash) {
        axios
            .get("/block/"+hash)
            .then((result) => {
                this.setState(result.data);
            });
    }

    render() {
        let b = this.state;
        if (Object.keys(b).length === 0) {
            return ( <div/>);
        }

        let time = new Date(b.time*1000);
        return (
            <div>
                <Table striped bordered condensed hover>
                <tbody>
                <tr>
                  <th>Height</th> <td>{b.height}</td>
                </tr>
                <tr>
                  <th>Hash</th> <td>{reverseHex(b.hash.substr(2))}</td>
                </tr>
                <tr>
                  <th>Time</th> <td>{time.toString()}</td>
                </tr>
                <tr>
                  <th>Version</th> <td>{b.version}</td>
                </tr>
                <tr>
                  <th>PrevHash</th> <td>{reverseHex(b.prevhash.substr(2))}</td>
                </tr>
                <tr>
                  <th>HashMerkleRoot</th> <td>{reverseHex(b.merkleroot.substr(2))}</td>
                </tr>
                <tr>
                  <th>Bits</th> <td>{b.bits}</td>
                </tr>
                <tr>
                  <th>Nonce</th> <td>{b.nonce}</td>
                </tr>
                <tr>
                  <th>Orphaned</th> <td>{ (b.Orphan) ? 'Yes' : 'No' }</td>
                </tr>
                </tbody>
                </Table>
            <TxList blockhash={reverseHex(this.state.hash.substring(2))}/>
            </div>
        );
    }
}

export { BlockDetail };
