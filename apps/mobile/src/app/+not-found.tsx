import { Redirect } from 'expo-router';

/** Any unknown link (old bookmark, odd host path) lands on home instead of an error page. */
export default function NotFound() {
  return <Redirect href="/" />;
}
