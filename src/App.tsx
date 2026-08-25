import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import PublicLayout from './components/PublicLayout';
import {
  AMENITY_CONFIG,
  DINING_CONFIG,
  EVENT_CONFIG,
  OFFER_CONFIG,
} from './admin/pages/contentConfigs';

// Admin portal is code-split so its libs (Recharts, TanStack Table, etc.)
// never ship in the public bundle.
const ProtectedRoute = lazy(() => import('./admin/auth/ProtectedRoute'));
const AdminLayout = lazy(() => import('./admin/components/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin'));
const Dashboard = lazy(() => import('./admin/pages/Dashboard'));
const Bookings = lazy(() => import('./admin/pages/Bookings'));
const AdminStays = lazy(() => import('./admin/pages/Stays'));
const AvailabilityPricing = lazy(() => import('./admin/pages/AvailabilityPricing'));
const ContentManager = lazy(() => import('./admin/pages/ContentManager'));
const Menu = lazy(() => import('./admin/pages/Menu'));
const Addons = lazy(() => import('./admin/pages/Addons'));
const EmailSettings = lazy(() => import('./admin/pages/EmailSettings'));
const Campaigns = lazy(() => import('./admin/pages/Campaigns'));
const Coupons = lazy(() => import('./admin/pages/Coupons'));
const Banners = lazy(() => import('./admin/pages/Banners'));
const Reviews = lazy(() => import('./admin/pages/Reviews'));
const Users = lazy(() => import('./admin/pages/Users'));
const Reports = lazy(() => import('./admin/pages/Reports'));
const Settings = lazy(() => import('./admin/pages/Settings'));
const PaymentSettings = lazy(() => import('./admin/pages/PaymentSettings'));
const Media = lazy(() => import('./admin/pages/Media'));
const Enquiries = lazy(() => import('./admin/pages/Enquiries'));
const AuditLog = lazy(() => import('./admin/pages/AuditLog'));

function AdminFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream text-muted">
      <span className="animate-pulse text-sm tracking-wide">Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Admin portal — its own chrome, no public header/footer */}
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<AdminFallback />}>
              <Routes>
                <Route path="login" element={<AdminLogin />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="bookings" element={<Bookings />} />
                    <Route path="stays" element={<AdminStays />} />
                    <Route element={<ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']} />}>
                      <Route path="availability" element={<AvailabilityPricing />} />
                      <Route path="amenities" element={<ContentManager config={AMENITY_CONFIG} />} />
                      <Route path="dining" element={<ContentManager config={DINING_CONFIG} />} />
                      <Route path="menu" element={<Menu />} />
                      <Route path="addons" element={<Addons />} />
                      <Route path="events" element={<ContentManager config={EVENT_CONFIG} />} />
                      <Route path="offers" element={<ContentManager config={OFFER_CONFIG} />} />
                      <Route path="coupons" element={<Coupons />} />
                      <Route path="banners" element={<Banners />} />
                      <Route path="media" element={<Media />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="users" element={<Users />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="email" element={<EmailSettings />} />
                      <Route path="campaigns" element={<Campaigns />} />
                      <Route path="payments" element={<PaymentSettings />} />
                    </Route>
                    <Route path="enquiries" element={<Enquiries />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
                      <Route path="audit" element={<AuditLog />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          }
        />

        {/* Everything else is the public marketing site */}
        <Route path="/*" element={<PublicLayout />} />
      </Routes>
    </>
  );
}
