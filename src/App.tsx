
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import SPPage from './sp-page';
import BenPage from './ben-page';
import { CookiesProvider, withCookies } from "react-cookie";


function App() {
  return (
    <CookiesProvider>
      <div className="max-w-screen-xl mx-auto mb-10">
        <Router>
          <div>
            <nav className="bg-gray-800 p-4">
              <ul className="flex justify-startitems-center">
                <li>
                  <Link to="/app/sp" className="px-5 text-white hover:text-gray-300">Service Provider Demo</Link>
                </li>
                <li>
                  <Link to="/app/ben" className="px-5 text-white hover:text-gray-300">Beneficiary Demo</Link>
                </li>
              </ul>
            </nav>

            <Routes>
              <Route path="/app/sp" element={<SPPage />} />
              <Route path="/app/ben" element={<BenPage />} />
            </Routes>
          </div>
        </Router>
      </div>
    </CookiesProvider>
  );
}

export default withCookies(App);
