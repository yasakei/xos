// packages/frontend/src/core/dialog/DialogManager.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDialogStore } from "./dialogStore";
import { useUiStore } from "../theme-engine/themeStore"; // NEW

export const DialogManager = () => {
  const request = useDialogStore((state) => state.request);
  const [inputValue, setInputValue] = useState("");
  const surfaceStyle = useUiStore((state) => state.surfaceStyle); // NEW

  // NEW: Determine which class to use
  const surfaceClass =
    surfaceStyle === "glass" ? "liquid-glass" : "solid-surface";

  useEffect(() => {
    if (request?.type === "prompt" || request?.type === "password-prompt") {
      setInputValue(request.defaultValue || "");
    }
  }, [request]);

  

  const handleConfirm = () => {
    if (!request) return;
    const value =
      request.type === "prompt" || request.type === "password-prompt"
        ? inputValue
        : true;
    request.resolve(value);
    useDialogStore.setState({ request: null });
  };

  const handleCancel = () => {
    if (!request) return;
    const value = request.type === "confirm" ? false : null;
    request.resolve(value);
    useDialogStore.setState({ request: null });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999999]"
          onMouseDown={handleCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            // UPDATED: Use the conditional surfaceClass
            className={`w-full max-w-sm p-6 rounded-2xl ${surfaceClass} text-[color:var(--text-primary)]`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">{request.title}</h2>
            <p className="text-sm text-[color:var(--text-secondary)] mb-6">
              {request.message}
            </p>

            {(request.type === "prompt" ||
              request.type === "password-prompt") && (
              <input
                type={request.type === "password-prompt" ? "password" : "text"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 bg-black/20 rounded-lg mb-4 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            )}

            <div className="flex justify-end space-x-3">
              {request.type !== "alert" && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg bg-black/20 hover:bg-black/30"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {request.type === "confirm" ? "Confirm" : "OK"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
