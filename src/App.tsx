import { CookiesProvider, withCookies } from "react-cookie";
import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom";
import "./App.css";
import BenPage from "./ben-page";
import SPPage from "./sp-page";

function App() {
  return (
    <CookiesProvider>
      <div className="mx-auto mb-10 max-w-screen-lg">
        <Router>
          <div>
            <nav className="bg-gray-800 p-4">
              <ul className="justify-startitems-center flex">
                <li>
                  <Link to="/app/sp" className="px-5 text-white hover:text-gray-300">
                    Service Provider Demo
                  </Link>
                </li>
                <li>
                  <Link to="/app/ben" className="px-5 text-white hover:text-gray-300">
                    Beneficiary Demo
                  </Link>
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
