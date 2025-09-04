import { customAlphabet } from 'nanoid';

export default function generateProductID() {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nanoid = customAlphabet(alphabet, 6); 
  
  return `PRD-${nanoid()}`;
}
