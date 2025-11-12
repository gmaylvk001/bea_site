import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube, FaWhatsapp} from "react-icons/fa";
import { FiMail, FiPhone } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-[#2e2a2a] text-gray-300 text-sm py-10">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Section - Corporate Office */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-lg mb-4">Corporate Office</h3>
          <p>26/1 Drr. Alagappa Chettiyar Rd, Tatabad, Near Kovai Scan Centre, Coimbatore-641012</p>
          <hr className="border-gray-600 my-3" />
          <div className="flex items-center gap-2">
            <FiPhone /> 
            <span>9842344323</span>
          </div>
          <hr className="border-gray-600 my-3" />
          <div className="flex items-center gap-2">
            <FiMail /> 
            <span>customercare@bharatelectronics.in</span>
          </div>
          <hr className="border-gray-600 my-3" />
          <p><strong>Business Hours:</strong> 09:30AM - 09:30 PM (Mon to Sun)</p>
        </div>

        {/* Middle Section - My Account & Policies (Centered) */}
        <div className="flex flex-col space-y-6 md:mx-auto">
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">My Account</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:underline hover:text-white">Sign In</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Policy</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:underline hover:text-white">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:underline hover:text-white">Shipping Policy</Link></li>
              <li><Link href="#" className="hover:underline hover:text-white">Terms and Conditions</Link></li>
              <li><Link href="#" className="hover:underline hover:text-white">Cancellation and Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Right Section - Company & Social Media (Right-aligned) */}
        <div className="md:ml-auto">
          <div className="mb-8">
            <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:underline hover:text-white">About Us</Link></li>
              <li><Link href="#" className="hover:underline hover:text-white">Contact Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-white"><FaWhatsapp className="text-xl text-green-500" /></Link>
              <Link href="#" className="hover:text-white"><FaFacebookF className="text-xl text-customBlue" /></Link>
              <Link href="#" className="hover:text-white"><FaInstagram className="text-xl text-pink-500" /></Link>
              <Link href="#" className="hover:text-white"><FaYoutube className="text-xl text-red-500" /></Link>
              <Link href="#" className="hover:text-white"><FaXTwitter className="text-xl text-black-500" /></Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-600 mt-10 pt-6 text-center text-gray-400">
        <p className="mb-4">Bharath Electronics © 2025 All rights reserved.</p>
        <div className="flex justify-center gap-6 mb-4">
          <Image src="/user/play.jpg" alt="Google Play" width={120} height={40} />
          <Image src="/user/apple.png" alt="App Store" width={120} height={40} />
        </div>
        <div className="flex justify-center gap-4">
          <Image src="/user/allimg.png" alt="PayPall" width={200} height={120} />
         
        </div>
      </div>
    </footer>
  );
};

export default Footer;