import { customAlphabet } from 'nanoid';
import { CATEGORY } from '../models/stock.model.js';

export default function generateStockId(categoryKey) {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nanoid = customAlphabet(alphabet, 6); 
  
  return `${CATEGORY[categoryKey].slice(0, 3)}-${nanoid()}`; // CO-XYZ123
}
