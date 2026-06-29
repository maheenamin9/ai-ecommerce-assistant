import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useChatStore from '../../store/chatStore';
import { paymentApi, reservationApi } from '../../services/api';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card' },
  { id: 'cod', label: 'Cash on Delivery' },
];

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CARD_STYLE = {
  hidePostalCode: true,
  style: {
    base: {
      color: '#fff',
      fontFamily: 'inherit',
      fontSize: '14px',
      '::placeholder': { color: '#6b7280' },
    },
    invalid: { color: '#f87171' },
  },
};

const EMPTY_ADDRESS = { street: '', city: '', state: '', zipCode: '', country: '' };

// Inner form — must be inside <Elements> to access useStripe/useElements
const PaymentForm = ({ address, totalPrice, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { items, clearCart } = useCartStore();
  const { sessionId: urlSessionId } = useParams();
  const { sessionId: storeSessionId } = useChatStore();
  const sessionId = urlSessionId || storeSessionId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    try {
      // Step 1: create payment intent + pending order on the backend
      const { data } = await paymentApi.createPaymentIntent({
        sessionId,
        items: items.map((i) => ({
          product: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        totalPrice,
        shippingAddress: address,
      });

      // Step 2: confirm the card payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        { payment_method: { card: elements.getElement(CardElement) } }
      );

      if (stripeError) {
        setError(stripeError.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        clearCart();
        onSuccess({ orderId: data.orderId, totalPrice });
      }
    } catch {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-400 mb-3">Card Details</p>
        <div className="bg-[#2f2f2f] border border-[#3f3f3f] focus-within:border-green-600 rounded-xl px-4 py-3 transition-colors">
          <CardElement options={CARD_STYLE} />
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5">
          Test card: 4242 4242 4242 4242 · any future date · any CVC
        </p>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handlePay}
        disabled={!stripe || loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
          !loading ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-[#2f2f2f] text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading && <Loader size={15} className="animate-spin" />}
        {loading ? 'Processing...' : `Pay $${totalPrice.toFixed(2)}`}
      </button>
    </div>
  );
};

// No Stripe involved — order is created and stock decremented immediately, payment happens at the door
const CodForm = ({ address, totalPrice, onSuccess }) => {
  const { items, clearCart } = useCartStore();
  const { sessionId: urlSessionId } = useParams();
  const { sessionId: storeSessionId } = useChatStore();
  const sessionId = urlSessionId || storeSessionId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await paymentApi.createCodOrder({
        sessionId,
        items: items.map((i) => ({
          product: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        totalPrice,
        shippingAddress: address,
      });

      clearCart();
      onSuccess({ orderId: data.orderId, totalPrice });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-xl px-4 py-3 text-xs text-gray-300">
        Pay with cash when your order arrives — no card details needed.
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
          !loading ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-[#2f2f2f] text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading && <Loader size={15} className="animate-spin" />}
        {loading ? 'Placing order...' : `Place Order · $${totalPrice.toFixed(2)}`}
      </button>
    </div>
  );
};

const CheckoutModal = ({ onClose }) => {
  const { items, closeCart } = useCartStore();
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [step, setStep] = useState('address'); // 'address' | 'payment' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderResult, setOrderResult] = useState(null);
  const completedRef = useRef(false);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const isAddressValid = Object.values(address).every((v) => v.trim() !== '');

  const handleChange = (e) => setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSuccess = (result) => {
    completedRef.current = true;
    setOrderResult(result);
    setStep('success');
  };

  // Release reservation when closing without payment, not in useEffect
  // (useEffect cleanup fires on React Strict Mode fake unmount, causing premature release)
  const handleClose = () => {
    if (!completedRef.current) {
      reservationApi.release().catch(() => {});
    }
    onClose();
  };

  const handleDone = () => {
    closeCart();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#1e1e1e] border border-[#3f3f3f] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2f2f2f]">
          <h2 className="text-sm font-semibold text-white">
            {step === 'success' ? 'Order Confirmed' : step === 'payment' ? 'Payment' : 'Checkout'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">

          {/* Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <CheckCircle size={48} className="text-green-500" />
              <div>
                <p className="text-white font-semibold">
                  {paymentMethod === 'cod' ? 'Order placed!' : 'Payment successful!'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Order ID: <span className="text-green-400 font-mono">{orderResult?.orderId}</span>
                </p>
              </div>
              <div className="w-full bg-[#2f2f2f] rounded-xl p-4 text-left space-y-1">
                <p className="text-xs text-gray-400">Shipping to:</p>
                <p className="text-sm text-white">{address.street}</p>
                <p className="text-sm text-white">{address.city}, {address.state} {address.zipCode}</p>
                <p className="text-sm text-white">{address.country}</p>
              </div>
              <p className="text-sm font-bold text-green-400">
                {paymentMethod === 'cod' ? 'Due on delivery' : 'Total'}: ${totalPrice.toFixed(2)}
              </p>
              <button
                onClick={handleDone}
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Step 1: Address */}
          {step === 'address' && (
            <div className="space-y-4">
              {/* Order summary */}
              <div>
                <p className="text-xs text-gray-400 mb-2">
                  Order Summary ({items.length} item{items.length !== 1 ? 's' : ''})
                </p>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-xs text-gray-300">
                      <span className="truncate max-w-[70%]">{item.name} × {item.quantity}</span>
                      <span className="text-white font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm font-bold text-white border-t border-[#2f2f2f] mt-3 pt-3">
                  <span>Total</span>
                  <span className="text-green-400">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Address fields */}
              <div>
                <p className="text-xs text-gray-400 mb-3">Shipping Address</p>
                <div className="space-y-2">
                  {[
                    { name: 'street', placeholder: 'Street address' },
                    { name: 'city', placeholder: 'City' },
                    { name: 'state', placeholder: 'State / Province' },
                    { name: 'zipCode', placeholder: 'ZIP / Postal code' },
                    { name: 'country', placeholder: 'Country' },
                  ].map(({ name, placeholder }) => (
                    <input
                      key={name}
                      name={name}
                      value={address[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className="w-full bg-[#2f2f2f] border border-[#3f3f3f] focus:border-green-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('payment')}
                disabled={!isAddressValid}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isAddressValid
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-[#2f2f2f] text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('address')}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={13} /> Back
              </button>

              <div className="flex gap-1 bg-[#2f2f2f] rounded-xl p-1">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      paymentMethod === method.id
                        ? 'bg-green-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' ? (
                <Elements stripe={stripePromise}>
                  <PaymentForm address={address} totalPrice={totalPrice} onSuccess={handleSuccess} />
                </Elements>
              ) : (
                <CodForm address={address} totalPrice={totalPrice} onSuccess={handleSuccess} />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
