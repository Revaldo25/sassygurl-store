"use client";

import { motion, Transition } from "framer-motion"; // <-- Tambahkan Transition di sini

// Berikan label : Transition agar TypeScript tidak bingung
const iconTransition: Transition = { 
  duration: 2, 
  repeat: Infinity, 
  ease: "easeInOut" 
};

export const PremiumUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <motion.path animate={{ opacity: [0.2, 0.5, 0.2] }} transition={iconTransition} d="M10 15H14" stroke="url(#grad1)" strokeWidth="3" />
    <defs>
      <linearGradient id="grad1" x1="12" y1="15" x2="12" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDB0C0" />
        <stop offset="1" stopColor="transparent" />
      </linearGradient>
    </defs>
  </svg>
);

export const PremiumMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <motion.path animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} d="M22 6L12 13L2 6" stroke="#FDB0C0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PremiumLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <motion.path animate={{ y: [0, -1, 0] }} transition={iconTransition} d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="16" r="1" fill="#FDB0C0" />
  </svg>
);

export const PremiumPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4741 21.8325 20.7294C21.721 20.9846 21.5574 21.2137 21.3521 21.4019C21.1468 21.5901 20.9046 21.7332 20.6409 21.822C20.3773 21.9108 20.0982 21.9433 19.82 21.9169C16.8286 21.6565 13.9453 20.6309 11.41 18.9169C9.04353 17.3323 7.02763 15.3164 5.4431 12.9499C3.72304 10.403 2.69532 7.50428 2.44 4.5C2.41366 4.22176 2.44614 3.94263 2.53496 3.67895C2.62378 3.41528 2.76686 3.17316 2.95505 2.96788C3.14324 2.76261 3.37237 2.59902 3.62762 2.4875C3.88286 2.37597 4.15849 2.31899 4.437 2.32H7.437C7.91503 2.31553 8.37812 2.4842 8.74233 2.79543C9.10654 3.10667 9.34636 3.53935 9.419 4.02C9.55437 4.98184 9.78918 5.92671 10.12 6.83C10.2541 7.20239 10.2741 7.6047 10.1776 7.98937C10.081 8.37404 9.87201 8.724 9.575 9.00001L8.305 10.27C9.77194 12.8465 11.8935 14.968 14.47 16.435L15.74 15.165C16.016 14.868 16.366 14.659 16.7506 14.5624C17.1353 14.4658 17.5376 14.4859 17.91 14.62C18.8133 14.9508 19.7582 15.1856 20.72 15.321C21.206 15.394 21.6428 15.6385 21.9546 16.008C22.2665 16.3775 22.4335 16.8485 22.423 17.33V16.92Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);