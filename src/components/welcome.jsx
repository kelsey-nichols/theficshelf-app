import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { ChevronDown } from "lucide-react";

export default function Welcome() {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const aboutRef = useRef(null);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#202d26" }}>
      {/* Logo top right */}
      <div
        className="absolute top-6 right-6 z-10 text-3xl sm:text-4xl md:text-5xl italic font-bold font-serif"
        style={{ color: "#d3b7a4" }}
      >
        the fic shelf
      </div>

      {/* Hero Section */}
      <div className="flex flex-1 flex-col lg:flex-row items-center justify-center px-6 sm:px-10 pt-24 lg:pt-0 h-screen">
        {/* Left Side */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-start items-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-center lg:text-left" style={{ color: "#d3b7a4" }}>
            hello, reader
          </h1>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 flex justify-center items-center">
          <div className="flex flex-col items-center space-y-4 max-w-xs w-full">
            <button
              onClick={() => navigate("/signup")}
              className="border-3 px-8 py-3 text-xl rounded-full w-full transition"
              style={{
                color: '#d3b7a4',
                borderColor: '#d3b7a4',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#d3b7a4';
                e.currentTarget.style.color = '#202d26';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#d3b7a4';
              }}
            >
              SIGN UP
            </button>
            <button
              onClick={() => navigate("/signin")}
              className="border-3 px-8 py-3 text-xl rounded-full w-full transition"
              style={{
                color: '#aebbb4',
                borderColor: '#aebbb4',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#aebbb4';
                e.currentTarget.style.color = '#202d26';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#aebbb4';
              }}
            >
              SIGN IN
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Down Arrow */}
      <div className="flex justify-center pb-8 animate-bounce">
        <button onClick={scrollToAbout}>
          <ChevronDown className="w-8 h-8 text-[#d3b7a4]" />
        </button>
      </div>

      {/* About Section */}
      <section ref={aboutRef} className="bg-[#d3b7a4] text-[#202d26] px-6 py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">What is The Fic Shelf?</h2>
          <p className="text-lg leading-relaxed">
            The Fic Shelf is your personal companion for keeping track of fanfiction reads. Inspired by Archive of Our Own (AO3), this app allows you to organize
            stories into shelves, log your reading progress with notes and dates, and discover new works in an intuitive, lightweight interface.
          </p>
          <p className="text-lg leading-relaxed">
            All your data is yours — export it anytime or delete your account with a single click. And it’s completely free, supported by voluntary donations to cover
            hosting and development costs.
          </p>
        </div>
      </section>
    </div>
  );
}

