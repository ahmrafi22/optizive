"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedirect: () => void;
}

export function WelcomeModal({ isOpen, onClose, onRedirect }: WelcomeModalProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onRedirect]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 max-w-md w-full mx-4 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl shadow-lg">
                <svg width="48" height="48" viewBox="0 0 366 357" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M211.713 307.81c34.152-5.907 65.566-21.841 89.276-45.285 23.711-23.444 38.365-53.06 41.647-84.165s-4.995-61.928-23.524-87.593-46.252-44.71-78.787-54.124l-19.299 49.189c20.555 5.947 38.069 17.979 49.775 34.193 11.706 16.215 16.935 35.687 14.862 55.338-2.074 19.652-11.332 38.362-26.311 53.173-14.98 14.81-34.826 24.877-56.401 28.609z" fill="#111111" />
                  <path d="m133.226 324.474 78.652-16.815-8.788-50.656zm21.129-277.3c-34.322 4.82-66.225 19.75-90.668 42.43-24.442 22.68-40.029 51.816-44.296 82.802s3.029 62.055 20.734 88.295 44.81 46.155 77.03 56.596l20.85-48.552c-20.356-6.596-37.479-19.178-48.665-35.755s-15.795-36.206-13.099-55.782 12.543-37.982 27.985-52.31 35.597-23.761 57.28-26.806z" fill="#111111" />
                  <path d="M233.332 33.009 154.185 47.32l7.178 50.91z" fill="#111111" />
                </svg>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-naston text-3xl md:text-4xl tracking-widest text-white mb-2"
            >
              OPTIZIVE
            </motion.h2>

            {/* Welcome Text */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-instrument text-xl md:text-2xl italic text-zinc-400 mb-6"
            >
              Welcome aboard!
            </motion.p>

            {/* Message */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-zinc-500 font-sans text-sm mb-8"
            >
              Your profile has been set up successfully. Get ready to experience the smartest supply chain network.
            </motion.p>

            {/* Countdown Indicator */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2"
            >
              <div className="flex items-center gap-1">
                <span className="text-sm text-zinc-500">Redirecting in</span>
                <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/20 text-primary font-bold rounded-lg">
                  {countdown}
                </span>
                <span className="text-sm text-zinc-500">seconds</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
