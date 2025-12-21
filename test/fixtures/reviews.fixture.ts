export const mockReviewId = 'review-123';
export const mockProductId = 'product-456';
export const mockUserId = 'user-789';

export const mockReview = {
  id: mockReviewId,
  productId: mockProductId,
  userId: mockUserId,
  rating: 5,
  title: 'Great product!',
  comment: 'This is a great product!',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockReviewWithoutComment = {
  id: 'review-456',
  productId: mockProductId,
  userId: mockUserId,
  rating: 4,
  title: 'Good product',
  comment: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockReviewList = [
  mockReview,
  mockReviewWithoutComment,
  {
    id: 'review-789',
    productId: mockProductId,
    userId: 'user-999',
    rating: 3,
    title: 'Decent product',
    comment: 'Good product',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockCreateReviewDto = {
  productId: mockProductId,
  rating: 5,
  title: 'Great product!',
  comment: 'This is a great product!',
};

export const mockUpdateReviewDto = {
  rating: 4,
  title: 'Updated review',
  comment: 'Updated comment',
};
