/** wa.me needs digits only, in international form (Pakistan numbers given locally start with 0). */
export function whatsappLink(phone: string, text?: string) {
  let d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("0")) d = "92" + d.slice(1);
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
