// src/components/StripeNavLink.tsx
'use client'

import React from 'react'
import { Link } from '@payloadcms/ui' // For a simple link
// If you want an icon:
// import { CreditCard } from 'lucide-react'; // or any other icon library

const StripeNavLink: React.FC = () => {
  return (
    <div style={{ marginTop: 'var(--base)', marginBottom: 'var(--base)' }}>
      {' '}
      {/* Basic spacing */}
      <Link
        href="/admin/stripe-dashboard" // This path must match the path defined in payload.config.ts
        className="nav-link" // You might need to style this or use a more specific Payload NavLink component if available
        activeClassName="active" // For active state styling, if supported by this Link or if you implement it
      >
        {/* <CreditCard size={20} style={{ marginRight: '10px' }} /> */}
        Stripe Dashboard
      </Link>
    </div>
  )
}

export default StripeNavLink
