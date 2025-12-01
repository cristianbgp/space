"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";

export function MenuBar() {
  const [currentTime, setCurrentTime] = useState(
    DateTime.now().toLocaleString(DateTime.TIME_SIMPLE)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(DateTime.now().toLocaleString(DateTime.TIME_SIMPLE));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="menu-bar-blur fixed top-0 left-0 right-0 z-50 flex h-7 items-center justify-between border-b border-[var(--menu-bar-border)] bg-[var(--menu-bar)] px-4 text-xs"
    >
      <div className="flex items-center gap-4">
        <span className="font-semibold text-foreground font-mono">.space</span>
        <div className="flex gap-3 text-muted-foreground">
          <button className="hover:text-foreground transition-colors">File</button>
          <button className="hover:text-foreground transition-colors">Edit</button>
          <button className="hover:text-foreground transition-colors">View</button>
          <button className="hover:text-foreground transition-colors">Window</button>
          <button className="hover:text-foreground transition-colors">Help</button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-muted-foreground">
        <div className="flex gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
          <div className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
          <div className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
        </div>
        <motion.span
          key={currentTime}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="font-medium"
        >
          {currentTime}
        </motion.span>
      </div>
    </motion.div>
  );
}

