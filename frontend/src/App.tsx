import { Route, Routes } from 'react-router-dom'
import CartDrawer from './components/CartDrawer'
import ChatWidget from './components/ChatWidget'
import AnnouncementBar from './components/AnnouncementBar'
import Footer from './components/Footer'
import NavBar from './components/NavBar'
import WelcomeBanner from './components/WelcomeBanner'
import About from './pages/About'
import { Login, Signup } from './pages/Auth'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Products from './pages/Products'

export default function App() {
  return (
    <>
      <AnnouncementBar />
      <NavBar />
      <WelcomeBanner />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <ChatWidget />
    </>
  )
}
