import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from './lib/i18n'
import { ContentProvider, CartProvider } from './lib/store'
import Layout from './components/Layout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Checkout from './pages/Checkout'
import { About, Contact, Wishlist } from './pages/Pages'
import NotFound from './pages/NotFound'
import './styles/site.css'

// لوحة التحكم بتتحمل لوحدها عشان ما تتقلش الموقع
const AdminApp = lazy(() => import('./admin/AdminApp'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <ContentProvider>
          <CartProvider>
            <Routes>
              <Route path="/admin/*" element={<Suspense fallback={<div className="loading" />}><AdminApp /></Suspense>} />
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="p/:slug" element={<Product />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </CartProvider>
        </ContentProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
)
