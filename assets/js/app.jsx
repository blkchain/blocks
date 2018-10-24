
// -*- JavaScript -*-

import React from 'react';
import axios from 'axios';
import ReactDOM from 'react-dom';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { HashRouter, Link, Route, Switch } from "react-router-dom";

import { BlockList } from 'js/block_list.jsx';
import { BlockDetail } from 'js/block_detail.jsx';
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
                Nulla pulvinar diam
          </p>

        </div>
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
                <LinkContainer to="/blocks">
                  <NavItem>Blocks</NavItem>
                </LinkContainer>
              </Nav>
              <Nav pullRight>
                <LinkContainer to="/help">
                  <NavItem>Help</NavItem>
                </LinkContainer>
              </Nav>
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
