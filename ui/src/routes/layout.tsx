import { Outlet } from 'react-router';
import Layout from '@/components/layout/layout';

export default function LayoutRoute() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
