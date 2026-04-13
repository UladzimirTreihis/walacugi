import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Main from "./components/Main";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import "./i18n";

import { AuthProvider } from "./contexts/AuthProvider";
import { createAppTheme } from "./theme";

import Events from "./components/Events";
import EventFull from "./components/EventFull";
import NewsFull from "./components/NewsFull";
import Root from "./components/Root";
import News from "./components/News";

import AdminPage from "./components/admin/AdminPage";
import AdminEditNewsForm from "./components/admin/AdminEditNewsForm";
import AdminNewsForm from "./components/admin/AdminNewsForm";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLogin from "./components/admin/AdminLogin";
import AdminEventsForm from "./components/admin/AdminEventsForm";
import AdminEditEventForm from "./components/admin/AdminEditEventForm";
import AdminEquipmentForm from "./components/admin/AdminEquipmentForm";
import AdminEditEquipmentForm from "./components/admin/AdminEditEquipmentForm";
import Equipment from "./components/Equipment";
import EquipmentDetail from "./components/EquipmentDetail";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";

const theme = createAppTheme("light");

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />
  },
  {
    path: "/login",
    element: <AdminLogin />
  },
  {
    path: "/admin",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminPage />,
        children: [
          {
            path: "/admin/news/edit/:newsId",
            element: <AdminEditNewsForm />
          },
          {
            path: "/admin/news/create",
            element: <AdminNewsForm />
          },
          {
            path: "/admin/events/edit/:eventId",
            element: <AdminEditEventForm />
          },
          {
            path: "/admin/events/create",
            element: <AdminEventsForm />
          },
          {
            path: "/admin/equipment/create",
            element: <AdminEquipmentForm />
          },
          {
            path: "/admin/equipment/edit/:modelId",
            element: <AdminEditEquipmentForm />
          }
        ]
      }
    ]
  },
  {
    path: "/events",
    element: <Root />,
    children: [
      {
        path: "/events",
        element: <Events />
      },
      {
        path: "/events/:eventId",
        element: <EventFull />
      }
    ]
  },
  {
    path: "/news",
    element: <Root />,
    children: [
      {
        path: "/news",
        element: <News />
      },
      {
        path: "/news/:newsId",
        element: <NewsFull />
      }
    ]
  },
  {
    path: "/equipment",
    element: <Root />,
    children: [
      {
        path: "/equipment",
        element: <Equipment />
      },
      {
        path: "/equipment/:modelId",
        element: <EquipmentDetail />
      }
    ]
  },
  {
    path: "/cart",
    element: <Root />,
    children: [
      {
        path: "/cart",
        element: <Cart />
      }
    ]
  },
  {
    path: "/checkout",
    element: <Root />,
    children: [
      {
        path: "/checkout",
        element: <Checkout />
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" />
  }
]);

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
