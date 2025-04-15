'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/state/redux';

const CallToActionSection = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  const handleSearch = () => {
    router.push('/search');
  };

  return (
    <div className="relative py-24 h-[500px]">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/landing-call-to-action.jpg"
          alt="Bolibro Realty Search Section Background"
          fill
          className="object-cover object-center z-0"
        />
      </div>
      <div className="absolute inset-0 bg-black opacity-30 z-10"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-20 flex flex-col items-center justify-center h-full max-w-4xl xl:max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-center text-white leading-tight">
          Find Your Dream Property
        </h2>

        <p className="text-lg md:text-xl text-center max-w-2xl mx-auto mb-10 text-white">
          Discover a wide range of properties in your desired location.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <button
            onClick={handleSearch}
            className="inline-block text-primary-700 bg-white rounded-lg px-8 py-4 font-semibold hover:bg-primary-500 hover:text-primary-50 transition-colors duration-300 shadow-lg"
          >
            Search Properties
          </button>
          {!isAuthenticated && (
            <Link
              href="/signup"
              className="inline-block text-white bg-secondary-500 rounded-lg px-8 py-4 font-semibold hover:bg-secondary-600 transition-colors duration-300 shadow-lg"
              scroll={false}
            >
              Sign Up
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CallToActionSection;
