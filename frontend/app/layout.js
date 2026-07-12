import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import ScrollProgress from '../components/ScrollProgress';
import '../styles/globals.css';
import '../styles/auth.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  title: 'Sigma Infotech — Used Laptops, Desktops & Printers | Mangalore',
  description:
    'Sigma Infotech, Mangalore — buy certified used laptops, desktops and printers, plus expert repair and upgrade service. Visit us at Pumpwell Circle.',
  icons: {
    icon: '/images/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <CartProvider>
            <Header />
            {children}
            <Footer />
            <Toast />
            <ScrollProgress />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

