import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import data from './data.json'
import Main from "./components/Main";
import { BrowserRouter as createBrowserRouter, RouterProvider } from "react-router-dom";

import Events from "./components/Events";
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
