import "./styles.css";
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Booked from './Booked.jsx'

const path = window.location.pathname.replace(/\/+$/, "");
const Page = path === "/booked" ? Booked : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
)
