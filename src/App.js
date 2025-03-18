import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import data from './data.json'
import Main from "./components/Main";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./i18n";

import { AuthProvider } from "./contexts/AuthProvider";

import Events from "./components/Events";
import EventFull from "./components/EventFull"
import NewsFull from "./components/NewsFull";
import Root from "./components/Root";
import News from "./components/News";

import AdminPage from "./components/admin/AdminPage";
import AdminEditNewsForm from "./components/admin/AdminEditNewsForm";
import AdminNewsForm from "./components/admin/AdminNewsForm";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLogin from "./components/admin/AdminLogin";

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
    element: <Main data={data}/>,
  },
  {
    path: "/login",
    element: <AdminLogin />,
  },
  {
    path: "/admin",
    element: <ProtectedRoute />, // Protect all admin pages
    children: [
      {
        path: "/admin",
        element: <AdminPage />,
      },
      {
        path: "/admin/news/edit/:newsId",
        element: <AdminEditNewsForm />,
      },
      {
        path: "/admin/news/create",
        element: <AdminNewsForm />,
      },
    ],
  },
  {
    path: "/events",
    element: <Root />,
    children: [
      {
        path: "/events",
        element: <Events />,
      },
      {
        path: "/events/:eventId",
        element: <EventFull />,
      },
    ],
  },
  {
    path: "/news",
    element: <Root />,
    children: [
      {
        path: "/news",
        element: <News />,
      },
      {
        path: "/news/:newsId",
        element: <NewsFull />,
      },
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" />, // Redirect unknown routes
  },
]);

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        {/* Fixed layout: NavBar at top, then Intro, then About */}
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
