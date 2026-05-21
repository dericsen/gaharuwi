import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Plus,
  Minus,
  ArrowRight,
  Leaf,
  Thermometer,
  Timer,
  Instagram,
  Facebook,
  Twitter,
  Star,
  User,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Check
} from 'lucide-react';
import { PRODUCTS } from './data';
import { Product, CartItem } from './types';

// Utils
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

// Help render stars
const StarRating = ({ rating, count }: { rating: number; count?: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center text-brand-gold">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={14} fill="currentColor" stroke="none" />
        ))}
        {hasHalf && (
          <div className="relative inline-block text-brand-gold">
            <Star size={14} className="opacity-30" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden text-brand-gold">
              <Star size={14} fill="currentColor" stroke="none" />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={14} className="text-brand-dark/20" />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-[10px] text-brand-dark/40 font-medium ml-1.5">
          ({count} ulasan)
        </span>
      )}
    </div>
  );
};

export default function App() {
  // Navigation & Views
  const [hasEntered, setHasEntered] = useState(() => {
    return localStorage.getItem('gaharwi_has_entered') === 'true';
  });
  const [view, setView] = useState<'shop' | 'about'>('shop');
  const [scrolled, setScrolled] = useState(false);

  // Cart & Checkout
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals & Details
  const [openFeature, setOpenFeature] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Auth System State
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('gaharwi_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const categories = ['All', ...Array.from(new Set(PRODUCTS.map(p => p.category)))];

  const filteredProducts = selectedCategory === 'All'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === selectedCategory);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (product.stock === 0) {
      alert(`Maaf, ${product.name} sedang habis.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Maksimal stok yang tersedia untuk ${product.name} adalah ${product.stock} unit.`);
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > item.stock) {
          alert(`Maksimal stok yang tersedia adalah ${item.stock} unit.`);
          return item;
        }
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Auth Operations
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authMode === 'signup') {
      if (!authForm.name || !authForm.email || !authForm.password) {
        setAuthError('Mohon isi semua bidang formulir.');
        return;
      }

      // Check email duplicate in local registered database
      const existingUsersStr = localStorage.getItem('gaharwi_registered_users') || '[]';
      const existingUsers = JSON.parse(existingUsersStr);
      if (existingUsers.some((u: any) => u.email === authForm.email)) {
        setAuthError('Email ini sudah terdaftar. Silakan masuk.');
        return;
      }

      // Add user
      const newUser = { name: authForm.name, email: authForm.email, password: authForm.password };
      existingUsers.push(newUser);
      localStorage.setItem('gaharwi_registered_users', JSON.stringify(existingUsers));

      // Auto login
      const userSession = { name: authForm.name, email: authForm.email };
      localStorage.setItem('gaharwi_user', JSON.stringify(userSession));
      setCurrentUser(userSession);
      setAuthSuccess('Pendaftaran berhasil! Menyambut Anda...');

      // Auto enter shop
      localStorage.setItem('gaharwi_has_entered', 'true');

      setTimeout(() => {
        setIsAuthOpen(false);
        setHasEntered(true);
        setAuthForm({ name: '', email: '', password: '' });
        setAuthSuccess('');
      }, 1500);

    } else {
      if (!authForm.email || !authForm.password) {
        setAuthError('Mohon masukkan email dan kata sandi Anda.');
        return;
      }

      // Check standard mock user
      if (authForm.email === 'user@gmail.com' && authForm.password === 'password') {
        const defaultUser = { name: 'Dericen Willim', email: 'user@gmail.com' };
        localStorage.setItem('gaharwi_user', JSON.stringify(defaultUser));
        setCurrentUser(defaultUser);
        setAuthSuccess('Berhasil masuk! Selamat datang kembali.');

        // Auto enter shop
        localStorage.setItem('gaharwi_has_entered', 'true');

        setTimeout(() => {
          setIsAuthOpen(false);
          setHasEntered(true);
          setAuthForm({ name: '', email: '', password: '' });
          setAuthSuccess('');
        }, 1500);
        return;
      }

      // Check in registered users list
      const existingUsersStr = localStorage.getItem('gaharwi_registered_users') || '[]';
      const existingUsers = JSON.parse(existingUsersStr);
      const userMatch = existingUsers.find((u: any) => u.email === authForm.email && u.password === authForm.password);

      if (userMatch) {
        const userSession = { name: userMatch.name, email: userMatch.email };
        localStorage.setItem('gaharwi_user', JSON.stringify(userSession));
        setCurrentUser(userSession);
        setAuthSuccess('Berhasil masuk! Selamat datang kembali.');

        // Auto enter shop
        localStorage.setItem('gaharwi_has_entered', 'true');

        setTimeout(() => {
          setIsAuthOpen(false);
          setHasEntered(true);
          setAuthForm({ name: '', email: '', password: '' });
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthError('Email atau kata sandi salah. Silakan coba lagi.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gaharwi_user');
    setCurrentUser(null);
    alert('Anda telah keluar dari akun.');
  };

  const enterShop = () => {
    localStorage.setItem('gaharwi_has_entered', 'true');
    setHasEntered(true);
  };

  const exitShopToEntrance = () => {
    localStorage.removeItem('gaharwi_has_entered');
    setHasEntered(false);
  };

  // WhatsApp Order helper
  const getWhatsAppLink = (product: Product) => {
    const message = `Halo Gaharuwi, saya tertarik untuk membeli produk berikut:\n\n*${product.name}*\nKategori: ${product.category}\nHarga: ${formatPrice(product.price)}\n\nApakah stoknya masih tersedia? Terima kasih!`;
    return `https://wa.me/6282311919405?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-brand-cream selection:bg-brand-moss selection:text-white relative">

      {/* 1. ENTRANCE SCREEN (GATEKEEPER) */}
      <AnimatePresence>
        {!hasEntered && (
          <motion.div
            key="entrance-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-between py-12 px-6 overflow-hidden bg-brand-dark"
          >

            {/* Background image of Indonesian tropical rain forest */}
            <div
              className="absolute inset-0 z-0 bg-[url('/images/forest_entrance.png')] bg-cover bg-center opacity-85 scale-105 filter saturate-[0.85] brightness-[0.7]"
              style={{ transform: 'translate3d(0, 0, 0)' }}
            />
            {/* Overlay gradients for gorgeous depth */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-brand-forest/30 via-transparent to-brand-dark/95" />

            {/* Top header */}
            <div className="relative z-10 text-center mt-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <Leaf className="text-brand-gold animate-pulse" size={24} />
                </div>
                <p className="text-brand-cream/60 uppercase tracking-[0.4em] text-[10px] font-bold">CV Gaharu Wana Insani</p>
              </motion.div>
            </div>

            {/* Center Content */}
            <div className="relative z-10 text-center max-w-xl px-4 my-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 1 }}
                className="space-y-6"
              >
                <h1 className="serif text-5xl md:text-8xl text-brand-cream tracking-wider font-light leading-none">
                  GAHARUWI
                </h1>
                <div className="w-24 h-[1px] bg-brand-gold mx-auto opacity-60" />
                <p className="serif text-xl md:text-2xl text-brand-cream/80 italic font-light tracking-wide leading-relaxed">
                  "Generasi Peduli Hutan"
                </p>
                <p className="text-white/60 text-xs md:text-sm font-light tracking-wide max-w-md mx-auto leading-relaxed">
                  Menjaga ekosistem bumi, memberdayakan masyarakat sekitar hutan, dan menghadirkan kemurnian teh herbal daun gaharu pilihan standar terbaik.
                </p>
              </motion.div>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 w-full max-w-sm px-6 flex flex-col space-y-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="space-y-3"
              >
                {currentUser ? (
                  <>
                    <button
                      onClick={enterShop}
                      className="w-full bg-brand-moss hover:bg-brand-sage text-brand-cream py-4 rounded-full text-xs uppercase tracking-[0.25em] font-semibold transition-all duration-300 shadow-xl border border-brand-sage/20 flex items-center justify-center space-x-2 group hover:scale-[1.02]"
                    >
                      <span>Masuk (sebagai {currentUser.name})</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-200 py-3.5 rounded-full text-xs uppercase tracking-[0.25em] font-semibold transition-all duration-300 border border-red-500/20 backdrop-blur-sm hover:scale-[1.01]"
                    >
                      Keluar / Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={enterShop}
                      className="w-full bg-brand-moss hover:bg-brand-sage text-brand-cream py-4 rounded-full text-xs uppercase tracking-[0.25em] font-semibold transition-all duration-300 shadow-xl border border-brand-sage/20 flex items-center justify-center space-x-2 group hover:scale-[1.02]"
                    >
                      <span>Masuk Sebagai Tamu</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                    </button>

                    <div className="flex items-center justify-between text-white/40 text-[10px] uppercase tracking-widest px-2">
                      <div className="h-[1px] bg-white/10 flex-1" />
                      <span className="px-3">atau</span>
                      <div className="h-[1px] bg-white/10 flex-1" />
                    </div>

                    <button
                      onClick={() => {
                        setAuthMode('signin');
                        setIsAuthOpen(true);
                      }}
                      className="w-full bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-full text-xs uppercase tracking-[0.25em] font-semibold transition-all duration-300 border border-white/15 backdrop-blur-sm hover:scale-[1.01]"
                    >
                      Sign In / Register
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || view === 'about' ? 'bg-brand-cream/80 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-6'
        }`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <button className="lg:hidden text-brand-dark">
              <Menu size={24} />
            </button>
            <div className="hidden lg:flex space-x-6 text-sm uppercase tracking-widest font-medium text-brand-dark/70">
              <button
                onClick={() => setView('shop')}
                className={`hover:text-brand-dark transition-colors ${view === 'shop' ? 'text-brand-dark border-b border-brand-moss pb-1' : ''}`}
              >
                Shop
              </button>
              <button
                onClick={() => setView('about')}
                className={`hover:text-brand-dark transition-colors ${view === 'about' ? 'text-brand-dark border-b border-brand-moss pb-1' : ''}`}
              >
                Tentang Kami
              </button>
            </div>
          </div>

          <button onClick={() => setView('shop')} className="absolute left-1/2 -translate-x-1/2">
            <h1 className="serif text-3xl font-bold tracking-tight text-brand-dark hover:text-brand-moss transition-colors">GAHARUWI</h1>
          </button>

          <div className="flex items-center space-x-6">
            <button className="text-brand-dark hover:text-brand-gold transition-colors">
              <Search size={20} />
            </button>

            {/* Authentication User Control in Navbar */}
            <div className="relative">
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <div
                    title={currentUser.name}
                    className="w-8 h-8 rounded-full bg-brand-moss text-brand-cream flex items-center justify-center text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm hover:bg-brand-sage transition-colors"
                    onClick={() => {
                      if (window.confirm(`Log out dari akun ${currentUser.name}?`)) {
                        handleLogout();
                      }
                    }}
                  >
                    {currentUser.name.charAt(0)}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="hidden md:inline-block text-brand-dark/50 hover:text-brand-dark hover:scale-105 transition-all"
                    title="Keluar"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setIsAuthOpen(true);
                  }}
                  className="text-brand-dark hover:text-brand-gold transition-colors flex items-center space-x-1 text-xs font-bold uppercase tracking-wider"
                  title="Sign In / Sign Up"
                >
                  <User size={20} className="md:mr-1" />
                  <span className="hidden md:inline">Sign In</span>
                </button>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="text-brand-dark hover:text-brand-gold transition-colors relative"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-gold text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Back to Forest Entrance Shortcut */}
            <button
              onClick={exitShopToEntrance}
              className="text-[9px] uppercase tracking-widest text-brand-moss border border-brand-moss/20 px-2 py-1.5 rounded-md hover:bg-brand-moss hover:text-brand-cream transition-all duration-300 font-bold hidden sm:inline-block"
            >
              Gerbang Utama
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {view === 'shop' ? (
          <motion.main
            key="shop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
              {/* Soft forest ambient blurred picture in main landing as well */}
              <div className="absolute inset-0 z-0 bg-[url('/images/forest_entrance.png')] bg-cover bg-center opacity-40 filter blur-xs" />
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-emerald-900/60 via-green-800/40 to-teal-900/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-brand-cream" />

              <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <span className="text-white/90 uppercase tracking-[0.4em] text-xs mb-6 block font-medium">Fine Artisanal Tea & Honey</span>
                  <h2 className="serif text-6xl md:text-8xl text-white mb-8 font-light italic">The Art of Serenity</h2>

                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button
                      onClick={() => {
                        const target = document.getElementById('collection-section');
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-white text-brand-dark px-10 py-4 rounded-full text-sm uppercase tracking-widest font-semibold hover:bg-brand-moss hover:text-white transition-all duration-300 shadow-xl flex items-center group"
                    >
                      Explore Collection
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </button>

                    <a
                      href="https://wa.me/6282311919405"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-brand-gold hover:bg-white text-white hover:text-brand-dark px-8 py-4 rounded-full text-sm uppercase tracking-widest font-semibold transition-all duration-300 shadow-xl flex items-center gap-2 border border-brand-gold hover:border-white"
                    >
                      <MessageSquare size={16} />
                      Order via WA
                    </a>
                  </div>
                </motion.div>
              </div>

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-brand-dark/50">
                <span className="text-[10px] uppercase tracking-[0.3em] mb-2 font-bold">Scroll</span>
                <div className="w-px h-12 bg-gradient-to-b from-brand-dark/50 to-transparent" />
              </div>
            </section>

            {/* Featured Products */}
            <section id="collection-section" className="py-24 container mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 space-y-6 md:space-y-0">
                <div>
                  <h3 className="serif text-4xl mb-4 text-brand-dark">Our Collections</h3>
                  <p className="text-brand-dark/60 max-w-md">Setiap helai daun gaharu dan bahan herbal dipilih secara teliti untuk menghasilkan seduhan menyehatkan bagi kesehatan tubuh Anda.</p>
                </div>

                <div className="flex space-x-4 overflow-x-auto pb-2 no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-6 py-2 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${selectedCategory === cat
                        ? 'bg-brand-moss text-white shadow-md'
                        : 'bg-white text-brand-dark/50 hover:text-brand-dark border border-brand-dark/5'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, idx) => (
                    <motion.div
                      layout
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      onClick={() => setSelectedProduct(product)}
                      className="group cursor-pointer bg-white/40 p-4 rounded-3xl border border-brand-dark/5 hover:border-brand-moss/20 hover:bg-white/80 transition-all duration-300 shadow-xs hover:shadow-md"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl mb-6 bg-white shadow-sm ring-1 ring-brand-dark/5">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

                        {/* Quick View Button instead of forcing add */}
                        <div
                          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-brand-dark py-3 px-8 rounded-full shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 text-xs font-bold uppercase tracking-widest hover:bg-brand-moss hover:text-white"
                        >
                          Lihat Detail
                        </div>

                        {/* Category Badge */}
                        <div className="absolute top-4 left-4">
                          <span className="bg-brand-cream/90 backdrop-blur-sm text-brand-dark text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold">
                            {product.category}
                          </span>
                        </div>

                        {/* Stock Badges */}
                        <div className="absolute top-4 right-4">
                          {product.stock === 0 ? (
                            <span className="bg-red-500/90 text-white text-[9px] px-3 py-1 rounded-full uppercase tracking-widest font-extrabold shadow-sm">
                              Habis
                            </span>
                          ) : product.stock <= 10 ? (
                            <span className="bg-brand-gold text-white text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-extrabold shadow-sm">
                              Sisa {product.stock}!
                            </span>
                          ) : (
                            <span className="bg-brand-moss/90 text-white text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-extrabold shadow-sm">
                              Stok: {product.stock}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-start px-2">
                        <div className="space-y-1">
                          <h4 className="serif text-xl font-medium text-brand-dark mb-1 group-hover:text-brand-moss transition-colors leading-tight">
                            {product.name}
                          </h4>

                          <div className="flex flex-col space-y-1">
                            {/* Stars rating */}
                            <StarRating rating={product.rating} count={product.reviewCount} />

                            <p className="text-[10px] text-brand-dark/40 uppercase tracking-widest font-semibold">{product.origin}</p>
                          </div>

                          <div className="flex items-center space-x-4 text-brand-dark/50 pt-2">
                            <div className="flex items-center space-x-1">
                              <Thermometer size={12} className="text-brand-gold" />
                              <span className="text-[10px] font-medium">{product.temperature}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Timer size={12} className="text-brand-gold" />
                              <span className="text-[10px] font-medium">{product.steepTime}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <p className="font-bold text-brand-dark text-lg">{formatPrice(product.price)}</p>

                          {/* Quick Add and Direct WhatsApp Button */}
                          <div className="flex flex-col gap-1 items-end pt-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              disabled={product.stock === 0}
                              onClick={(e) => addToCart(product, e)}
                              className={`text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-full font-bold shadow-xs transition-colors duration-200 ${product.stock === 0
                                  ? 'bg-brand-dark/10 text-brand-dark/30 cursor-not-allowed'
                                  : 'bg-brand-moss text-white hover:bg-brand-dark'
                                }`}
                            >
                              + Bag
                            </button>
                            <a
                              href={getWhatsAppLink(product)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider flex items-center space-x-0.5"
                            >
                              <MessageSquare size={10} />
                              <span>Order WA</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>

            {/* Brand Quote */}
            <section className="bg-brand-moss text-brand-cream py-32 overflow-hidden relative">
              <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Leaf className="mx-auto mb-8 text-brand-sage animate-bounce" size={40} />
                  <h3 className="serif text-5xl md:text-7xl mb-10 font-light italic leading-tight">"Generasi Peduli Hutan."</h3>
                  <p className="text-xl font-light leading-loose text-white/70 mb-12 max-w-2xl mx-auto">Komitmen kami untuk keberlanjutan hutan dan ekosistem alam melalui setiap tetes teh yang kami hasilkan.</p>
                  <button onClick={() => setView('about')} className="inline-flex items-center text-sm font-bold uppercase tracking-widest border-b border-brand-cream/30 pb-2 hover:border-brand-cream transition-all">
                    Pelajari Langkah Kami
                    <ArrowRight size={16} className="ml-3" />
                  </button>
                </motion.div>
              </div>
            </section>
          </motion.main>
        ) : (
          <motion.main
            key="about"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="pt-32 pb-24"
          >
            <div className="container mx-auto px-6 max-w-4xl">
              <div className="mb-20 text-center">
                <span className="text-brand-moss uppercase tracking-[0.4em] text-xs mb-4 block font-bold">Tentang Gaharuwi</span>
                <h2 className="serif text-5xl md:text-7xl text-brand-dark mb-8 italic">CV Gaharu Wana Insani</h2>
                <div className="w-24 h-1 bg-brand-gold mx-auto opacity-30" />
              </div>

              <div className="prose prose-brand max-w-none text-brand-dark/80 space-y-8 leading-relaxed">
                <section>
                  <p className="text-xl serif italic font-light">
                    CV Gaharu Wana Insani (GWI) adalah perusahaan yang berkomitmen sebagai generasi peduli hutan. Kami mengakui pentingnya menjaga keberlanjutan hutan, ekosistem alam, serta menjadikannya sebagai basis usaha kami yang berkelanjutan.
                  </p>
                </section>

                {/* VISI, MISI, & TUJUAN SECTION - 3 CARDS LAYOUT */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Card 1: Visi */}
                  <div className="bg-white p-8 rounded-3xl shadow-xs border border-brand-dark/5 hover:border-brand-moss/20 hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 bg-brand-moss/10 rounded-full flex items-center justify-center mb-6">
                        <Leaf className="text-brand-moss" size={20} />
                      </div>
                      <h4 className="serif text-2xl mb-4 text-brand-moss">Visi</h4>
                      <p className="font-light text-sm leading-relaxed text-brand-dark/80">
                        Mewujudkan produk hasil kehutanan inovatif yang dapat bersaing di pasar lokal maupun global.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Misi */}
                  <div className="bg-white p-8 rounded-3xl shadow-xs border border-brand-dark/5 hover:border-brand-moss/20 hover:shadow-md transition-all flex flex-col justify-between md:col-span-1">
                    <div>
                      <div className="w-10 h-10 bg-brand-moss/10 rounded-full flex items-center justify-center mb-6">
                        <ShieldCheck className="text-brand-moss" size={20} />
                      </div>
                      <h4 className="serif text-2xl mb-4 text-brand-moss">Misi</h4>
                      <ul className="space-y-3 font-light text-xs list-disc pl-4 text-brand-dark/80">
                        <li>Mendorong inovasi yang meningkatkan pengolahan hasil kehutanan non-kayu.</li>
                        <li>Berkolaborasi dengan pemerintah & institusi pendidikan medis untuk riset produk herbal.</li>
                        <li>Menghasilkan produk hasil kehutanan bermutu tinggi dengan harga kompetitif.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Card 3: TUJUAN KAMI (New Feature) */}
                  <div className="bg-white p-8 rounded-3xl shadow-xs border border-brand-dark/5 hover:border-brand-moss/20 hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 bg-brand-gold/10 rounded-full flex items-center justify-center mb-6">
                        <Star className="text-brand-gold" size={20} fill="currentColor" />
                      </div>
                      <h4 className="serif text-2xl mb-4 text-brand-moss">Tujuan Kami</h4>
                      <ul className="space-y-3 font-light text-xs list-none text-brand-dark/80">
                        <li className="flex items-start space-x-2">
                          <Check size={12} className="text-brand-gold mt-1 flex-shrink-0" />
                          <span>Menjaga kelestarian hutan melalui pemanfaatan hasil hutan bukan kayu (HHBK).</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Check size={12} className="text-brand-gold mt-1 flex-shrink-0" />
                          <span>Memberdayakan ekonomi lokal masyarakat pinggiran hutan secara berkelanjutan.</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Check size={12} className="text-brand-gold mt-1 flex-shrink-0" />
                          <span>Memperkenalkan khasiat teh gaharu buaya bermutu tinggi berskala nasional.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="space-y-6 pt-12">
                  <h4 className="serif text-3xl text-brand-dark">Fokus & Inovasi</h4>
                  <p>
                    Saat ini fokus utama kami adalah pada pemanfaatan hasil hutan non-kayu, khususnya dalam produksi teh kesehatan (**Wikstea** dan **Acanthace Drink**) serta produk madu hutan murni.
                  </p>
                  <p>
                    Produk ini dikembangkan guna menghasilkan inovasi baru teh herbal siap seduh berkhasiat dengan menggunakan bahan baku daun gaharu jenis *Wikstroemia tenuiramis Miq*. Pengolahan teh gaharu buaya ini menggunakan alat dan prosedur higienis yang memenuhi standar keamanan pangan.
                  </p>
                </section>

                <section className="bg-brand-moss/5 rounded-3xl p-12 border-l-4 border-brand-gold">
                  <h4 className="serif text-2xl text-brand-forest mb-4">Perjalanan Kami</h4>
                  <p className="text-sm font-light leading-relaxed">
                    Wikstea sebelumnya telah mengikuti program Pra-Startup tahun 2020 (Bagian dari Program Startup Inovasi Indonesia Kemenristek/BRIN). Meskipun sempat tertunda akibat pandemi Covid-19, pada akhir tahun 2021 kami kembali melanjutkan program tersebut dan menjadi salah satu penerima pendanaan dari Kemdikbudristek Anggaran 2021.
                  </p>
                </section>
              </div>

              <div className="mt-20 flex justify-center">
                <button
                  onClick={() => setView('shop')}
                  className="bg-brand-moss text-white px-10 py-4 rounded-full text-sm uppercase tracking-widest font-semibold hover:bg-brand-forest transition-all shadow-lg flex items-center"
                >
                  Lihat Produk Kami
                  <ArrowRight className="ml-2" size={18} />
                </button>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Features / Icons */}
      <section className="py-24 border-b border-brand-dark/5">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          <button
            onClick={() => setOpenFeature('ethically')}
            className="group cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <Leaf className="text-brand-moss" />
            </div>
            <h5 className="font-bold uppercase tracking-widest text-xs mb-3 text-brand-dark">Ethically Sourced</h5>
            <p className="text-brand-dark/50 text-sm italic">Direct partnerships with local communities.</p>
          </button>
          <button
            onClick={() => setOpenFeature('quality')}
            className="group cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <Thermometer className="text-brand-moss" />
            </div>
            <h5 className="font-bold uppercase tracking-widest text-xs mb-3 text-brand-dark">Quality Control</h5>
            <p className="text-brand-dark/50 text-sm italic">Standardized production scale.</p>
          </button>
          <button
            onClick={() => setOpenFeature('inovasi')}
            className="group cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <ShoppingBag className="text-brand-moss" />
            </div>
            <h5 className="font-bold uppercase tracking-widest text-xs mb-3 text-brand-dark">Inovasi Hijau</h5>
            <p className="text-brand-dark/50 text-sm italic">Pemanfaatan hasil hutan non-kayu.</p>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-cream py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-1 space-y-4">
              <h1 className="serif text-3xl font-bold tracking-tight text-brand-dark">GAHARUWI</h1>
              <p className="text-xs text-brand-dark/50 leading-relaxed font-light">
                CV Gaharu Wana Insani berkomitmen menjaga hutan Indonesia sekaligus mendistribusikan teh kesehatan premium terpercaya.
              </p>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/acanthacedrink?igsh=MTJyMmRtcG9hcHh6" target="_blank" rel="noopener noreferrer">
                  <Instagram
                    size={20}
                    className="text-brand-dark/50 hover:text-brand-dark cursor-pointer transition-colors"
                  />
                </a>

                <a href="https://www.facebook.com/share/1HkzUaCTt4/" target="_blank" rel="noopener noreferrer">
                  <Facebook
                    size={20}
                    className="text-brand-dark/50 hover:text-brand-dark cursor-pointer transition-colors"
                  />
                </a>
              </div>
            </div>
            <div>
              <h6 className="uppercase tracking-widest text-[10px] font-bold text-brand-dark mb-6">Collections</h6>
              <ul className="space-y-4 text-xs font-medium text-brand-dark/60">
                <li><button onClick={() => { setView('shop'); setSelectedCategory('Wikstea Product') }} className="hover:text-brand-dark">Wikstea Product</button></li>
                <li><button onClick={() => { setView('shop'); setSelectedCategory('Acanthace Drink') }} className="hover:text-brand-dark">Acanthace Drink</button></li>
                <li><button onClick={() => { setView('shop'); setSelectedCategory('GWI Product') }} className="hover:text-brand-dark">GWI Product (Honey)</button></li>
              </ul>
            </div>
            <div>
              <h6 className="uppercase tracking-widest text-[10px] font-bold text-brand-dark mb-6">Company</h6>
              <ul className="space-y-4 text-xs font-medium text-brand-dark/60">
                <li><button onClick={() => setView('about')} className="hover:text-brand-dark">Tentang Kami</button></li>
                <li><button onClick={() => setView('about')} className="hover:text-brand-dark">Visi, Misi & Tujuan</button></li>
                <li><a href="https://wa.me/6282311919405" target="_blank" rel="noopener noreferrer" className="hover:text-brand-dark">Hubungi Kami</a></li>
              </ul>
            </div>
            <div>
              <h6 className="uppercase tracking-widest text-[10px] font-bold text-brand-dark mb-6">Contact</h6>
              <p className="text-xs font-medium text-brand-dark/60">Email: gaharuwi@gmail.com</p>
              <p className="text-xs font-medium text-brand-dark/60">Nomor WA: 0821-6458-5601</p>
              <p className="text-xs font-medium text-brand-dark/60 mt-2">Banjarbaru, Kalimantan Selatan, Indonesia</p>
            </div>
          </div>
          <div className="border-t border-brand-dark/5 pt-10 text-center">
            <p className="text-[10px] uppercase tracking-widest text-brand-dark/40 font-bold">© 2026 GAHARUWI. Generasi Peduli Hutan.</p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-brand-cream z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-brand-dark/5 flex justify-between items-center">
                <h4 className="serif text-2xl">Your Selection ({cartCount})</h4>
                <button onClick={() => setIsCartOpen(false)} className="hover:rotate-90 transition-transform">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-brand-dark/30 space-y-4 pb-20">
                    <ShoppingBag size={64} strokeWidth={1} />
                    <p className="uppercase tracking-[0.2em] text-[10px] font-bold">Your bag is empty</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {cart.map(item => (
                      <div key={item.id} className="flex space-x-6">
                        <div className="w-24 h-32 bg-white rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-brand-dark/5">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start">
                              <h5 className="serif text-lg leading-tight">{item.name}</h5>
                              <button onClick={() => updateQuantity(item.id, -item.quantity)}>
                                <X size={14} className="text-brand-dark/30 hover:text-brand-dark" />
                              </button>
                            </div>
                            <p className="text-[10px] uppercase tracking-widest text-brand-dark/40 mt-1">{item.category}</p>
                          </div>

                          {/* Stock limitation message */}
                          <div className="flex justify-between items-end mt-2">
                            <div className="flex items-center border border-brand-dark/10 rounded-full py-1 px-3 space-x-4">
                              <button onClick={() => updateQuantity(item.id, -1)} className="text-brand-dark/50 hover:text-brand-dark">
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-bold text-brand-dark">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="text-brand-dark/50 hover:text-brand-dark">
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="font-medium text-sm">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 border-t border-brand-dark/5 bg-white space-y-6">
                  <div className="flex justify-between items-center text-brand-dark">
                    <span className="uppercase tracking-widest text-[10px] font-bold opacity-60">Subtotal</span>
                    <span className="text-xl font-bold">{formatPrice(cartTotal)}</span>
                  </div>
                  <button
                    onClick={() => { setIsCheckoutOpen(true); setIsCartOpen(false); }}
                    className="w-full bg-brand-moss text-brand-cream py-5 rounded-full uppercase tracking-[0.2em] text-[11px] font-bold shadow-lg hover:shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center group"
                  >
                    Proceed to Checkout
                    <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-center text-[10px] text-brand-dark/30 italic">Pajak & pengiriman dihitung saat pembayaran</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout QR Mockup */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-brand-cream z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-brand-dark/5 flex justify-between items-center">
                <h4 className="serif text-2xl">Checkout</h4>
                <button onClick={() => setIsCheckoutOpen(false)} className="hover:rotate-90 transition-transform">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="text-center space-y-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-dark/5">
                    <h5 className="serif text-xl mb-6 text-brand-dark">Scan untuk Pembayaran</h5>
                    <div className="w-64 h-64 mx-auto bg-white border-2 border-brand-dark/10 rounded-2xl flex items-center justify-center overflow-hidden">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {Array.from({ length: 10 }).map((_, i) =>
                          Array.from({ length: 10 }).map((_, j) => (
                            <rect
                              key={`${i}-${j}`}
                              x={i * 10}
                              y={j * 10}
                              width="8"
                              height="8"
                              fill={Math.random() > 0.5 ? "#1a1a1a" : "white"}
                            />
                          ))
                        )}
                      </svg>
                    </div>
                    <p className="text-xs text-brand-dark/40 mt-6 uppercase tracking-widest font-medium">QRIS Payment</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-dark/5 text-left">
                    <h6 className="text-xs uppercase tracking-widest font-bold text-brand-dark/50 mb-4">Order Summary</h6>
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-brand-dark/5 last:border-0">
                        <span className="text-sm text-brand-dark/70">{item.name} x{item.quantity}</span>
                        <span className="text-sm font-medium text-brand-dark">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-brand-dark/10">
                      <span className="text-xs uppercase tracking-widest font-bold text-brand-dark/60">Total</span>
                      <span className="text-xl font-bold text-brand-dark">{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCart([]);
                      setIsCheckoutOpen(false);
                      alert('Pesanan berhasil! Terima kasih sudah berbelanja di GAHARUWI. Pembayaran Anda akan kami proses.');
                    }}
                    className="w-full bg-brand-gold text-white py-4 rounded-full uppercase tracking-[0.2em] text-[11px] font-bold shadow-lg hover:shadow-xl hover:opacity-90 transition-all"
                  >
                    Selesaikan Pesanan
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Feature Detail Modal */}
      <AnimatePresence>
        {openFeature && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenFeature(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-brand-cream z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-brand-dark/5 flex justify-between items-center">
                <h4 className="serif text-2xl">
                  {openFeature === 'ethically' && 'Ethically Sourced'}
                  {openFeature === 'quality' && 'Quality Control'}
                  {openFeature === 'inovasi' && 'Inovasi Hijau'}
                </h4>
                <button onClick={() => setOpenFeature(null)} className="hover:rotate-90 transition-transform">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-6">
                  {openFeature === 'ethically' && (
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-brand-moss/10 rounded-full flex items-center justify-center mx-auto">
                        <Leaf className="text-brand-moss" size={40} />
                      </div>
                      <h5 className="serif text-2xl text-center text-brand-dark">Kemitraan Lokal yang Berkelanjutan</h5>
                      <div className="prose prose-brand text-brand-dark/80 space-y-4">
                        <p>Kami menjalin kemitraan langsung dengan masyarakat lokal di sekitar hutan, memastikan bahwa manfaat ekonomi dirasakan secara adil oleh para petani dan pengrajin.</p>
                        <p>Setiap produk yang kami hasilkan merupakan hasil kolaborasi erat dengan komunitas, menjaga kearifan lokal sekaligus meningkatkan kesejahteraan.</p>
                        <ul className="space-y-2 text-sm">
                          <li>✓ Harga adil untuk petani</li>
                          <li>✓ Pelatihan berkelanjutan</li>
                          <li>✓ Pemberdayaan ekonomi lokal</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {openFeature === 'quality' && (
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-brand-moss/10 rounded-full flex items-center justify-center mx-auto">
                        <Thermometer className="text-brand-moss" size={40} />
                      </div>
                      <h5 className="serif text-2xl text-center text-brand-dark">Standar Kualitas Terjamin</h5>
                      <div className="prose prose-brand text-brand-dark/80 space-y-4">
                        <p>Setiap produk melalui proses quality control ketat dengan standar produksi skala yang telah terstandardisasi, menjamin konsistensi kualitas di setiap kemasan.</p>
                        <p>Dari pemilihan bahan baku hingga proses pengemasan, setiap tahapan diawasi secara ketat untuk memastikan produk terbaik sampai ke tangan Anda.</p>
                        <ul className="space-y-2 text-sm">
                          <li>✓ Standar kebersihan makanan</li>
                          <li>✓ Pengujian laboratorium berkala</li>
                          <li>✓ Sertifikasi produk halal</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {openFeature === 'inovasi' && (
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-brand-moss/10 rounded-full flex items-center justify-center mx-auto">
                        <ShoppingBag className="text-brand-moss" size={40} />
                      </div>
                      <h5 className="serif text-2xl text-center text-brand-dark">Inovasi Hijau untuk Masa Depan</h5>
                      <div className="prose prose-brand text-brand-dark/80 space-y-4">
                        <p>Fokus kami pada pemanfaatan hasil hutan non-kayu merupakan bentuk komitmen nyata untuk menjaga kelestarian hutan sambil tetap memberikan manfaat ekonomi.</p>
                        <p>Dari teh gaharu, minuman herbal, hingga kerajinan purun, setiap produk adalah wujud inovasi yang ramah lingkungan dan berkelanjutan.</p>
                        <ul className="space-y-2 text-sm">
                          <li>✓ Tanpa merusak ekosistem hutan</li>
                          <li>✓ Penggunaan bahan baku alami</li>
                          <li>✓ Pengembangan produk inovatif</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. AUTH MODAL (SIGN IN / SIGN UP) */}
      <AnimatePresence>
        {isAuthOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed inset-x-4 top-[10%] md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-brand-cream border border-brand-dark/10 rounded-3xl p-8 shadow-2xl z-[100] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="serif text-2xl text-brand-dark">
                  {authMode === 'signin' ? 'Sign In ke GAHARUWI' : 'Daftar Akun Baru'}
                </h4>
                <button onClick={() => setIsAuthOpen(false)} className="hover:rotate-90 transition-transform">
                  <X size={20} className="text-brand-dark/50 hover:text-brand-dark" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex bg-brand-dark/5 p-1 rounded-full mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setAuthError(''); }}
                  className={`flex-1 text-xs py-2 rounded-full font-bold uppercase tracking-widest transition-all ${authMode === 'signin' ? 'bg-white text-brand-dark shadow-sm' : 'text-brand-dark/40 hover:text-brand-dark'
                    }`}
                >
                  Masuk (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                  className={`flex-1 text-xs py-2 rounded-full font-bold uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-white text-brand-dark shadow-sm' : 'text-brand-dark/40 hover:text-brand-dark'
                    }`}
                >
                  Daftar (Sign Up)
                </button>
              </div>

              {/* Status messaging */}
              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs px-4 py-3 rounded-xl mb-4 font-light">
                  {authError}
                </div>
              )}
              {authSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs px-4 py-3 rounded-xl mb-4 font-light flex items-center space-x-2">
                  <Check size={14} />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* Credentials Hint */}
              {authMode === 'signin' && (
                <div className="bg-brand-gold/5 border border-brand-gold/15 p-4 rounded-2xl mb-4 text-xs text-brand-dark/70 space-y-2.5 font-light">
                  <div className="flex items-center justify-between">
                    <span>💡 <strong>Demo Akun Cepat:</strong></span>
                    <span className="text-[10px] text-brand-moss bg-brand-moss/10 px-2 py-0.5 rounded-full font-bold">Mock Data</span>
                  </div>
                  <p className="text-[10px] text-brand-dark/50">Email: user@gmail.com | Password: password</p>

                  {/* Click to Auto-Login Instantly */}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthForm({
                        name: 'Dericen Willim',
                        email: 'user@gmail.com',
                        password: 'password'
                      });
                      setAuthSuccess('Mengotentikasi akun demo...');

                      // Auto trigger standard login sequence
                      const defaultUser = { name: 'Dericen Willim', email: 'user@gmail.com' };
                      localStorage.setItem('gaharwi_user', JSON.stringify(defaultUser));
                      setCurrentUser(defaultUser);
                      localStorage.setItem('gaharwi_has_entered', 'true');

                      setTimeout(() => {
                        setIsAuthOpen(false);
                        setHasEntered(true);
                        setAuthForm({ name: '', email: '', password: '' });
                        setAuthSuccess('');
                      }, 1200);
                    }}
                    className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer hover:scale-[1.01] shadow-xs flex items-center justify-center space-x-1.5"
                  >
                    <span>⚡ Masuk Instan Dengan Akun Demo</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-brand-dark/50">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap Anda"
                      required
                      value={authForm.name}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-brand-dark/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-moss"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-brand-dark/50">Alamat Email</label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-brand-dark/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-moss"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-brand-dark/50">Kata Sandi</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-brand-dark/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-moss"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-moss hover:bg-brand-dark text-white py-4 rounded-xl text-xs uppercase tracking-widest font-bold mt-6 shadow-md hover:shadow-lg transition-all"
                >
                  {authMode === 'signin' ? 'Masuk Sekarang' : 'Daftarkan Akun'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. PRODUCT DETAIL MODAL (New Feature) */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed inset-x-4 bottom-[5%] md:inset-auto md:top-[12%] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-3xl bg-brand-cream border border-brand-dark/10 rounded-3xl overflow-hidden shadow-2xl z-[90] flex flex-col max-h-[85vh]"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:rotate-90 hover:bg-white transition-all shadow-sm"
                >
                  <X size={18} className="text-brand-dark" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2">

                  {/* Left Column: Image */}
                  <div className="relative aspect-[4/5] md:h-full md:aspect-auto min-h-[300px] bg-white">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-brand-moss text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold shadow-sm">
                        {selectedProduct.category}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Detailed Info */}
                  <div className="p-8 md:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <p className="text-[10px] text-brand-gold uppercase tracking-[0.3em] font-extrabold">{selectedProduct.origin}</p>

                      <h3 className="serif text-3xl font-medium text-brand-dark leading-tight">
                        {selectedProduct.name}
                      </h3>

                      {/* Ratings Display */}
                      <div className="flex items-center space-x-2 pt-1 border-b border-brand-dark/5 pb-3">
                        <StarRating rating={selectedProduct.rating} count={selectedProduct.reviewCount} />
                        <span className="text-xs text-brand-dark/60 font-semibold bg-brand-gold/10 px-2.5 py-0.5 rounded-md">
                          {selectedProduct.rating.toFixed(1)} / 5.0
                        </span>
                      </div>

                      {/* Price & Stock Indicator */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-2xl font-bold text-brand-dark">{formatPrice(selectedProduct.price)}</span>

                        {/* Dynamic Stock Indicator badge */}
                        <div>
                          {selectedProduct.stock === 0 ? (
                            <span className="bg-red-500 text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-extrabold">
                              Stok Habis
                            </span>
                          ) : selectedProduct.stock <= 10 ? (
                            <span className="bg-amber-500 text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-extrabold animate-pulse">
                              Stok Terbatas: Sisa {selectedProduct.stock}!
                            </span>
                          ) : (
                            <span className="bg-emerald-600 text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-bold">
                              Stok Tersedia ({selectedProduct.stock})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Technical specifications */}
                      <div className="grid grid-cols-2 gap-3 bg-brand-dark/5 p-4 rounded-2xl text-xs">
                        <div className="flex items-center space-x-2">
                          <Thermometer size={14} className="text-brand-moss" />
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-brand-dark/40 font-bold">Suhu Air</p>
                            <p className="font-semibold text-brand-dark">{selectedProduct.temperature}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Timer size={14} className="text-brand-moss" />
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-brand-dark/40 font-bold">Lama Seduh</p>
                            <p className="font-semibold text-brand-dark">{selectedProduct.steepTime}</p>
                          </div>
                        </div>
                      </div>

                      {/* Product Description */}
                      <div className="space-y-2">
                        <h5 className="text-[10px] uppercase tracking-widest font-extrabold text-brand-dark/40">Deskripsi Produk</h5>
                        <p className="text-xs text-brand-dark/70 leading-relaxed font-light">
                          {selectedProduct.description}
                        </p>
                      </div>
                    </div>

                    {/* Actions and Media Order Shortcuts */}
                    <div className="space-y-4 pt-4 border-t border-brand-dark/5">

                      {/* Cart Purchase */}
                      <button
                        disabled={selectedProduct.stock === 0}
                        onClick={() => {
                          addToCart(selectedProduct);
                          setSelectedProduct(null);
                        }}
                        className={`w-full py-4 rounded-xl text-xs uppercase tracking-widest font-bold shadow-sm transition-all duration-300 ${selectedProduct.stock === 0
                            ? 'bg-brand-dark/10 text-brand-dark/30 cursor-not-allowed'
                            : 'bg-brand-moss text-white hover:bg-brand-dark shadow-md hover:shadow-lg hover:scale-[1.01]'
                          }`}
                      >
                        {selectedProduct.stock === 0 ? 'Produk Habis' : 'Tambah Ke Keranjang'}
                      </button>

                      {/* Shortcut to Media For Purchase (WhatsApp & Instagram) */}
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href={getWhatsAppLink(selectedProduct)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-[10px] uppercase tracking-wider font-bold text-center flex items-center justify-center space-x-2 shadow-xs hover:shadow-sm transition-all"
                        >
                          <MessageSquare size={14} />
                          <span>Pesan via WA</span>
                        </a>

                        <a
                          href="https://www.instagram.com/acanthacedrink?igsh=MTJyMmRtcG9hcHh6"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white hover:bg-brand-dark hover:text-white text-brand-dark border border-brand-dark/10 py-3 rounded-xl text-[10px] uppercase tracking-wider font-bold text-center flex items-center justify-center space-x-2 shadow-xs hover:shadow-sm transition-all"
                        >
                          <Instagram size={14} />
                          <span>Pesan via IG</span>
                        </a>
                      </div>
                      <p className="text-[9px] text-brand-dark/30 text-center font-light italic">
                        *Klik tombol Pesan via WA untuk melangsungkan obrolan pemesanan instan terisi otomatis dengan admin.
                      </p>
                    </div>

                  </div>

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
