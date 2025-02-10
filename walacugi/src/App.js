import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import data from './data.json'
import Main from "./components/Main";
import { BrowserRouter as Router, Routes, Route, createBrowserRouter, RouterProvider } from "react-router-dom";

import Intro from "./components/Intro";
import About from "./components/About";
import Events from "./components/Events";
import EventFull from "./components/EventFull";
import Root from "./components/Root";

const eventsData = [
  {
    id: "1",
    title: "Одиссея на катамаране: Весенние острова Греции 🇬🇷",
    images: ["/images/mountain1.jpg", "/images/mountain2.jpg"],
    description: "A very long text about our amazing trip in the mountains...",
  },
  {
    id: "2",
    title: "Beach Camping Adventure",
    images: ["/images/beach1.jpg", "/images/beach2.jpg"],
    description: "Another long text about the beach trip...",
  },
  // ...
];


const theme = createTheme({
  palette: {
    primary: {
      main: "#5F97CF", // Customize your primary color
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main data={data}/>
  },
  {
    path: "/events",
    element: <Root />,
    children: [
      {
        path: "/events",
        element: <Events events={data.events} />
      }
    ]

  }
])

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* Fixed layout: NavBar at top, then Intro, then About */}
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
