'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaPhoneAlt,  FaStore  } from "react-icons/fa";
import { MdDateRange } from "react-icons/md";
import { IoWalletSharp } from "react-icons/io5";
import { IoMdMail } from "react-icons/io";
import { TbTruckDelivery } from "react-icons/tb";
import { MdOutlineLocalShipping, MdDeliveryDining, MdContacts } from "react-icons/md";

const OrderDetails = () => {
  const params = useParams();
  const orderId = params?.orderId;

  const [order, setOrder] = useState(null);
  const [pincodeDeliveryCharge, setPincodeDeliveryCharge] = useState(null);

  useEffect(() => {
    if (!order) return;

    if (order.delivery_type === "store_pickup") {
      setPincodeDeliveryCharge(0);
      return;
    }

    if (
      order.delivery_charge != null ||
      order.shipping_fee != null ||
      order.shipping_cost != null ||
      order.delivery_fee != null
    ) {
      return;
    }

    const pinMatch = String(order.order_deliveryaddress || "").match(/\b\d{6}\b/);
    if (!pinMatch) return;

    const pin = pinMatch[0];
    let isCancelled = false;

    fetch(`/api/free-delivery-location/check?pincode=${encodeURIComponent(pin)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.success && data.isFreeDelivery) {
          setPincodeDeliveryCharge(0);
        } else {
          const itemsTotal = (order.order_details || []).reduce((sum, item) => {
            const price = Number(item.product_price || 0);
            return sum + (Number(item.quantity || 1) * price);
          }, 0);
          const priceToCheck = itemsTotal > 0 ? itemsTotal : (parseFloat(order.order_amount) || 0);
          setPincodeDeliveryCharge(priceToCheck < 10000 ? 299 : 499);
        }
      })
      .catch((err) => {
        console.error("Free delivery check error:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [order]);

  const getDeliveryCharge = () => {
    if (!order) return 0;

    if (order.delivery_charge !== undefined && order.delivery_charge !== null) {
      return Number(order.delivery_charge);
    }
    if (order.shipping_fee !== undefined && order.shipping_fee !== null) {
      return Number(order.shipping_fee);
    }
    if (order.shipping_cost !== undefined && order.shipping_cost !== null) {
      return Number(order.shipping_cost);
    }
    if (order.delivery_fee !== undefined && order.delivery_fee !== null) {
      return Number(order.delivery_fee);
    }

    if (order.delivery_type === "store_pickup") {
      return 0;
    }

    const total = parseFloat(order.order_amount || 0);
    const itemsTotal = (order.order_details || []).reduce((sum, item) => {
      const price = Number(item.product_price || 0);
      return sum + (Number(item.quantity || 1) * price);
    }, 0);
    const warrantyTotal = (order.order_item || []).reduce((sum, item) => {
      return sum + Number(item.extendedWarranty || item.warrantyData?.price || 0);
    }, 0);
    const discounts = Number(order.loyalty_discount || 0) + Number(order.promotion_discount_applied || 0);
    const calculatedProductsTotal = itemsTotal + warrantyTotal - discounts;

    const diff = Math.round(total - calculatedProductsTotal);

    if (diff === 299 || diff === 499) {
      return diff;
    }

    if (pincodeDeliveryCharge !== null) {
      return pincodeDeliveryCharge;
    }

    if (diff > 0 && calculatedProductsTotal > 0 && diff < total) {
      return diff;
    }

    return 0;
  };

  const deliveryCharge = getDeliveryCharge();
  const totalAmount = parseFloat(order?.order_amount || 0);
  const subTotalAmount = Math.max(0, totalAmount - deliveryCharge);

  const orderr = {
    history: [
      {
        date: '2025-07-22T12:00:00Z',
        comment: 'Order placed by user',
        status: 'Pending',
        customer_notified: true,
      },
      {
        date: '2025-07-23T08:30:00Z',
        comment: 'Order packed and ready to ship',
        status: 'Processing',
        customer_notified: false,
      },
      {
        date: '2025-07-23T14:00:00Z',
        comment: 'Order shipped via BlueDart',
        status: 'Shipped',
        customer_notified: true,
      },
    ],
  };


  useEffect(() => {
    if (orderId) {
      fetch(`/api/allorders/${orderId}`)
        .then(res => res.json())
        .then(data => setOrder(data))
        .catch(err => console.error("Fetch error:", err));
    }
  }, [orderId]);

  if (!order) return <p className="text-center mt-10">Loading...</p>;
  console.log('Order:', order);

  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";


  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto bg-white">
      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-700">Orders</h2>

      {/* Top Grid */}
      <div className="grid grid-cols-3 gap-6">
  {/* Order Details */}
  <div className="bg-white shadow rounded overflow-hidden">
    <table className="w-full text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-100 border-b">
          <th className="p-2 text-left" colSpan={4}>Order Details</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <IoWalletSharp className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Payment:
          </td>
          <td className="p-2">{order.payment_method}</td>
        </tr>
        <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <MdDateRange className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Date: </td>
          <td className="p-2 ">{new Date(order.createdAt).toLocaleDateString()}</td>
        </tr>
       
        <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <MdDeliveryDining className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Pickup:</td>
          <td className="p-2">{capitalize(order.delivery_type)}</td>
        </tr>
        <tr>
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <MdOutlineLocalShipping className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Delivery Charge:</td>
          <td className="p-2">
            {deliveryCharge > 0 ? (
              <span className="font-semibold text-red-600">₹{deliveryCharge}</span>
            ) : (
              <span className="text-green-600 font-medium">Free Shipping</span>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* Customer Details */}
  <div className="bg-white shadow rounded overflow-hidden">
    <table className="w-full text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-100 border-b">
          <th className="p-2 text-left" colSpan={2}>Customer Details</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <MdContacts className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Name:</td>
          <td className="p-2">{order.order_username}</td>
        </tr>
        <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaPhoneAlt className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Phone:</td>
          <td className="p-2">{order.order_phonenumber}</td>
        </tr>
        <tr className="border-b"> 
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaStore className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            store:</td>
         <td className="p-2">{order.order_details[0]?.store_id}</td>

        </tr>
        <tr>
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <IoMdMail className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            email:</td>
          <td className="p-2">{order.email_address}</td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* Options / Invoice */}
  <div className="bg-white shadow rounded overflow-hidden">
    <table className="w-full text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-100 border-b">
          <th className="p-2 text-left" colSpan={2}>Options</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b">
          <td className="p-2" colSpan={2}>
            <textarea
              className="w-full border rounded p-2 text-sm"
              placeholder="Note: Maximum 150 characters allowed"
              maxLength={150}
              rows={3}
            />
          </td>
        </tr>
        <tr>
          <td className="p-2" colSpan={2}>
            <button className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 w-full">
              Generate Invoice
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>


      {/* Order Info */}
      <div className="bg-white p-4 shadow rounded">
        <h3 className="font-semibold text-gray-600 border-b pb-2">Order #{order.order_number}</h3>
        {/* Address */}
        <div className="mt-4">
  <table className="w-full border text-sm text-gray-700">
    <thead>
      <tr className="bg-gray-100 border-b">
        <th className="p-2 text-left">Delivery Address</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="p-2">{order.order_deliveryaddress}</td>
      </tr>
    </tbody>
  </table>
</div>



        {/* Product Table */}
        <div className="mt-4">
          <table className="w-full border text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-left">Model</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Unit Price</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
  {order.order_details?.map((item, i) => (
  <tr key={i} className="border-b">
    <td className="p-2">
  {item.slug ? (
    <a 
      href={`/product/${item.slug}`} 
      className="text-blue-600 hover:underline"
    >
      {item.product_name} - ({item.item_code.replace(/^ITEM/, "")})
    </a>
  ) : (
    <span>
      {item.product_name} - ({item.item_code.replace(/^ITEM/, "")})
    </span>
  )}
</td>

    <td className="p-2">{item.model}</td>
    <td className="p-2 text-center">{item.quantity}</td>
    <td className="p-2 text-right text-red-600">₹{item.product_price}</td>
    <td className="p-2 text-right text-red-600">₹{item.quantity * item.product_price}</td>
  </tr>
))}

{order.order_item?.map((item, index) =>
  item.extendedWarranty > 0 && (
    <tr key={index} className="font-semibold">
      <td colSpan="4" className="p-2 text-right text-[#0069c6]">
        Extended Warranty:
      </td>
      <td className="p-2 text-right text-red-600">
        ₹{item.extendedWarranty}
      </td>
    </tr>
  )
)}

  <tr className="font-semibold">
    <td colSpan="4" className="p-2 text-right">Sub-Total:</td>
    <td className="p-2 text-right">₹{subTotalAmount}</td>
  </tr>
  <tr>
    <td colSpan="4" className="p-2 text-right">Delivery Charge:</td>
    <td className={`p-2 text-right ${deliveryCharge > 0 ? "text-red-600 font-semibold" : ""}`}>
      {deliveryCharge > 0 ? `₹${deliveryCharge}` : "₹0.00"}
    </td>
  </tr>
  <tr className="font-bold bg-gray-100">
    <td colSpan="4" className="p-2 text-right">Total:</td>
    <td className="p-2 text-right">₹{order.order_amount}</td>
  </tr>
</tbody>

          </table>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white p-4 shadow rounded">
      {/* <h3 className="font-semibold text-gray-600 border-b pb-2">Order History</h3>

      <table className="w-full text-sm mt-3 border text-gray-700">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-2">Date Added</th>
            <th className="p-2">Comment</th>
            <th className="p-2">Status</th>
            <th className="p-2 text-center">Customer Notified</th>
          </tr>
        </thead>
        <tbody>
          {orderr.history.map((entry, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
              <td className="p-2">{entry.comment}</td>
              <td className="p-2">{entry.status}</td>
              <td className="p-2 text-center">
                {entry.customer_notified ? 'Yes' : 'No'}
              </td>
            </tr>
          ))}
        </tbody>
      </table> */}

      {/* Add Order History Form */}
      {/* <div className="mt-6">
        <h4 className="font-semibold text-gray-600 border-b pb-2">Add Order History</h4>
        <select className="w-full border p-2 mb-3 rounded text-sm">
          <option>Choose Status</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
        </select>
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={3}
          placeholder="Comment"
        ></textarea>
        <button className="bg-red-500 text-white px-4 py-2 rounded mt-2 hover:bg-red-700">
          Add History
        </button>
      </div> */}
    </div>
    </div>
  );
};

export default OrderDetails;
