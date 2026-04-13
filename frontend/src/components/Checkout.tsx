import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function Checkout() {
  const location = useLocation();
  return <Navigate to={`/cart${location.search}`} replace />;
}
