
// -*- JavaScript -*-

import React from 'react';
import axios from 'axios';
import { Table, Button } from 'react-bootstrap';
import { Route } from 'react-router-dom';

import { reverseHex } from 'js/utils.jsx';

class BlockItem extends React.Component {
    render() {
        let time = new Date(this.props.block.time*1000);
        // skip \x and reverse
        let hash = reverseHex(this.props.block.hash.substr(2));
        return (
            <Route render={({ history } ) => (
                <tr onClick={()=>history.push("/block/"+hash)}>
                <td> {this.props.block.height} </td>
                <td> {time.toString()}         </td>
                <td> {hash}   </td>
                </tr>
            )} />
        );
    }
}

class BlockList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            startHeight: -1,
            batchSize: 15,
            blocks: []
        };

        this.nextClick = this.nextClick.bind(this);
        this.prevClick = this.prevClick.bind(this);
    }

    componentDidMount() {
        this.getData()
    }

    getData() {
        if (this.state.startHeight == -1) {
            axios
                .get("/blocks/?limit="+this.state.batchSize)
                .then((result) => {
                    this.setState({ blocks: result.data });
                });
        } else {
            axios
                .get("/blocks/"+this.state.startHeight+"/"+this.state.batchSize)
                .then((result) => {
                    this.setState({ blocks: result.data });
                });
        }
    }

    prevClick(lastHeight) {
        this.state.startHeight = lastHeight+(this.state.batchSize*2)-1;
        this.getData();
    }

    nextClick(lastHeight) {
        this.state.startHeight = (lastHeight >= this.state.batchSize) ? lastHeight-1 : this.state.batchSize-1;
        this.getData();
    }

    render() {
        let lastHeight = 0;
        const blocks = this.state.blocks.map((block, i) => {
            lastHeight = block.height;
            return (
                    <BlockItem key={i} block={block} />
            );
        });

        return (
      <div>
        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th>Height</th>
              <th>Time</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
          {blocks}
          </tbody>
        </Table>
        <Button onClick={() => this.prevClick(lastHeight)}>Newer</Button>
        <Button onClick={() => this.nextClick(lastHeight)}>Older</Button>
      </div>
        );
    }
}

export {BlockList};
