
// -*- JavaScript -*-

import React from 'react';
import axios from 'axios';
import ReactDOM from 'react-dom';
import { Button, FormGroup, FormControl, Nav, Navbar, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { HashRouter, Link, Route, Switch } from "react-router-dom";

import { BlockList } from 'js/block_list.jsx';
import { BlockDetail } from 'js/block_detail.jsx';
import { TxList } from 'js/tx_list.jsx';
import { TxDetail } from 'js/tx_detail.jsx';
import { findSurrogatePair } from 'js/utils.jsx';

class BlocksPanel extends React.Component {
    render() {
        return (
        <div>
          <h2>Block List</h2>
          <BlockList/>
        </div>
        );
    }
}

class HelpPanel extends React.Component {
    render() {
        return (
        <div>
          <h2>Help</h2>
          <ol>
            <li>Nulla pulvinar diam</li>
            <li>Facilisis bibendum</li>
            <li>Vestibulum vulputate</li>
            <li>Eget erat</li>
            <li>Id porttitor</li>
          </ol>
        </div>
        );
    }
}

class HomePanel extends React.Component {
    render() {
        return (
        <div>

          <p>
            <blockquote>
            Click "Blocks" above to see blocks or use the search box.<br/>
            This bitcoin block explorer is powered by Golang and PostgreSQL.<br/>
            Source code is here: <a href={'https://github.com/blkchain/blocks'}>https://github.com/blkchain/blocks</a><br/>
            <br/>
            Note: this little server probably cannot handle too much traffic.<br/>
            </blockquote>
          </p>

        </div>
        );
    }
}

class SearchBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = { term: "" };
        this.termChange = this.termChange.bind(this);
    }

    termChange(e) {
        this.state.term = e.target.value;
    }

    search(e, history) {
        if (this.state.term != "") {
            axios
                .get("/find/"+this.state.term)
                .then((result) => {
                    let data = result.data;
                    if (data.type == "addr") {
                        history.push("/addr/"+data.addr);
                    } else {
                        history.push("/"+data.type+"/"+data.hex);
                    }
                });
            e.preventDefault();
        }
    }

    render() {
        return (
          <Route render={({ history } ) => (
            <form onSubmit={(e)=>this.search(e, history)}>
               <FormGroup>
                  <FormControl type="text" onChange={this.termChange} placeholder="000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f" size={74}/>
               </FormGroup>{' '}
               <Button type="submit">&#x1F50E;</Button>
            </form>
          )} />
        );
    }
}

class Header extends React.Component {
    render() {
        return (
            <Navbar fluid collapseOnSelect>
            <Navbar.Header>
              <Navbar.Brand>
                <Link to="/">{findSurrogatePair(0x1F576)}</Link>
              </Navbar.Brand>
              <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
              <Nav>
                <LinkContainer to={"/blocks?"+Math.random().toString().slice(2,10)}>
                  <NavItem>Blocks</NavItem>
                </LinkContainer>
              </Nav>
              <Nav pullRight>
                <LinkContainer to="/help">
                  <NavItem>Help</NavItem>
                </LinkContainer>
              </Nav>
              <Navbar.Form pullRight>
                <SearchBox/>
              </Navbar.Form>
          </Navbar.Collapse>
        </Navbar>
        );
    }
}

class Routes extends React.Component {
    render() {
        return (
        <Switch>
          <Route path="/" exact component={HomePanel} />
          <Route path="/blocks" component={BlocksPanel} />
          <Route path="/block/:hash" component={BlockDetail} />
          <Route path="/addr/:addr" component={TxList} />
          <Route path="/tx/:txid" render={(props) => <TxDetail txid={props.match.params.txid} />} />
          <Route path="/help" component={HelpPanel}/>
        </Switch>
        );
    }
}

class App extends React.Component {
    render() {
        return (
      <HashRouter>
        <div>
          <Header/>
          <Routes/>
        </div>
      </HashRouter>
   );
  }
}

// Start the app
ReactDOM.render( <App/>, document.querySelector("#root"));
