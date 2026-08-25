/** Lazily loads the Razorpay Checkout script and resolves when ready. */
let loaded: Promise<boolean> | null = null;

export function loadRazorpay(): Promise<boolean> {
  if (loaded) return loaded;
  loaded = new Promise((resolve) => {
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return loaded;
}

interface RazorpayOptions {
  key: string;
  amount: number; // paise
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (res: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

export function openRazorpayCheckout(options: RazorpayOptions) {
  const Rz = (window as unknown as { Razorpay: new (o: RazorpayOptions) => { open: () => void } }).Razorpay;
  new Rz(options).open();
}
