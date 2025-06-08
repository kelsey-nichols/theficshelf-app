import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export default function Welcome() {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const aboutRef = useRef(null);

  useEffect(() => {
    if (user) navigate("/bookshelf");
  }, [user, navigate]);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-[#202d26] text-[#d3b7a4] font-serif">
      {/* Logo */}
      <div className="absolute top-6 right-6 z-10 text-3xl sm:text-4xl md:text-5xl italic font-bold">
        the fic shelf
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 sm:px-10 pt-24 lg:pt-0">
        {/* Left */}
        <motion.div
          className="w-full lg:w-1/2 flex justify-center lg:justify-start items-center"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl text-center lg:text-left">
            hello, reader
          </h1>
        </motion.div>

        {/* Right */}
        <motion.div
          className="w-full lg:w-1/2 flex justify-center items-center mt-10 lg:mt-0"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="flex flex-col items-center space-y-4 max-w-xs w-full">
            <button
              onClick={() => navigate("/signup")}
              className="border-2 px-8 py-3 text-xl rounded-full w-full transition duration-300 hover:bg-[#d3b7a4] hover:text-[#202d26]"
              style={{
                color: '#d3b7a4',
                borderColor: '#d3b7a4',
              }}
            >
              SIGN UP
            </button>
            <button
              onClick={() => navigate("/signin")}
              className="border-2 px-8 py-3 text-xl rounded-full w-full transition duration-300 hover:bg-[#aebbb4] hover:text-[#202d26]"
              style={{
                color: '#aebbb4',
                borderColor: '#aebbb4',
              }}
            >
              SIGN IN
            </button>
          </div>
        </motion.div>
      </section>

      {/* Scroll Arrow */}
      <motion.div
        className="flex justify-center pb-8"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <button onClick={scrollToAbout}>
          <ChevronDown className="w-8 h-8 text-[#d3b7a4]" />
        </button>
      </motion.div>

      {/* About Section */}
      <motion.section
        ref={aboutRef}
        className="bg-[#d3b7a4] text-[#202d26] px-6 py-16"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">What is The Fic Shelf?</h2>
          <p className="text-lg leading-relaxed">
            The Fic Shelf is your personal companion for keeping track of fanfiction reads. This app allows you to organize
            fics into shelves, log your reading progress with notes and dates, and discover new works in an intuitive, lightweight interface.
          </p>
          <p className="text-lg leading-relaxed mt-4">
            Beyond simple bookmarking, The Fic Shelf gives you powerful tools: view analytics on your reading habits, save and share shelves with friends, and revisit your year in fanfiction with a personalized end-of-year recap.
          </p>
          <p className="text-lg leading-relaxed">
            All your data is yours — export it anytime or delete your account with a single click. And it’s completely free, supported by voluntary donations to cover
            hosting and development costs.
          </p>
        </div>
      </motion.section>

      {/* Demo Section */}
      <motion.section
        className="bg-[#202d26] text-[#d3b7a4] px-6 py-16"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto space-y-10 text-center">
          <h2 className="text-3xl font-bold mb-4">See It in Action</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Replace with real screenshots later */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#d3b7a4] p-4 rounded-xl shadow-lg aspect-[3/2] flex items-center justify-center">
                <span className="text-[#202d26] text-xl font-semibold">Screenshot {i}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
