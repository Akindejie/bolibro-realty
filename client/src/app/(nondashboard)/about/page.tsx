'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import FooterSection from '../landing/FooterSection';

const AboutUs = () => {
  return (
    <div>
      <Navbar />
      <main className="pt-10 md:pt-16 pb-16 px-4 sm:px-8 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            About Us
          </h1>

          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="md:w-1/2">
              <Image
                src="/bolibro-logo-black.png"
                alt="Bolibro Realty Logo"
                width={350}
                height={350}
                className="rounded-lg"
                priority
              />
            </div>
            <div className="md:w-1/2">
              <p className="text-gray-700 mb-4 leading-relaxed">
                At Bolibro Realty, we&apos;re more than just a property
                management company — we&apos;re a team dedicated to creating
                safe, comfortable, and quality living spaces for our tenants.
                Specializing in rental properties tailored for healthcare
                professionals, students, engineers, and Section 8 tenants, we
                offer a wide range of leasing options including long-term,
                short-term, and mid-term rentals to suit your lifestyle and
                needs.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              We pride ourselves on delivering unmatched comfort, spacious
              layouts, and a peaceful environment where our guests can truly
              feel at home. Whether you&apos;re on a travel assignment, pursuing
              education, or seeking stable housing, Bolibro Realty ensures a
              seamless and supportive rental experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Our Values
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Our commitment is rooted in loyalty, trust, and exceptional
                service. We go above and beyond to provide the highest quality
                of care, offering personalized attention to every guest —
                because your comfort and well-being matter to us.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Our Promise
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Welcome to Bolibro Realty — where your peace of mind is our
                priority. We are committed to maintaining the highest standards
                in property management and tenant satisfaction.
              </p>
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Ready to Find Your Next Home?
            </h2>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90">
                Explore Our Properties
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default AboutUs;
