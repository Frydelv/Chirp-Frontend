// src/routes/+layout.server.js
import { redirect } from '@sveltejs/kit';

export function load({ cookies, url }) {
  const STOP_CHECKING = ['/login', '/register'];
  if (STOP_CHECKING.includes(url.pathname)) {
    return {};
  }
  
  if (!cookies.get('session')) {
    throw redirect(303, '/login');
  }
  
  return {};
}