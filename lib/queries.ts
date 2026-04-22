/**
 * React Query cache key'leri - tek yerden yönetim
 */
export const qk = {
  neighborhoods: ['neighborhoods'] as const,
  districts: ['districts'] as const,

  myAddresses: (userId: string | null) => ['my-addresses', userId] as const,
  defaultAddress: (userId: string | null) => ['default-address', userId] as const,

  myVendor: (userId: string | null) => ['my-vendor', userId] as const,
  myServiceAreas: (vendorId: string | null) =>
    ['my-service-areas', vendorId] as const,
  myProducts: (vendorId: string | null) => ['my-products', vendorId] as const,

  vendorsByNeighborhood: (neighborhoodId: string | null) =>
    ['vendors-by-neighborhood', neighborhoodId] as const,
  vendor: (vendorId: string | null) => ['vendor', vendorId] as const,
  vendorProducts: (vendorId: string | null) =>
    ['vendor-products', vendorId] as const,
  vendorReviewSummary: (vendorId: string | null) =>
    ['vendor-review-summary', vendorId] as const,

  myCustomerOrders: (userId: string | null) => ['my-customer-orders', userId] as const,
  myVendorOrders: (vendorId: string | null) => ['my-vendor-orders', vendorId] as const,
  order: (orderId: string | null) => ['order', orderId] as const,
  orderStatusHistory: (orderId: string | null) => ['order-status-history', orderId] as const,
  orderReview: (orderId: string | null) => ['order-review', orderId] as const,
};
