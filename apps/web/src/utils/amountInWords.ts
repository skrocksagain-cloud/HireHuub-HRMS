/**
 * Converts a numeric amount into Indian Rupee currency words format.
 * Example: 57820 -> "Rupees Fifty-Seven Thousand Eight Hundred Twenty Only"
 */
const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tensDigits = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertValue(n: number): string {
  if (n < 20) return singleDigits[n];
  if (n < 100) return `${tensDigits[Math.floor(n / 10)]}${n % 10 !== 0 ? ` ${singleDigits[n % 10]}` : ''}`;
  if (n < 1000) return `${singleDigits[Math.floor(n / 100)]} Hundred${n % 100 !== 0 ? ` ${convertValue(n % 100)}` : ''}`;
  if (n < 100000) return `${convertValue(Math.floor(n / 1000))} Thousand${n % 1000 !== 0 ? ` ${convertValue(n % 1000)}` : ''}`;
  if (n < 10000000) return `${convertValue(Math.floor(n / 100000))} Lakh${n % 100000 !== 0 ? ` ${convertValue(n % 100000)}` : ''}`;
  return `${convertValue(Math.floor(n / 10000000))} Crore${n % 10000000 !== 0 ? ` ${convertValue(n % 10000000)}` : ''}`;
}

export function numberToWordsRupees(amount: number): string {
  const integerPart = Math.floor(amount);
  if (integerPart === 0) return 'Rupees Zero Only';
  return `Rupees ${convertValue(integerPart)} Only`;
}
