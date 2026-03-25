import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./store/store";

const rootNode = document.getElementById("root");
if (!rootNode) {
  throw new Error("Missing root element");
}

const root = ReactDOM.createRoot(rootNode);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
