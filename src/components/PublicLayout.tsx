import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import CallButton from './CallButton';
import SiteAnimations from './SiteAnimations';

// Public pages are code-split so each route only ships what it needs.
const Home = lazy(() => import('../pages/Home'));
const About = lazy(() => import('../pages/About'));
const Stays = lazy(() => import('../pages/Stays'));
const StayDetail = lazy(() => import('../pages/StayDetail'));
const Amenities = lazy(() => import('../pages/Amenities'));
const AmenityDetail = lazy(() => import('../pages/AmenityDetail'));
const Dining = lazy(() => import('../pages/Dining'));
const Events = lazy(() => import('../pages/Events'));
const Offers = lazy(() => import('../pages/Offers'));
const Reserve = lazy(() => import('../pages/Reserve'));
const BookFlow = lazy(() => import('../pages/BookFlow'));
const SignIn = lazy(() => import('../pages/SignIn'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const Account = lazy(() => import('../pages/Account'));
const FindBooking = lazy(() => import('../pages/FindBooking'));
const Gallery = lazy(() => import('../pages/Gallery'));
const NotFound = lazy(() => import('../pages/NotFound'));

function PageFallback() {
  return (
    <div className="grid min-h-[55vh] place-items-center" role="status" aria-label="Loading page">
      <span className="animate-pulse font-serif text-lg text-muted">Loading…</span>
    </div>
  );
}

/** The public marketing site: header + routed page + footer. */
export default function PublicLayout() {
  const location = useLocation();

  return (
    <div id="public-root" className="flex min-h-screen flex-col bg-cream">
      <SiteAnimations />
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-1"
            >
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/amenities" element={<Amenities />} />
                <Route path="/amenities/:slug" element={<AmenityDetail />} />
                <Route path="/stays" element={<Stays />} />
                <Route path="/stays/:slug" element={<StayDetail />} />
                <Route path="/dining" element={<Dining />} />
                <Route path="/events" element={<Events />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/reserve" element={<Reserve />} />
                <Route path="/enquiry" element={<Reserve />} />
                <Route path="/book" element={<BookFlow />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/account" element={<Account />} />
                <Route path="/find-booking" element={<FindBooking />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      <Footer />
      <CallButton />
    </div>
  );
}