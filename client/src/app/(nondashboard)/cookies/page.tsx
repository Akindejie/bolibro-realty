'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import FooterSection from '../landing/FooterSection';
import Link from 'next/link';

const CookiePolicy = () => {
  return (
    <div>
      <Navbar />
      <main className="pt-10 md:pt-16 pb-16 px-4 sm:px-8 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Cookie Policy
          </h1>

          <div className="mb-8">
            <p className="text-gray-700 mb-4">
              Last Updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-gray-700 mb-4">
              This Cookie Policy explains how Bolibro Realty (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) uses cookies and similar
              technologies on our website. By using our website, you consent to
              the use of cookies as described in this policy.
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                1. What Are Cookies?
              </h2>
              <p className="text-gray-700">
                Cookies are small text files that are placed on your device
                (computer, tablet, or mobile) when you visit a website. Cookies
                are widely used to make websites work more efficiently, provide
                a better browsing experience, and give website owners
                information about how users interact with their site. Cookies
                can be &quot;persistent&quot; or &quot;session&quot; cookies.
                Persistent cookies remain on your device after you have closed
                your browser, while session cookies are deleted as soon as you
                close your browser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                2. Types of Cookies We Use
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">
                    Essential Cookies
                  </h3>
                  <p>
                    These cookies are necessary for the website to function and
                    cannot be switched off in our systems. They are usually only
                    set in response to actions made by you which amount to a
                    request for services, such as setting your privacy
                    preferences, logging in, or filling in forms.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">
                    Performance Cookies
                  </h3>
                  <p>
                    These cookies allow us to count visits and traffic sources
                    so we can measure and improve the performance of our site.
                    They help us to know which pages are the most and least
                    popular and see how visitors move around the site.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">
                    Functional Cookies
                  </h3>
                  <p>
                    These cookies enable the website to provide enhanced
                    functionality and personalization. They may be set by us or
                    by third-party providers whose services we have added to our
                    pages.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">
                    Targeting Cookies
                  </h3>
                  <p>
                    These cookies may be set through our site by our advertising
                    partners. They may be used by those companies to build a
                    profile of your interests and show you relevant
                    advertisements on other sites.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                3. Third-Party Cookies
              </h2>
              <p className="text-gray-700 mb-3">
                In addition to our own cookies, we may also use various
                third-party cookies to report usage statistics of the site,
                deliver advertisements on and through the site, and so on. These
                may include:
              </p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Analytics providers (such as Google Analytics)</li>
                <li>
                  Social media platforms (such as Facebook, Twitter, LinkedIn)
                </li>
                <li>Advertising networks</li>
                <li>Customer support service providers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                4. How to Control Cookies
              </h2>
              <p className="text-gray-700 mb-3">
                You can control and/or delete cookies as you wish. You can
                delete all cookies that are already on your computer and you can
                set most browsers to prevent them from being placed. However, if
                you do this, you may have to manually adjust some preferences
                every time you visit a site, and some services and
                functionalities may not work.
              </p>
              <p className="text-gray-700">
                To learn more about how to manage cookies in your browser,
                please visit:
              </p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1 mt-2">
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Microsoft Edge
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/en-us/HT201265"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Safari
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                5. Changes to This Cookie Policy
              </h2>
              <p className="text-gray-700">
                We may update our Cookie Policy from time to time. We will
                notify you of any changes by posting the new Cookie Policy on
                this page and updating the &quot;Last Updated&quot; date. You
                are advised to review this Cookie Policy periodically for any
                changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                6. More Information
              </h2>
              <p className="text-gray-700 mb-3">
                If you have any questions about our use of cookies, please
                contact us at:
              </p>
              <p className="text-gray-700">
                <a
                  href="mailto:info@bolibrorealty.com"
                  className="text-primary hover:underline"
                >
                  info@bolibrorealty.com
                </a>
              </p>
              <p className="text-gray-700 mt-4">
                For more information about our privacy practices, please review
                our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default CookiePolicy;
