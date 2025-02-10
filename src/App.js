import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import data from './data.json'
import Main from "./components/Main";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./i18n";

import Events from "./components/Events";
import EventFull from "./components/EventFull"
import Root from "./components/Root";


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

  },
  {
    path: "/event/:eventId",
    element: <EventFull allEvents={data.events}/>
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
