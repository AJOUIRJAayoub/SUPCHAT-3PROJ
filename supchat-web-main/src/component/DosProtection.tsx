import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/types";
import { routes } from "../constants/variables";

interface DosProtectionProps {
  children: React.ReactNode;
}

const DosProtection = ({ children }: DosProtectionProps) => {
  const user = useSelector((state: RootState) => state.user.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.token) {
      navigate(routes.dashboard);
    }
  }, [user, navigate]);

  if (!user?.token) {
    return <>{children}</>;
  }

  return null;
};

export default DosProtection;