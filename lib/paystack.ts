export const initializeTransaction = async (
  email: string,
  amount: number,
  reference: string,
  callbackUrl: string
) => {
  const params = {
    email,
    amount: amount * 100, // Paystack expects amount in kobo
    reference,
    callback_url: callbackUrl,
  };

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Paystack error: ${response.statusText}`);
  }

  return response.json();
};

export const verifyTransaction = async (reference: string) => {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Paystack error: ${response.statusText}`);
  }

  return response.json();
};
