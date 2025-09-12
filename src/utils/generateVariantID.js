import { customAlphabet } from "nanoid";

export default function generateVariantID() {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nanoid = customAlphabet(alphabet, 6); 
  
  return `VAR-${nanoid()}`;
}