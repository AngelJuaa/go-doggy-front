import { useState, useCallback } from "react";
import React from "react";
import Toast from "../components/Toast";

export default function useToast() {
  const [state, setState] = useState({ visible: false, message: "", type: "info" });

  const showToast = useCallback((message, type = "info") => {
    setState({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
  }, []);

  const ToastComponent = (
    <Toast
      visible={state.visible}
      message={state.message}
      type={state.type}
      onHide={hideToast}
    />
  );

  return { showToast, ToastComponent };
}
