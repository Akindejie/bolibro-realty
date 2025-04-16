'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { setFilters } from '@/state';

const HeroSection = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // New state for slideshow
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    '/bg-unsplash/unsplash-1.jpg',
    '/bg-unsplash/unsplash-2.jpg',
    '/bg-unsplash/unsplash-3.jpg',
    '/bg-unsplash/unsplash-4.jpg',
    '/bg-unsplash/unsplash-5.jpg',
    '/bg-unsplash/unsplash-6.jpg',
  ];

  // Slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [images.length]);

  const handleLocationSearch = async () => {
    try {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          trimmedQuery
        )}.json?access_token=${
          process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        }&fuzzyMatch=true&limit=1`
      );

      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const placeName = data.features[0].place_name;

        dispatch(
          setFilters({
            location: trimmedQuery,
            coordinates: [lng, lat],
          })
        );

        const params = new URLSearchParams({
          location: trimmedQuery,
          coordinates: `${lng},${lat}`,
        });

        router.push(`/search?${params.toString()}`);
      } else {
        console.error('No location found');
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLocationSearch();
    }
  };

  return (
    <div className="relative h-screen">
      <Image
        src={images[currentImageIndex]} // Use current image from slideshow
        alt="Bolibro Realty Platform Hero Section"
        fill
        className="object-cover object-center"
        priority
      />
      {/* change image background opacity here */}
      <div className="absolute inset-0 bg-black/45 z-10"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full z-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-8 md:px-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Start your journey to finding the perfect place to call a home
          </h1>
          <p className="text-lg sm:text-xl md:text-xl text-white mb-8">
            Explore our wide range of realty properties tailored to fit your
            lifestyle and needs!
          </p>
          <div className="flex flex-col sm:flex-row justify-center relative z-30">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by city, neighborhood or address"
              className="w-full max-w-lg rounded-none rounded-l-xl border-none bg-white h-12 z-20 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus-visible:ring-2 mb-4 sm:mb-0 sm:mr-2"
              style={{ pointerEvents: 'auto' }}
            />
            <Button
              onClick={handleLocationSearch}
              className="bg-secondary-500 text-white rounded-none rounded-r-xl border-none hover:bg-secondary-600 h-12 z-20"
              style={{ pointerEvents: 'auto' }}
            >
              Search
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
