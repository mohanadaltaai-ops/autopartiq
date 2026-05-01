export function generateOrderNumber() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}
