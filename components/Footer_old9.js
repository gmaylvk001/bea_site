import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { FiMail, FiPhone } from "react-icons/fi";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-[#1a1919] text-gray-300 text-sm py-10">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Corporate Office */}
        <div>
          <h3 className="text-white font-semibold mb-4">Corporate Office:</h3>
          <p className="mb-2">26/1 Dr. Alagappa Chettiyar Rd, Tatabad, Near Kovai Scan Centre, Coimbatore-641012</p>
          <hr className="border-gray-600 my-3" />
          <p className="flex items-center gap-2"><FiPhone /> 9842344323</p>
          <hr className="border-gray-600 my-3" />
          <p className="flex items-center gap-2"><FiMail /> customercare@bharatelectronics.in</p>
          <hr className="border-gray-600 my-3" />
          <p><strong>Business Hours:</strong> 09:30AM - 09:30 PM (Mon to Sun)</p>
        </div>

        {/* My Account & Policies */}
        <div>
          <h3 className="text-white font-semibold mb-4">My Account</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:underline">Sign In</Link></li>
          </ul>
          <h3 className="text-white font-semibold mt-6 mb-4">Policy</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:underline">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:underline">Shipping Policy</Link></li>
            <li><Link href="#" className="hover:underline">Terms and Conditions</Link></li>
            <li><Link href="#" className="hover:underline">Cancellation and Refund Policy</Link></li>
          </ul>
        </div>

        {/* Company Info */}
        <div>
          <h3 className="text-white font-semibold mb-4">Company</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:underline">About Us</Link></li>
            <li><Link href="#" className="hover:underline">Contact Us</Link></li>
          </ul>
        </div>

        {/* Newsletter & Social Media */}
        <div>
          <h3 className="text-white font-semibold mb-4">Sign up to Newsletter</h3>
          <p className="mb-3">Get all the latest information on Events, Sales, and Offers. Sign up for the newsletter today.</p>
          <div className="flex">
            <input type="email" placeholder="Enter Your Email address" className="w-full px-3 py-2 text-black rounded-l-md outline-none" />
            <button className="bg-blue-600 px-4 text-white rounded-r-md">→</button>
          </div>

          {/* Social Media Icons */}
          <div className="flex space-x-4 mt-4">
            <Link href="#"><FaWhatsapp className="text-xl hover:text-white" /></Link>
            <Link href="#"><FaFacebookF className="text-xl hover:text-white" /></Link>
            <Link href="#"><FaInstagram className="text-xl hover:text-white" /></Link>
            <Link href="#"><FaYoutube className="text-xl hover:text-white" /></Link>
            <Link href="#"><FaLinkedinIn className="text-xl hover:text-white" /></Link>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-600 mt-6 pt-4 text-center text-gray-400">
        <p>Bharath Electronics © 2025 All rights reserved.</p>
        <div className="flex justify-center mt-3 space-x-6">
          <Image src="/user/google-play.png" alt="Google Play" width={120} height={40} />
          <Image src="/user/app-store.png" alt="App Store" width={120} height={40} />
        </div>
        <div className="flex justify-center mt-3 space-x-4">
          <Image src="/user/paypal.png" alt="PayPal" width={50} height={30} />
          <Image src="/user/maestro.png" alt="Maestro" width={50} height={30} />
          <Image src="/user/discover.png" alt="Discover" width={50} height={30} />
          <Image src="/user/visa.png" alt="Visa" width={50} height={30} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
