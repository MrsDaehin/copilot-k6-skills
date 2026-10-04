export default function() {
  http.get('https://x', { tags: { operation: 'get_x' } });
}