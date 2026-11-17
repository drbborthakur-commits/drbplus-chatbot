import "./styles.css";
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Booked from './Booked.jsx'
import Track from './Track.jsx'

const path = window.location.pathname.replace(/\/+$/, "");
const Page = path === "/booked" ? Booked : path === "/track" ? Track : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
)
