import React from 'react';
import './App.css';
import AddressPage from './address-page';
import { CookiesProvider, withCookies } from "react-cookie";

function App() {
  return (
    <CookiesProvider>
      <div className="App">
        <AddressPage />
      </div>
    </CookiesProvider>
  );
}

export default withCookies(App);
