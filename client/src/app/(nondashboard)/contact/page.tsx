'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import FooterSection from '../landing/FooterSection';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactUs = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    }, 1500);

    // In a real implementation, you would send the data to your backend
    // const response = await fetch('/api/contact', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(formData),
    // });
  };

  return (
    <div>
      <Navbar />
      <main className="pt-10 md:pt-16 pb-16 px-4 sm:px-8 lg:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Contact Us
          </h1>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="col-span-2">
              {submitted ? (
                <div className="bg-green-50 p-8 rounded-lg border border-green-200 text-center">
                  <h3 className="text-xl font-semibold text-green-700 mb-3">
                    Thank You!
                  </h3>
                  <p className="text-gray-700 mb-6">
                    Your message has been received. We&apos;ll get back to you
                    as soon as possible.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-gray-50 p-6 rounded-lg"
                >
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Send Us a Message
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Full Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        required
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Please describe how we can help you..."
                      required
                      className="w-full min-h-[150px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 w-full md:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </div>

            <div>
              <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Contact Information
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-primary mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Email Us
                      </p>
                      <a
                        href="mailto:info@bolibrorealty.com"
                        className="text-primary hover:underline"
                      >
                        info@bolibrorealty.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-primary mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Call Us
                      </p>
                      <a
                        href="tel:+15138187741"
                        className="text-primary hover:underline"
                      >
                        +1 (513) 818-7741
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-primary mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Office Address
                      </p>
                      <address className="not-italic text-gray-600">
                        Realty Way
                        <br />
                        Cleveland, Ohio,
                        <br />
                        United States
                      </address>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-primary mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Office Hours
                      </p>
                      <p className="text-gray-600">
                        Monday to Friday: 9AM - 6PM
                        <br />
                        Weekend: Closed
                        <br />
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Looking for Properties?
                </h3>
                <p className="text-gray-700 mb-4">
                  Explore our available properties or contact us to discuss your
                  specific housing needs.
                </p>
                <Link href="/">
                  <Button className="bg-primary hover:bg-primary/90 w-full">
                    View Properties
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default ContactUs;
