import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../redux/types";
import { routes } from "../constants/variables";

interface ProtectedRoutesProps {
  children: React.ReactNode;
}

const ProtectedRoutes = ({ children }: ProtectedRoutesProps) => {
  const user = useSelector((state: RootState) => state.user.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.token) {
      navigate(routes.login);
    }
  }, [user, navigate]);

  if (user?.token) {
    return <>{children}</>;
  }

  return null;
};

export default ProtectedRoutes;