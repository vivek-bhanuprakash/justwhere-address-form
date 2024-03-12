import React from 'react';
import './App.css';
import AddressPage from './address-page';
import { withCookies } from "react-cookie";

function App() {
  return (
    <div className="App">
      <AddressPage />
    </div>
  );
}

export default withCookies(App);
